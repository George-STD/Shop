const request = require('supertest');
const app = require('../../server');
const User = require('../../models/User');
const Product = require('../../models/Product');
const Order = require('../../models/Order');
const { encodeRespCommand, parseRespValue, HybridRateLimitStore } = require('../../utils/redisClient');
const { computePaymobHmac, verifyPaymobHmac, isPaymobConfigured } = require('../../services/paymobService');

describe('Enterprise Architecture Upgrades (Cookies, Redis, Variant Stock, Paymob)', () => {
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

    it('verifies Paymob HMAC-SHA512 webhook signature and transitions order to paid + confirmed', async () => {
      const order = await Order.create({
        user: user._id,
        items: [],
        subtotal: 300,
        shippingCost: 95,
        total: 395,
        paymentMethod: 'paymob_card',
        paymentStatus: 'pending',
        status: 'pending',
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

      // 2. Accept valid HMAC and mark order paid + confirmed
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
});
