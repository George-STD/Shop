const request = require('supertest');
const app = require('../../../server');
const User = require('../../../models/User');
const Product = require('../../../models/Product');
const mongoose = require('mongoose');

// Mock googlethis to avoid actual network requests
jest.mock('googlethis', () => ({
  image: jest.fn(),
  search: jest.fn()
}));
const google = require('googlethis');

describe('Admin Barcode Routes Tests', () => {
  let adminToken;
  let adminUser;

  beforeAll(async () => {
    adminUser = new User({
      firstName: 'Admin',
      lastName: 'Barcode',
      email: 'admin.barcode@test.com',
      password: 'Password123!',
      phone: '01011112222',
      role: 'admin',
      isVerified: true,
      isActive: true
    });
    await adminUser.save();

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin.barcode@test.com', password: 'Password123!' });
    adminToken = loginRes.body.data.token;
  });

  beforeEach(async () => {
    await Product.deleteMany({});
    
    // Clear mocks
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterAll(() => {
    // Restore fetch
    jest.restoreAllMocks();
  });

  describe('GET /api/admin/barcode/:barcode', () => {
    it('should return 400 for invalid barcode length', async () => {
      const res = await request(app)
        .get('/api/admin/barcode/123')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return product from local DB if SKU matches exactly', async () => {
      const product = new Product({
        name: 'Local Product',
        slug: 'local-product',
        description: 'Desc',
        price: 100,
        sku: '12345678'
      });
      await product.save();

      const res = await request(app)
        .get('/api/admin/barcode/12345678')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.source).toBe('local');
      expect(res.body.data.name).toBe('Local Product');
    });

    it('should return product from local DB if partial SKU matches', async () => {
      const product = new Product({
        name: 'Local Product Partial',
        slug: 'local-product-partial',
        description: 'Desc',
        price: 100,
        sku: 'SKU-12345678-ABC'
      });
      await product.save();

      const res = await request(app)
        .get('/api/admin/barcode/12345678')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.source).toBe('local');
      expect(res.body.data.name).toBe('Local Product Partial');
    });

    it('should fetch from Open Food Facts API if not found locally', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 1,
          product: {
            product_name: 'External Product',
            image_url: 'http://test.jpg',
            categories: 'Test Category'
          }
        })
      });

      const res = await request(app)
        .get('/api/admin/barcode/87654321')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.source).toBe('openfoodfacts');
      expect(res.body.data.name).toBe('External Product');
      expect(res.body.data.images[0].url).toBe('http://test.jpg');
    });

    it('should fetch from UPC Item DB if Open Food Facts fails', async () => {
      // Mock Open Food Facts failure
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({})
      });

      // Mock UPC Item DB success
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 'OK',
          items: [{
            title: 'UPC Product',
            description: 'UPC Desc',
            images: ['http://upc.jpg']
          }]
        })
      });

      const res = await request(app)
        .get('/api/admin/barcode/11223344')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.source).toBe('upcitemdb');
      expect(res.body.data.name).toBe('UPC Product');
    });

    it('should fallback to google image search if no images found in APIs', async () => {
      // Mock Open Food Facts with no image
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 1,
          product: {
            product_name: 'No Image Product'
          }
        })
      });

      // Mock google.image
      google.image.mockResolvedValueOnce([
        { url: 'http://google.jpg' }
      ]);

      const res = await request(app)
        .get('/api/admin/barcode/99887766')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.source).toBe('openfoodfacts');
      expect(res.body.data.name).toBe('No Image Product');
      expect(res.body.data.images[0].url).toBe('http://google.jpg');
    });

    it('should return 200 with success false if product not found anywhere', async () => {
      // Mock Open Food Facts failure
      global.fetch.mockResolvedValueOnce({ ok: false });
      // Mock UPC Item DB failure
      global.fetch.mockResolvedValueOnce({ ok: false });
      // Mock Google Search failure
      google.search.mockResolvedValueOnce({ results: [] });

      const res = await request(app)
        .get('/api/admin/barcode/00000000')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(false);
      expect(res.body.source).toBe('none');
    });
  });
});
