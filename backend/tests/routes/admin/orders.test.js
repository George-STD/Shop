const request = require('supertest');
const app = require('../../../server');
const User = require('../../../models/User');
const Order = require('../../../models/Order');
const Product = require('../../../models/Product');
const mongoose = require('mongoose');

describe('Admin Orders Routes Tests', () => {
  let adminToken;
  let adminUser;
  let normalUserToken;

  beforeAll(async () => {
    adminUser = new User({
      firstName: 'Admin',
      lastName: 'Orders',
      email: 'admin.orders@test.com',
      password: 'Password123!',
      phone: '01055556666',
      role: 'admin',
      isVerified: true,
      isActive: true
    });
    await adminUser.save();

    const normalUser = new User({
      firstName: 'Normal',
      lastName: 'Orders',
      email: 'user.orders@test.com',
      password: 'Password123!',
      phone: '01077778888',
      role: 'user',
      isVerified: true,
      isActive: true
    });
    await normalUser.save();

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin.orders@test.com', password: 'Password123!' });
    adminToken = loginRes.body.data.token;

    const userLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user.orders@test.com', password: 'Password123!' });
    normalUserToken = userLoginRes.body.data.token;
  });

  beforeEach(async () => {
    await Order.deleteMany({});
  });

  const createDummyOrder = async (status = 'pending') => {
    const order = new Order({
      user: adminUser._id,
      items: [{
        product: new mongoose.Types.ObjectId(),
        name: 'Test Product',
        quantity: 1,
        price: 100
      }],
      shippingAddress: {
        firstName: 'Test',
        lastName: 'Name',
        phone: '01011112222',
        address: 'Test Address',
        city: 'Cairo'
      },
      paymentMethod: 'cod',
      subtotal: 100,
      total: 150,
      status: status
    });
    return await order.save();
  };

  describe('GET /api/admin/orders', () => {
    it('should get all orders with pagination', async () => {
      await createDummyOrder();
      await createDummyOrder('processing');

      const res = await request(app)
        .get('/api/admin/orders?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
      expect(res.body.pagination).toBeDefined();
    });

    it('should filter orders by status', async () => {
      await createDummyOrder('pending');
      await createDummyOrder('processing');

      const res = await request(app)
        .get('/api/admin/orders?status=processing')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].status).toBe('processing');
    });

    it('should forbid access to non-admin users', async () => {
      const res = await request(app)
        .get('/api/admin/orders')
        .set('Authorization', `Bearer ${normalUserToken}`);

      expect(res.statusCode).toBe(403);
    });
  });

  describe('GET /api/admin/orders/:id', () => {
    it('should get an order by ID', async () => {
      const order = await createDummyOrder();

      const res = await request(app)
        .get(`/api/admin/orders/${order._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id.toString()).toBe(order._id.toString());
    });

    it('should return 404 for non-existent order', async () => {
      const res = await request(app)
        .get(`/api/admin/orders/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(404);
    });
  });

  describe('PUT /api/admin/orders/:id/status', () => {
    it('should update order status', async () => {
      const order = await createDummyOrder('pending');

      const res = await request(app)
        .put(`/api/admin/orders/${order._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'shipped',
          note: 'Shipped via courier'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('shipped');
      expect(res.body.data.statusHistory.length).toBe(1);
      expect(res.body.data.statusHistory[0].note).toBe('تم تحديث الحالة بواسطة المسؤول');
    });

    it('should return 500 or 400 for invalid status', async () => {
      const order = await createDummyOrder();

      const res = await request(app)
        .put(`/api/admin/orders/${order._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'invalid_status'
        });

      // Mongoose validation error results in 500 or 400 depending on error handler
      expect([400, 500]).toContain(res.statusCode);
    });
  });
});
