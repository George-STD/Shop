const request = require('supertest');
const app = require('../../../server');
const User = require('../../../models/User');
const Product = require('../../../models/Product');
const mongoose = require('mongoose');

describe('Admin Products Routes Tests', () => {
  let adminToken;
  let adminUser;
  let product;

  beforeAll(async () => {
    adminUser = new User({
      firstName: 'Admin',
      lastName: 'Products',
      email: 'admin.products@test.com',
      password: 'Password123!',
      phone: '01011112222',
      role: 'admin',
      isVerified: true,
      isActive: true
    });
    await adminUser.save();

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin.products@test.com', password: 'Password123!' });
    adminToken = loginRes.body.data.token;
  });

  beforeEach(async () => {
    await Product.deleteMany({});
    
    product = new Product({
      name: 'Test Product',
      slug: 'test-product',
      description: 'Desc',
      price: 100,
      images: [{ url: 'test.jpg' }],
      isActive: true,
      sku: 'TEST-SKU-1'
    });
    await product.save();
  });

  describe('GET /api/admin/products', () => {
    it('should get all products with pagination and search', async () => {
      const res = await request(app)
        .get('/api/admin/products?search=TEST-SKU-1&page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
    });
  });

  describe('POST /api/admin/products', () => {
    it('should create a new product', async () => {
      const res = await request(app)
        .post('/api/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'New Product',
          price: 200,
          description: 'Test new product',
          images: [{ url: 'test.jpg' }],
          category: [new mongoose.Types.ObjectId()]
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('New Product');
    });

    it('should create bulk products', async () => {
      const res = await request(app)
        .post('/api/admin/products/bulk')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          products: [
            { name: 'Bulk Product 1', price: 10, description: 'Desc 1', images: [{ url: 'test.jpg' }] },
            { name: 'Bulk Product 2', price: 20, description: 'Desc 2', images: [{ url: 'test.jpg' }] }
          ]
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
    });
  });

  describe('PUT /api/admin/products/:id', () => {
    it('should update a product', async () => {
      const res = await request(app)
        .put(`/api/admin/products/${product._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Product Name',
          price: 150
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Updated Product Name');
      expect(res.body.data.price).toBe(150);
    });

    it('should return 404 for non-existent product', async () => {
      const res = await request(app)
        .put(`/api/admin/products/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Update' });

      expect(res.statusCode).toBe(404);
    });
  });

  describe('DELETE /api/admin/products/:id', () => {
    it('should delete a product', async () => {
      const res = await request(app)
        .delete(`/api/admin/products/${product._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 for non-existent product', async () => {
      const res = await request(app)
        .delete(`/api/admin/products/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(404);
    });
  });

  describe('POST /api/admin/products/bulk-action', () => {
    it('should perform bulk action on products', async () => {
      const p2 = new Product({
        name: 'P2',
        slug: 'p2',
        description: 'desc',
        price: 50,
        images: [{ url: 't.jpg' }],
        isActive: true
      });
      await p2.save();

      const res = await request(app)
        .post('/api/admin/products/bulk-action')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          productIds: [product._id, p2._id],
          action: 'deactivate'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);

      const checkP = await Product.findById(product._id);
      expect(checkP.isActive).toBe(false);
    });

    it('should return 400 for unknown action', async () => {
      const res = await request(app)
        .post('/api/admin/products/bulk-action')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          productIds: [product._id],
          action: 'unknown_action'
        });

      expect(res.statusCode).toBe(400);
    });
  });
});
