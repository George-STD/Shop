const request = require('supertest');
const app = require('../../server');
const User = require('../../models/User');
const Product = require('../../models/Product');
const Order = require('../../models/Order');
const { CONFIG } = require('../../constants');

describe('Edge Case: Order Checkout Idempotency & Duplicate Prevention', () => {
  let user;
  let userToken;
  let testProduct;

  beforeAll(async () => {
    // 1. Create a verified customer
    user = new User({
      firstName: 'Idempotency',
      lastName: 'Customer',
      email: 'idempotent.user@example.com',
      phone: '01099998888',
      password: 'Password123!',
      isVerified: true,
      isActive: true,
    });
    await user.save();

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'idempotent.user@example.com', password: 'Password123!' });
    userToken = loginRes.body.data.token;

    // 2. Create an inventory item with 20 in stock
    testProduct = new Product({
      name: 'Idempotency Test Item',
      slug: 'idempotency-test-item',
      description: 'Verifies stock is deducted only once',
      price: 150,
      stock: 20,
      isActive: true,
    });
    await testProduct.save();
  });

  it('should create an order on first submission with a unique idempotency key', async () => {
    const idempotencyKey = 'chk_test_key_001';

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        idempotencyKey,
        items: [{ productId: testProduct._id, quantity: 2 }],
        shippingAddress: {
          firstName: 'Idempotency',
          lastName: 'Customer',
          phone: '01099998888',
          governorate: 'Cairo',
          city: 'Nasr City',
          street: 'Test St 1',
          building: '10',
        },
        paymentMethod: 'cod',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.orderNumber).toBeDefined();
    expect(res.body.data.total).toBe(300 + CONFIG.BUSINESS.SHIPPING_COST_EGP);

    // Stock must decrease by 2 (20 -> 18)
    const productInDb = await Product.findById(testProduct._id);
    expect(productInDb.stock).toBe(18);
  });

  it('should return the identical existing order on second submission with same idempotency key without double-deducting stock', async () => {
    const idempotencyKey = 'chk_test_key_001'; // exact same key

    const productBeforeRetry = await Product.findById(testProduct._id);
    const stockBeforeRetry = productBeforeRetry.stock; // should be 18

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        idempotencyKey,
        items: [{ productId: testProduct._id, quantity: 2 }],
        shippingAddress: {
          firstName: 'Idempotency',
          lastName: 'Customer',
          phone: '01099998888',
          governorate: 'Cairo',
          city: 'Nasr City',
          street: 'Test St 1',
          building: '10',
        },
        paymentMethod: 'cod',
      });

    // Idempotent retry must succeed (HTTP 200/201) and return the previously created order
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.orderNumber).toBeDefined();

    // Critical assertion: Stock must NOT have decreased again
    const productAfterRetry = await Product.findById(testProduct._id);
    expect(productAfterRetry.stock).toBe(stockBeforeRetry);
  });

  it('should scope idempotency keys so different users do not collide on identical client keys', async () => {
    // Create a second user
    const user2 = new User({
      firstName: 'Second',
      lastName: 'User',
      email: 'second.user@example.com',
      phone: '01011112222',
      password: 'Password123!',
      isVerified: true,
      isActive: true,
    });
    await user2.save();

    const loginRes2 = await request(app)
      .post('/api/auth/login')
      .send({ email: 'second.user@example.com', password: 'Password123!' });
    const userToken2 = loginRes2.body.data.token;

    // User 2 sends the SAME idempotency key ('chk_test_key_001')
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken2}`)
      .send({
        idempotencyKey: 'chk_test_key_001',
        items: [{ productId: testProduct._id, quantity: 1 }],
        shippingAddress: {
          firstName: 'Second',
          lastName: 'User',
          phone: '01011112222',
          governorate: 'Giza',
          city: 'Dokki',
          street: 'Tahrir St',
          building: '5',
        },
        paymentMethod: 'cod',
      });

    // Must create a brand new order for User 2 because the key is scoped to User 2's ID
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.toString()).toBe(user2._id.toString());
  });
});
