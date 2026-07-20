const request = require('supertest');
const app = require('../../../server');
const User = require('../../../models/User');
const Order = require('../../../models/Order');
const mongoose = require('mongoose');

describe('Admin Users Routes Tests', () => {
  let adminToken;
  let adminUser;
  let normalUser;

  beforeAll(async () => {
    adminUser = new User({
      firstName: 'Admin',
      lastName: 'Users',
      email: 'admin.users@test.com',
      password: 'Password123!',
      phone: '01011112222',
      role: 'admin',
      isVerified: true,
      isActive: true
    });
    await adminUser.save();

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin.users@test.com', password: 'Password123!' });
    adminToken = loginRes.body.data.token;
  });

  beforeEach(async () => {
    await User.deleteMany({ _id: { $ne: adminUser._id } });
    await Order.deleteMany({});

    normalUser = new User({
      firstName: 'Test',
      lastName: 'User',
      email: 'test.user@test.com',
      password: 'Password123!',
      phone: '01022223333',
      role: 'user',
      isVerified: true,
      isActive: true
    });
    await normalUser.save();
  });

  describe('GET /api/admin/users', () => {
    it('should get all users with pagination', async () => {
      const res = await request(app)
        .get('/api/admin/users?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.pagination).toBeDefined();
    });

    it('should filter users by search term', async () => {
      const res = await request(app)
        .get('/api/admin/users?search=test.user')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].email).toBe('test.user@test.com');
    });

    it('should filter users by role and isActive', async () => {
      const res = await request(app)
        .get('/api/admin/users?role=admin&isActive=true')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.every(u => u.role === 'admin' && u.isActive === true)).toBe(true);
    });
  });

  describe('GET /api/admin/users/:id', () => {
    it('should get user by ID with their recent orders', async () => {
      const order = new Order({
        user: normalUser._id,
        items: [],
        subtotal: 100,
        total: 100,
        paymentMethod: 'cod'
      });
      await order.save();

      const res = await request(app)
        .get(`/api/admin/users/${normalUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user._id.toString()).toBe(normalUser._id.toString());
      expect(res.body.data.orders.length).toBe(1);
    });

    it('should return 404 for non-existent user', async () => {
      const res = await request(app)
        .get(`/api/admin/users/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(404);
    });
  });

  describe('PUT /api/admin/users/:id', () => {
    it('should update user details', async () => {
      const res = await request(app)
        .put(`/api/admin/users/${normalUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'UpdatedName'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.firstName).toBe('UpdatedName');
    });

    it('should not allow admin to remove their own admin role', async () => {
      const res = await request(app)
        .put(`/api/admin/users/${adminUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          role: 'user'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('لا يمكنك إزالة صلاحيات المسؤول عن نفسك');
    });

    it('should not allow admin to disable their own account', async () => {
      const res = await request(app)
        .put(`/api/admin/users/${adminUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          isActive: false
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('لا يمكنك تعطيل حسابك');
    });
  });

  describe('DELETE /api/admin/users/:id', () => {
    it('should soft delete user (set isActive to false)', async () => {
      const res = await request(app)
        .delete(`/api/admin/users/${normalUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      const deletedUser = await User.findById(normalUser._id);
      expect(deletedUser.isActive).toBe(false);
    });

    it('should not allow admin to delete their own account', async () => {
      const res = await request(app)
        .delete(`/api/admin/users/${adminUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('لا يمكنك حذف حسابك');
    });
  });
});
