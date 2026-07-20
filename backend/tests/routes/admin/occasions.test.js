const request = require('supertest');
const app = require('../../../server');
const User = require('../../../models/User');
const Occasion = require('../../../models/Occasion');
const mongoose = require('mongoose');

describe('Admin Occasions Routes Tests', () => {
  let adminToken;
  let adminUser;
  let occasion;

  beforeAll(async () => {
    adminUser = new User({
      firstName: 'Admin',
      lastName: 'Occasions',
      email: 'admin.occasions@test.com',
      password: 'Password123!',
      phone: '01011112222',
      role: 'admin',
      isVerified: true,
      isActive: true
    });
    await adminUser.save();

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin.occasions@test.com', password: 'Password123!' });
    adminToken = loginRes.body.data.token;
  });

  beforeEach(async () => {
    await Occasion.deleteMany({});
    
    occasion = new Occasion({
      name: 'Test Occasion',
      icon: 'test-icon',
      color: '#000000',
      isActive: true,
      order: 1
    });
    await occasion.save();
  });

  describe('GET /api/admin/occasions', () => {
    it('should get all occasions', async () => {
      const res = await request(app)
        .get('/api/admin/occasions')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
    });
  });

  describe('POST /api/admin/occasions', () => {
    it('should create an occasion', async () => {
      const res = await request(app)
        .post('/api/admin/occasions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'New Occasion',
          icon: 'icon',
          color: '#ffffff'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('New Occasion');
    });

    it('should return 400 if occasion exists', async () => {
      const res = await request(app)
        .post('/api/admin/occasions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Occasion',
          icon: 'icon',
          color: '#ffffff'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('هذه المناسبة موجودة بالفعل');
    });
  });

  describe('PUT /api/admin/occasions/:id', () => {
    it('should update an occasion', async () => {
      const res = await request(app)
        .put(`/api/admin/occasions/${occasion._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Occasion',
          isActive: false
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Updated Occasion');
      expect(res.body.data.isActive).toBe(false);
    });

    it('should return 404 for non-existent occasion', async () => {
      const res = await request(app)
        .put(`/api/admin/occasions/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Update' });

      expect(res.statusCode).toBe(404);
    });
  });

  describe('DELETE /api/admin/occasions/:id', () => {
    it('should delete an occasion', async () => {
      const res = await request(app)
        .delete(`/api/admin/occasions/${occasion._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 for non-existent occasion', async () => {
      const res = await request(app)
        .delete(`/api/admin/occasions/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(404);
    });
  });
});
