const request = require('supertest');
const app = require('../../server');
const Product = require('../../models/Product');
const Category = require('../../models/Category');

describe('Product Controller & Routes Tests', () => {
  let category;
  let product1;
  let product2;
  let productFeatured;

  beforeAll(async () => {
    // Create a category
    category = new Category({
      name: 'Electronics',
      slug: 'electronics',
      description: 'Tech stuff',
      isActive: true,
      showInBox: false
    });
    await category.save();

    // Create products
    product1 = new Product({
      name: 'Phone',
      slug: 'phone',
      description: 'Smart phone',
      price: 1000,
      stock: 10,
      category: [category._id],
      isActive: true,
      isBestseller: true,
      salesCount: 50,
      occasions: ['birthday']
    });
    await product1.save();

    product2 = new Product({
      name: 'Laptop',
      slug: 'laptop',
      description: 'Gaming laptop',
      price: 2000,
      stock: 5,
      category: [category._id],
      isActive: true,
      isNewArrival: true,
      occasions: ['graduation']
    });
    await product2.save();

    productFeatured = new Product({
      name: 'Watch',
      slug: 'watch',
      description: 'Smart watch',
      price: 500,
      stock: 20,
      category: [category._id],
      isActive: true,
      isFeatured: true
    });
    await productFeatured.save();
  });

  it('should fetch all products', async () => {
    const res = await request(app).get('/api/products');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(3);
  });

  it('should filter products by categorySlug', async () => {
    const res = await request(app).get('/api/products?categorySlug=electronics');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBe(3);
  });

  it('should filter products by search text', async () => {
    const res = await request(app).get('/api/products?search=Phone');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].name).toBe('Phone');
  });

  it('should fetch featured products', async () => {
    const res = await request(app).get('/api/products/featured');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].name).toBe('Watch');
  });

  it('should fetch bestsellers', async () => {
    const res = await request(app).get('/api/products/bestsellers');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].name).toBe('Phone');
  });

  it('should fetch new arrivals', async () => {
    const res = await request(app).get('/api/products/new');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('should fetch products by occasion', async () => {
    const res = await request(app).get('/api/products/by-occasion/birthday');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].name).toBe('Phone');
  });

  it('should fetch product by slug', async () => {
    const res = await request(app).get('/api/products/slug/phone');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.name).toBe('Phone');
  });

  it('should fetch product by id', async () => {
    const res = await request(app).get(`/api/products/${product1._id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.name).toBe('Phone');
  });

  it('should fetch related products', async () => {
    const res = await request(app).get(`/api/products/${product1._id}/related`);
    expect(res.statusCode).toBe(200);
    // Since they share the same category, they should be related
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});
