const request = require('supertest');
const app = require('../../../server');
const User = require('../../../models/User');
const Category = require('../../../models/Category');
const Product = require('../../../models/Product');
const mongoose = require('mongoose');

describe('Admin Categories Routes Tests', () => {
  let adminToken;
  let adminUser;
  let category;

  beforeAll(async () => {
    adminUser = new User({
      firstName: 'Admin',
      lastName: 'Categories',
      email: 'admin.categories@test.com',
      password: 'Password123!',
      phone: '01011112222',
      role: 'admin',
      isVerified: true,
      isActive: true
    });
    await adminUser.save();

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin.categories@test.com', password: 'Password123!' });
    adminToken = loginRes.body.data.token;
  });

  beforeEach(async () => {
    await Category.deleteMany({});
    await Product.deleteMany({});
    
    category = new Category({
      name: 'Test Category',
      slug: 'test-category',
      description: 'Desc'
    });
    await category.save();
  });

  describe('POST /api/admin/categories', () => {
    it('should create a new category', async () => {
      const res = await request(app)
        .post('/api/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'New Category',
          slug: 'new-category'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('New Category');
    });

    it('should return 400 if validation fails', async () => {
      const res = await request(app)
        .post('/api/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.statusCode).toBe(400);
    });
  });

  describe('PUT /api/admin/categories/:id', () => {
    it('should update a category', async () => {
      const res = await request(app)
        .put(`/api/admin/categories/${category._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Category'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Updated Category');
    });

    it('should return 404 for non-existent category', async () => {
      const res = await request(app)
        .put(`/api/admin/categories/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Update' });

      expect(res.statusCode).toBe(404);
    });
  });

  describe('DELETE /api/admin/categories/:id', () => {
    it('should delete a category without products', async () => {
      const res = await request(app)
        .delete(`/api/admin/categories/${category._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should not delete a category with products', async () => {
      const product = new Product({
        name: 'Cat Product',
        slug: 'cat-product',
        description: 'Desc',
        price: 100,
        category: category._id
      });
      await product.save();

      const res = await request(app)
        .delete(`/api/admin/categories/${category._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('لا يمكن حذف الفئة لأنها تحتوي على');
    });

    it('should return 404 for non-existent category', async () => {
      const res = await request(app)
        .delete(`/api/admin/categories/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(404);
    });
  });
});
