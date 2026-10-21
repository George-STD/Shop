const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../server');
const User = require('../../models/User');
const Product = require('../../models/Product');
const Order = require('../../models/Order');
const { encodeRespCommand, parseRespValue, HybridRateLimitStore } = require('../../utils/redisClient');
const { computePaymobHmac, verifyPaymobHmac, isPaymobConfigured } = require('../../services/paymobService');

describe('Enterprise Architecture Upgrades (Cookies, Redis, Variant Stock, Paymob)', () => {
  jest.setTimeout(30000);
  let user;
  let authCookie;
  let token;

  beforeAll(async () => {
    user = await User.create({
      firstName: 'Enterprise',
      lastName: 'Tester',
      email: 'enterprise@example.com',
      phone: '01099998888',
      password: 'Password123!',
      isVerified: true,
      isActive: true,
    });
  });

  describe('1. httpOnly Secure Cookie Authentication', () => {
    it('sets an httpOnly token cookie on login and authenticates /api/auth/me via Cookie header alone', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'enterprise@example.com', password: 'Password123!' });

      expect(loginRes.statusCode).toBe(200);
      expect(loginRes.body.success).toBe(true);
      token = loginRes.body.data.token;

      const setCookieHeaders = loginRes.headers['set-cookie'];
      expect(Array.isArray(setCookieHeaders)).toBe(true);
      const tokenCookie = setCookieHeaders.find((c) => c.startsWith('token='));
      expect(tokenCookie).toBeDefined();
      expect(tokenCookie).toContain('HttpOnly');
      expect(tokenCookie).toContain('Path=/');

      authCookie = tokenCookie.split(';')[0];

      // Authenticate using ONLY the Cookie header (no Authorization Bearer header)
      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Cookie', authCookie);

      expect(meRes.statusCode).toBe(200);
      expect(meRes.body.success).toBe(true);
      expect(meRes.body.data.email).toBe('enterprise@example.com');
    });
  });

  describe('2. Distributed Redis RESP2 Protocol & HybridRateLimitStore', () => {
    it('accurately encodes and parses RESP2 protocol frames', () => {
      const encoded = encodeRespCommand(['SET', 'cache:key', '{"ok":true}', 'PX', '30000']);
      expect(encoded).toBe('*5\r\n$3\r\nSET\r\n$9\r\ncache:key\r\n$11\r\n{"ok":true}\r\n$2\r\nPX\r\n$5\r\n30000\r\n');

      const simpleOk = parseRespValue(Buffer.from('+OK\r\n'));
      expect(simpleOk.value).toBe('OK');

      const integerReply = parseRespValue(Buffer.from(':42\r\n'));
      expect(integerReply.value).toBe(42);

      const bulkReply = parseRespValue(Buffer.from('$11\r\n{"ok":true}\r\n'));
      expect(bulkReply.value).toBe('{"ok":true}');

      const arrayReply = parseRespValue(Buffer.from('*2\r\n$1\r\n0\r\n*1\r\n$7\r\nkey:one\r\n'));
      expect(arrayReply.value).toEqual(['0', ['key:one']]);
    });

    it('increments, decrements, and resets keys in HybridRateLimitStore', async () => {
      const store = new HybridRateLimitStore('rl:test:');
      store.init({ windowMs: 60000 });

      const first = await store.increment('127.0.0.1');
      expect(first.totalHits).toBe(1);
      expect(first.resetTime).toBeInstanceOf(Date);

      const second = await store.increment('127.0.0.1');
      expect(second.totalHits).toBe(2);

      await store.decrement('127.0.0.1');
      const third = await store.increment('127.0.0.1');
      expect(third.totalHits).toBe(2);

      await store.resetKey('127.0.0.1');
      const afterReset = await store.increment('127.0.0.1');
      expect(afterReset.totalHits).toBe(1);
    });
  });

  describe('3. Variant-Level SKU Inventory Management', () => {
    let variantProduct;

    beforeAll(async () => {
      variantProduct = await Product.create({
        name: 'Variant Gift Mug',
        slug: 'variant-gift-mug',
        description: 'Mug with per-size, per-color, per-shape, and per-variantGroup inventory',
        price: 150,
        stock: 10,
        isActive: true,
        sizes: [
          { name: 'M', price: 150, stock: 2, sku: 'MUG-M' },
          { name: 'L', price: 180, stock: 8, sku: 'MUG-L' },
        ],
        colors: [
          { name: 'أحمر', hex: '#ff0000', stock: 1, sku: 'MUG-RED' },
          { name: 'أزرق', hex: '#0000ff', stock: 9, sku: 'MUG-BLUE' },
        ],
        shapes: [
          { name: 'دائري', images: [], stock: 3 },
        ],
        variantGroups: [
          {
            name: 'التغليف',
            options: [
              { name: 'فاخر', stock: 2, priceDelta: 20, sku: 'WRAP-LUX' },
            ],
          },
        ],
      });
    });

    it('blocks ordering a quantity that exceeds variant-specific stock even when total product stock is sufficient', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Cookie', authCookie)
        .send({
          items: [
            {
              productId: variantProduct._id,
              quantity: 2, // 'أحمر' only has stock: 1
              selectedSize: 'M',
              selectedColor: 'أحمر',
              selectedShape: 'دائري',
              selectedVariants: { التغليف: 'فاخر' },
            },
          ],
          shippingAddress: {
            firstName: 'Enterprise',
            lastName: 'Tester',
            phone: '01099998888',
            governorate: 'القاهرة',
            street: '10 Variant St',
          },
          paymentMethod: 'cod',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('atomically deducts and restores variant-level stock across order creation and cancellation', async () => {
      const createRes = await request(app)
        .post('/api/orders')
        .set('Cookie', authCookie)
        .send({
          items: [
            {
              productId: variantProduct._id,
              quantity: 1,
              selectedSize: 'M',
              selectedColor: 'أحمر',
              selectedShape: 'دائري',
              selectedVariants: { التغليف: 'فاخر' },
            },
          ],
          shippingAddress: {
            firstName: 'Enterprise',
            lastName: 'Tester',
            phone: '01099998888',
            governorate: 'القاهرة',
            street: '10 Variant St',
          },
          paymentMethod: 'cod',
        });

      expect(createRes.statusCode).toBe(201);
      const orderId = createRes.body.data._id;

      // Verify variant stock was deducted
      const afterOrderProd = await Product.findById(variantProduct._id);
      expect(afterOrderProd.stock).toBe(9);
      expect(afterOrderProd.sizes.find((s) => s.name === 'M').stock).toBe(1);
      expect(afterOrderProd.colors.find((c) => c.name === 'أحمر').stock).toBe(0);
      expect(afterOrderProd.shapes.find((sh) => sh.name === 'دائري').stock).toBe(2);
      expect(afterOrderProd.variantGroups[0].options[0].stock).toBe(1);

      // Cancel the order and verify variant stock is restored
      const cancelRes = await request(app)
        .put(`/api/orders/${orderId}/cancel`)
        .set('Cookie', authCookie)
        .send({ reason: 'Testing variant stock restoration' });

      expect(cancelRes.statusCode).toBe(200);

      const afterCancelProd = await Product.findById(variantProduct._id);
      expect(afterCancelProd.stock).toBe(10);
      expect(afterCancelProd.sizes.find((s) => s.name === 'M').stock).toBe(2);
      expect(afterCancelProd.colors.find((c) => c.name === 'أحمر').stock).toBe(1);
      expect(afterCancelProd.shapes.find((sh) => sh.name === 'دائري').stock).toBe(3);
      expect(afterCancelProd.variantGroups[0].options[0].stock).toBe(2);
    });
  });

  describe('4. Paymob Payment Gateway & HMAC-SHA512 Webhook', () => {
    const TEST_HMAC_SECRET = 'paymob_unit_test_hmac_secret_key_12345';

    beforeAll(() => {
      process.env.PAYMOB_HMAC_SECRET = TEST_HMAC_SECRET;
      process.env.PAYMOB_SECRET_KEY = 'sk_test_mock_secret';
      process.env.PAYMOB_PUBLIC_KEY = 'pk_test_mock_public';
      process.env.PAYMOB_CARD_INTEGRATION_ID = '445566';
    });

    afterAll(() => {
      delete process.env.PAYMOB_HMAC_SECRET;
      delete process.env.PAYMOB_SECRET_KEY;
      delete process.env.PAYMOB_PUBLIC_KEY;
      delete process.env.PAYMOB_CARD_INTEGRATION_ID;
    });

    it('reports Paymob configuration status via GET /api/settings/payment', async () => {
      expect(isPaymobConfigured()).toBe(true);

      const res = await request(app).get('/api/settings/payment');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.paymobEnabled).toBe(true);
      expect(res.body.data.cardEnabled).toBe(true);
      expect(res.body.data.mode).toBe('test');
    });

    it('verifies Paymob HMAC-SHA512 webhook signature, blocks amount/order spoofing, and transitions valid order to paid + confirmed', async () => {
      const order = await Order.create({
        user: user._id,
        items: [],
        subtotal: 300,
        shippingCost: 95,
        total: 395,
        paymentMethod: 'paymob_card',
        paymentStatus: 'pending',
        status: 'pending',
        paymentDetails: {
          gateway: 'paymob',
          paymobOrderId: '11223344',
        },
        shippingAddress: {
          firstName: 'Enterprise',
          lastName: 'Tester',
          phone: '01099998888',
          governorate: 'القاهرة',
          street: 'Paymob St',
        },
      });

      const expensiveOrder = await Order.create({
        user: user._id,
        items: [],
        subtotal: 4905,
        shippingCost: 95,
        total: 5000,
        paymentMethod: 'paymob_card',
        paymentStatus: 'pending',
        status: 'pending',
        paymentDetails: {
          gateway: 'paymob',
          paymobOrderId: '99887766',
        },
        shippingAddress: {
          firstName: 'Enterprise',
          lastName: 'Tester',
          phone: '01099998888',
          governorate: 'القاهرة',
          street: 'Paymob St',
        },
      });

      const txObj = {
        id: 987654321,
        pending: false,
        amount_cents: 39500,
        success: true,
        is_auth: false,
        is_capture: false,
        is_standalone_payment: true,
        is_voided: false,
        is_refunded: false,
        is_3d_secure: true,
        integration_id: 445566,
        has_parent_transaction: false,
        order: {
          id: 11223344,
          merchant_order_id: order.orderNumber,
        },
        created_at: '2026-10-14T16:00:00.000000',
        currency: 'EGP',
        source_data: {
          pan: '2346',
          type: 'card',
          sub_type: 'MasterCard',
        },
        error_occured: false,
        owner: 556677,
      };

      const validHmac = computePaymobHmac(txObj, TEST_HMAC_SECRET);
      expect(verifyPaymobHmac(txObj, validHmac, TEST_HMAC_SECRET)).toBe(true);

      // 1. Reject forged HMAC
      const badRes = await request(app)
        .post('/api/webhooks/paymob?hmac=deadbeef123456')
        .send({ obj: txObj });
      expect(badRes.statusCode).toBe(401);

      // 2. Reject cross-order spoofing (tampering unsigned merchant_order_id to point to expensiveOrder)
      const spoofedTxObj = {
        ...txObj,
        order: {
          id: 11223344,
          merchant_order_id: expensiveOrder.orderNumber,
        },
      };
      const spoofRes = await request(app)
        .post(`/api/webhooks/paymob?hmac=${validHmac}`)
        .send({ obj: spoofedTxObj });
      expect(spoofRes.statusCode).toBe(400);
      const checkExpensive = await Order.findById(expensiveOrder._id);
      expect(checkExpensive.paymentStatus).toBe('pending');

      // 3. Reject underpaid amount_cents even with valid HMAC for expensiveOrder
      const underpaidTxObj = {
        ...txObj,
        amount_cents: 1000, // 10 EGP instead of 5000 EGP
        order: {
          id: 99887766,
          merchant_order_id: expensiveOrder.orderNumber,
        },
      };
      const underpaidHmac = computePaymobHmac(underpaidTxObj, TEST_HMAC_SECRET);
      const underpaidRes = await request(app)
        .post(`/api/webhooks/paymob?hmac=${underpaidHmac}`)
        .send({ obj: underpaidTxObj });
      expect(underpaidRes.statusCode).toBe(400);

      // 4. Accept valid HMAC with matching paymobOrderId, amount_cents, and currency
      const okRes = await request(app)
        .post(`/api/webhooks/paymob?hmac=${validHmac}`)
        .send({ obj: txObj });

      expect(okRes.statusCode).toBe(200);
      expect(okRes.body.matched).toBe(true);
      expect(okRes.body.paymentStatus).toBe('paid');

      const updatedOrder = await Order.findById(order._id);
      expect(updatedOrder.paymentStatus).toBe('paid');
      expect(updatedOrder.status).toBe('confirmed');
      expect(updatedOrder.paymentDetails.transactionId).toBe('987654321');
      expect(updatedOrder.paymentDetails.paymobOrderId).toBe('11223344');
    });

    it('authenticates optional review submission via httpOnly cookie alone and supports variant SKU barcode lookup', async () => {
      const reviewProd = await Product.create({
        name: 'Cookie Review Product',
        slug: 'cookie-review-product',
        description: 'Product reviewed using httpOnly cookie auth',
        price: 120,
        stock: 5,
        isActive: true,
        sizes: [{ name: 'XL', price: 120, stock: 5, sku: 'VAR-SKU-XL99' }],
      });

      const reviewRes = await request(app)
        .post('/api/reviews')
        .set('Cookie', authCookie)
        .send({
          product: reviewProd._id.toString(),
          rating: 5,
          comment: 'تقييم ممتاز باستخدام الكوكي المشفرة فقط بدون ترويسة Bearer!',
        });

      expect(reviewRes.statusCode).toBe(201);
      expect(reviewRes.body.success).toBe(true);
      expect(reviewRes.body.data.user._id.toString()).toBe(user._id.toString());
    });

    it('clears the httpOnly cookie and invalidates session on logout', async () => {
      const logoutRes = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', authCookie);

      expect(logoutRes.statusCode).toBe(200);
      const setCookie = logoutRes.headers['set-cookie']?.find((c) => c.startsWith('token='));
      expect(setCookie).toBeDefined();

      // Old cookie should now be rejected because tokenVersion was incremented
      const meAfterLogout = await request(app)
        .get('/api/auth/me')
        .set('Cookie', authCookie);
      expect(meAfterLogout.statusCode).toBe(401);
    });
  });

  describe('5. Multi-Vector Security & Logic Fixes Verification', () => {
    let freshCookie;

    beforeAll(async () => {
      const freshUser = await User.findById(user._id);
      const testToken = jwt.sign(
        { id: user._id, v: freshUser.tokenVersion || 0 },
        process.env.JWT_SECRET || 'ci_pipeline_dummy_jwt_secret_key_minimum_32_characters_123',
        { expiresIn: '1d' }
      );
      freshCookie = `token=${testToken}`;
    });

    it('enforces cumulative variant quantity check across duplicate cart items for the same variant', async () => {
      const varProd = await Product.create({
        name: 'Cumulative Variant Test Product',
        slug: 'cumulative-var-prod',
        description: 'وصف تجريبي لفحص مخزون المقاس التراكمي',
        price: 100,
        stock: 50,
        isActive: true,
        sizes: [{ name: 'M', price: 100, stock: 5 }],
      });

      // User adds 3 units in line 1 and 3 units in line 2 (total 6 > stock 5)
      const orderRes = await request(app)
        .post('/api/orders')
        .set('Cookie', freshCookie)
        .send({
          items: [
            { productId: varProd._id.toString(), quantity: 3, selectedSize: 'M' },
            { productId: varProd._id.toString(), quantity: 3, selectedSize: 'M' },
          ],
          shippingAddress: {
            street: '123 Test St',
            city: 'Cairo',
            governorate: 'Cairo',
            phone: '01012345678',
          },
          paymentMethod: 'cod',
        });

      expect(orderRes.statusCode).toBe(400);
      expect(orderRes.body.message).toContain('الكمية غير متوفرة للمنتج');
      expect(orderRes.body.message).toContain('(مقاس M)');
    });

    it('allows Paymob webhook fallback via merchant_order_id when paymobOrderId is not yet assigned', async () => {
      const testSecret = 'paymob_unit_test_hmac_secret_key_12345';
      process.env.PAYMOB_HMAC_SECRET = testSecret;

      const fallbackOrder = await Order.create({
        orderNumber: 'ORD-FALLBACK-100',
        total: 150,
        subtotal: 150,
        status: 'pending',
        paymentStatus: 'pending',
        paymentMethod: 'paymob',
        paymentDetails: { gateway: 'paymob' },
        shippingAddress: { street: '123', city: 'Cairo', governorate: 'Cairo', phone: '01011112222' },
        items: [],
      });

      const txObj = {
        id: 778899,
        amount_cents: 15000,
        currency: 'EGP',
        success: true,
        pending: false,
        is_refunded: false,
        is_voided: false,
        order: {
          id: 998877,
          merchant_order_id: 'ORD-FALLBACK-100',
        },
      };

      const validHmac = computePaymobHmac(txObj, testSecret);
      const res = await request(app)
        .post(`/api/webhooks/paymob?hmac=${validHmac}`)
        .send({ obj: txObj });

      expect(res.statusCode).toBe(200);
      expect(res.body.matched).toBe(true);

      const updated = await Order.findById(fallbackOrder._id);
      expect(updated.paymentStatus).toBe('paid');
      expect(updated.paymentDetails.paymobOrderId).toBe('998877');

      delete process.env.PAYMOB_HMAC_SECRET;
    });

    it('supports DEDUCTED type in LoyaltyLedger without schema validation error', async () => {
      const LoyaltyLedger = require('../../models/LoyaltyLedger');
      const ledgerEntry = await LoyaltyLedger.create({
        user: user._id,
        points: -50,
        type: 'DEDUCTED',
        reason: 'خصم نقاط لطلب تم إلغاؤه بعد التسليم',
        idempotencyKey: 'test:deducted:key:1',
      });
      expect(ledgerEntry.type).toBe('DEDUCTED');
    });

    it('gracefully ignores null/empty option strings in selectedVariants without throwing validation error', async () => {
      const vgProduct = await Product.create({
        name: 'Empty Option Test Product',
        slug: 'empty-opt-prod',
        description: 'وصف لفحص تجاهل الخيارات الفارغة',
        price: 80,
        stock: 30,
        isActive: true,
        variantGroups: [
          {
            name: 'Material',
            options: [{ name: 'Cotton', stock: 15, priceDelta: 0 }],
          },
        ],
      });

      const orderRes = await request(app)
        .post('/api/orders')
        .set('Cookie', freshCookie)
        .send({
          items: [
            {
              productId: vgProduct._id.toString(),
              quantity: 1,
              selectedVariants: {
                Material: 'Cotton',
                OptionalAddon: '', // Empty option string that should be ignored
              },
            },
          ],
          shippingAddress: {
            street: '123 Test St',
            city: 'Cairo',
            governorate: 'Cairo',
            phone: '01012345678',
          },
          paymentMethod: 'cod',
        });

      expect(orderRes.statusCode).toBe(201);
      expect(orderRes.body.success).toBe(true);
    });

    it('tracks pointsRefunded flag, preserves pointsRedeemed on cancellation, and re-deducts points on admin reactivation', async () => {
      const admin = await User.create({
        firstName: 'LoyaltyAdmin',
        lastName: 'Tester',
        email: 'loyaltyadmin@example.com',
        phone: '01044443333',
        password: 'Password123!',
        role: 'admin',
        isVerified: true,
        isActive: true,
      });

      const adminToken = jwt.sign(
        { id: admin._id, v: admin.tokenVersion || 0 },
        process.env.JWT_SECRET || 'ci_pipeline_dummy_jwt_secret_key_minimum_32_characters_123',
        { expiresIn: '1d' }
      );

      await User.updateOne({ _id: user._id }, { $set: { loyaltyPoints: 200 } });

      const loyaltyOrder = await Order.create({
        orderNumber: 'ORD-LOYALTY-REFUND-1',
        user: user._id,
        items: [],
        total: 100,
        subtotal: 150,
        pointsRedeemed: 50,
        pointsDiscount: 50,
        pointsRefunded: false,
        status: 'pending',
        paymentMethod: 'cod',
        shippingAddress: {
          street: '123 Loyalty Way',
          city: 'Cairo',
          governorate: 'Cairo',
          phone: '01011112222',
        },
      });

      // 1. Cancel the order as user
      const cancelRes = await request(app)
        .put(`/api/orders/${loyaltyOrder._id}/cancel`)
        .set('Cookie', freshCookie)
        .send({ reason: 'Changed my mind' });

      expect(cancelRes.statusCode).toBe(200);

      const cancelledOrder = await Order.findById(loyaltyOrder._id);
      expect(cancelledOrder.status).toBe('cancelled');
      expect(cancelledOrder.pointsRefunded).toBe(true);
      expect(cancelledOrder.pointsRedeemed).toBe(50); // Preserved!

      const userAfterCancel = await User.findById(user._id);
      expect(userAfterCancel.loyaltyPoints).toBe(250); // 200 + 50 restored

      // 2. Admin un-cancels (reactivates) order
      const reactivateRes = await request(app)
        .put(`/api/admin/orders/${loyaltyOrder._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'processing' });

      expect(reactivateRes.statusCode).toBe(200);

      const reactivatedOrder = await Order.findById(loyaltyOrder._id);
      expect(reactivatedOrder.status).toBe('processing');
      expect(reactivatedOrder.pointsRefunded).toBe(false);

      const userAfterReactivate = await User.findById(user._id);
      expect(userAfterReactivate.loyaltyPoints).toBe(200); // 50 re-deducted!

      // 3. Cancel again via admin, spend the points, and verify admin reactivation fails
      const adminCancelRes = await request(app)
        .put(`/api/admin/orders/${loyaltyOrder._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'cancelled' });

      expect(adminCancelRes.statusCode).toBe(200);

      // Customer spends refunded points
      await User.updateOne({ _id: user._id }, { $set: { loyaltyPoints: 10 } });

      const blockedRes = await request(app)
        .put(`/api/admin/orders/${loyaltyOrder._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'processing' });

      expect(blockedRes.statusCode).toBe(400);
      expect(blockedRes.body.message).toContain('لا يمكن إعادة تفعيل الطلب لأن العميل استهلك نقاط الولاء المستردة');
    });
  });
});
