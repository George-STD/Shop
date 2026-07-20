const request = require('supertest');
const app = require('../../../server');
const User = require('../../../models/User');
const Product = require('../../../models/Product');
const Review = require('../../../models/Review');
const mongoose = require('mongoose');

describe('Admin Reviews Routes Tests', () => {
  let adminToken;
  let adminUser;
  let review;

  beforeAll(async () => {
    adminUser = new User({
      firstName: 'Admin',
      lastName: 'Reviews',
      email: 'admin.reviews@test.com',
      password: 'Password123!',
      phone: '01011112222',
      role: 'admin',
      isVerified: true,
      isActive: true
    });
    await adminUser.save();

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin.reviews@test.com', password: 'Password123!' });
    adminToken = loginRes.body.data.token;
  });

  beforeEach(async () => {
    await Review.deleteMany({});
    
    review = new Review({
      user: adminUser._id,
      product: new mongoose.Types.ObjectId(),
      rating: 5,
      comment: 'Great product',
      isApproved: false
    });
    await review.save();
  });

  describe('GET /api/admin/reviews', () => {
    it('should get all reviews with pagination', async () => {
      const res = await request(app)
        .get('/api/admin/reviews?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
    });

    it('should filter reviews by approved status', async () => {
      const res = await request(app)
        .get('/api/admin/reviews?approved=false')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].isApproved).toBe(false);
    });
  });

  describe('PUT /api/admin/reviews/:id/approve', () => {
    it('should approve a review', async () => {
      const res = await request(app)
        .put(`/api/admin/reviews/${review._id}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          isApproved: true
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isApproved).toBe(true);
    });

    it('should return 404 for non-existent review', async () => {
      const res = await request(app)
        .put(`/api/admin/reviews/${new mongoose.Types.ObjectId()}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isApproved: true });

      expect(res.statusCode).toBe(404);
    });
  });

  describe('DELETE /api/admin/reviews/:id', () => {
    it('should delete a review', async () => {
      const res = await request(app)
        .delete(`/api/admin/reviews/${review._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 for non-existent review', async () => {
      const res = await request(app)
        .delete(`/api/admin/reviews/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(404);
    });
  });
});
