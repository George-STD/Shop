const request = require('supertest');
const app = require('../../server');
const Product = require('../../models/Product');
const User = require('../../models/User');
const Review = require('../../models/Review');

describe('Reviews Routes Tests', () => {
  let user;
  let token;
  let product;
  let reviewId;

  beforeAll(async () => {
    // Create a product
    product = new Product({
      name: 'Test Review Product',
      slug: 'test-review-product',
      description: 'Test product description',
      price: 100,
      stock: 10,
      isActive: true
    });
    await product.save();

    // Create User
    user = new User({
      firstName: 'Review',
      lastName: 'Tester',
      email: 'review@test.com',
      phone: '01055555555',
      password: 'Password123!',
      isVerified: true,
      isActive: true,
    });
    await user.save();

    // Login
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'review@test.com', password: 'Password123!' });
    token = loginRes.body.data.token;
  });

  describe('GET /api/reviews/product/:productId', () => {
    beforeAll(async () => {
      const review1 = new Review({
        product: product._id,
        user: user._id,
        rating: 5,
        comment: 'Great product, really liked it!',
        isApproved: true
      });
      await review1.save();
    });

    it('should fetch reviews for a product', async () => {
      const res = await request(app).get(`/api/reviews/product/${product._id}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].rating).toBe(5);
    });

    it('should return 400 for invalid product id', async () => {
      const res = await request(app).get('/api/reviews/product/invalid123');
      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /api/reviews', () => {
    let newProduct;

    beforeAll(async () => {
      newProduct = new Product({
        name: 'Another Product',
        slug: 'another-product',
        description: 'Another great product description',
        price: 200,
        stock: 5,
        isActive: true
      });
      await newProduct.save();
    });

    it('should create a review as authenticated user', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          product: newProduct._id.toString(),
          rating: 4,
          comment: 'This product is good enough to use.'
        });
      
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.rating).toBe(4);
      
      reviewId = res.body.data._id;
    });

    it('should create a review as guest', async () => {
      const guestProduct = new Product({
        name: 'Guest Product',
        slug: 'guest-product',
        description: 'A product for guests',
        price: 200,
        stock: 5,
        isActive: true
      });
      await guestProduct.save();

      const res = await request(app)
        .post('/api/reviews')
        .send({
          product: guestProduct._id.toString(),
          rating: 5,
          comment: 'Amazing stuff for a guest!',
          guestName: 'Guest User',
          guestEmail: 'guest@example.com'
        });
      
      expect(res.statusCode).toBe(201);
      expect(res.body.data.guestName).toBe('Guest User');
    });

    it('should return 400 if missing guest info and no token', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .send({
          product: newProduct._id.toString(),
          rating: 5,
          comment: 'Amazing stuff!'
        });
      
      expect(res.statusCode).toBe(400);
    });

    it('should return 400 for duplicate review by same user', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          product: newProduct._id.toString(),
          rating: 3,
          comment: 'Trying to review again with long text.'
        });
      
      expect(res.statusCode).toBe(400);
    });
  });

  describe('PUT /api/reviews/:id', () => {
    it('should update a review', async () => {
      const res = await request(app)
        .put(`/api/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          rating: 5,
          comment: 'Changed my mind, it is awesome!'
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.data.rating).toBe(5);
      expect(res.body.data.isEdited).toBe(true);
    });
  });

  describe('POST /api/reviews/:id/helpful', () => {
    it('should mark review as helpful', async () => {
      const res = await request(app)
        .post(`/api/reviews/${reviewId}/helpful`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.data.helpful).toBe(1);
    });

    it('should unmark review as helpful if already marked', async () => {
      const res = await request(app)
        .post(`/api/reviews/${reviewId}/helpful`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.data.helpful).toBe(0);
    });
  });

  describe('DELETE /api/reviews/:id', () => {
    it('should delete a review', async () => {
      const res = await request(app)
        .delete(`/api/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toBe(200);
      
      // Verify deletion
      const deletedReview = await Review.findById(reviewId);
      expect(deletedReview).toBeNull();
    });
  });
});
