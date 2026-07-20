const request = require('supertest');
const app = require('../../../server');
const User = require('../../../models/User');
const Product = require('../../../models/Product');
const Order = require('../../../models/Order');
const AuditLog = require('../../../models/AuditLog');
const mongoose = require('mongoose');

describe('Admin Stats Routes Tests', () => {
  let adminToken;
  let adminUser;
  let normalUserToken;

  beforeAll(async () => {
    adminUser = new User({
      firstName: 'Admin',
      lastName: 'Stats',
      email: 'admin.stats@test.com',
      password: 'Password123!',
      phone: '01066667777',
      role: 'admin',
      isVerified: true,
      isActive: true
    });
    await adminUser.save();

    const normalUser = new User({
      firstName: 'Normal',
      lastName: 'Stats',
      email: 'user.stats@test.com',
      password: 'Password123!',
      phone: '01088889999',
      role: 'user',
      isVerified: true,
      isActive: true
    });
    await normalUser.save();

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin.stats@test.com', password: 'Password123!' });
    adminToken = loginRes.body.data.token;

    const userLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user.stats@test.com', password: 'Password123!' });
    normalUserToken = userLoginRes.body.data.token;
  });

  beforeEach(async () => {
    await Product.deleteMany({});
    await Order.deleteMany({});
    await AuditLog.deleteMany({});
  });

  describe('GET /api/admin/stats', () => {
    it('should return dashboard stats', async () => {
      const product = new Product({
        name: 'Test Product',
        slug: 'test-product',
        description: 'Test Description',
        price: 100,
        images: [{ url: 'test.jpg' }],
        isActive: true,
        salesCount: 5
      });
      await product.save();

      const order = new Order({
        user: adminUser._id,
        items: [{
          product: product._id,
          name: product.name,
          quantity: 2,
          price: product.price
        }],
        shippingAddress: {
          fullName: 'Test Name',
          phone: '01011112222',
          address: 'Test Address',
          city: 'Cairo'
        },
        paymentMethod: 'cod',
        subtotal: 200,
        shippingPrice: 50,
        total: 250,
        status: 'delivered'
      });
      await order.save();

      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.overview).toBeDefined();
      expect(res.body.data.overview.totalProducts).toBe(1);
      expect(res.body.data.overview.totalOrders).toBe(1);
      expect(res.body.data.overview.totalRevenue).toBe(250);
      expect(res.body.data.topProducts.length).toBe(1);
      expect(res.body.data.recentOrders.length).toBe(1);
    });

    it('should forbid access to non-admin users', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${normalUserToken}`);

      expect(res.statusCode).toBe(403);
    });
  });

  describe('GET /api/admin/analysis', () => {
    it('should return analysis data', async () => {
      const catId = new mongoose.Types.ObjectId();
      const product = new Product({
        name: 'Analysis Product',
        slug: 'analysis-product',
        description: 'Desc',
        price: 100,
        images: [{ url: 'test.jpg' }],
        isActive: true,
        category: catId
      });
      await product.save();

      const order = new Order({
        user: adminUser._id,
        items: [{
          product: product._id,
          name: product.name,
          quantity: 3,
          price: product.price
        }],
        shippingAddress: {
          fullName: 'Test Name',
          phone: '01011112222',
          address: 'Test Address',
          city: 'Cairo'
        },
        paymentMethod: 'cod',
        subtotal: 300,
        shippingPrice: 50,
        total: 350,
        status: 'delivered'
      });
      await order.save();

      const res = await request(app)
        .get('/api/admin/analysis')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.productSales).toBeDefined();
      expect(res.body.data.productSales.length).toBe(1);
      expect(res.body.data.productSales[0].name).toBe('Analysis Product');
      expect(res.body.data.productSales[0].sales).toBe(3);
    });
  });

  describe('GET /api/admin/logs', () => {
    it('should return audit logs', async () => {
      const log = new AuditLog({
        adminId: adminUser._id,
        action: 'CREATE',
        entityType: 'Product',
        entityId: new mongoose.Types.ObjectId(),
        details: 'Testing logs'
      });
      await log.save();

      const res = await request(app)
        .get('/api/admin/logs')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].action).toBe('CREATE');
    });

    it('should filter logs by action and entityType', async () => {
      await AuditLog.create([
        {
          adminId: adminUser._id,
          action: 'UPDATE',
          entityType: 'User',
          entityId: new mongoose.Types.ObjectId()
        },
        {
          adminId: adminUser._id,
          action: 'DELETE',
          entityType: 'Order',
          entityId: new mongoose.Types.ObjectId()
        }
      ]);

      const res = await request(app)
        .get('/api/admin/logs?action=UPDATE&entityType=User')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].action).toBe('UPDATE');
    });
  });
});
