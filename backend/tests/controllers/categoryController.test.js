const request = require('supertest');
const app = require('../../server');
const Category = require('../../models/Category');

describe('Category Routes Tests', () => {
  let mainCategory;
  
  beforeAll(async () => {
    mainCategory = new Category({
      name: 'Test Category',
      slug: 'test-category',
      description: 'A test category',
      isActive: true,
      showInBox: true
    });
    await mainCategory.save();
  });

  it('should fetch all categories', async () => {
    const res = await request(app).get('/api/categories');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].name).toBe('Test Category');
  });

  it('should fetch categories tree', async () => {
    const res = await request(app).get('/api/categories/tree');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should fetch box categories', async () => {
    const res = await request(app).get('/api/categories?showInBox=true');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});
