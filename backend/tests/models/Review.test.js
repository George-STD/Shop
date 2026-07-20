const mongoose = require('mongoose');
const Review = require('../../models/Review');
const Product = require('../../models/Product');
const User = require('../../models/User');

describe('Review Model Test', () => {
  let product;
  let user;

  beforeAll(async () => {
    product = new Product({
      name: 'Test Product for Review',
      slug: 'test-product-review',
      description: 'Review me',
      price: 100,
      stock: 10,
      isActive: true
    });
    await product.save();

    user = new User({
      firstName: 'Review',
      lastName: 'User',
      email: 'reviewer@example.com',
      password: 'Password123!',
      phone: '01011111111',
      isActive: true
    });
    await user.save();
    
    await Review.syncIndexes();
  });

  it('should create and save a review successfully', async () => {
    const review = new Review({
      product: product._id,
      user: user._id,
      rating: 5,
      comment: 'Excellent product!',
      isApproved: true
    });

    const savedReview = await review.save();
    expect(savedReview._id).toBeDefined();
    expect(savedReview.rating).toBe(5);
    expect(savedReview.comment).toBe('Excellent product!');
  });

  it('should fail creation without required fields', async () => {
    const reviewWithoutRequired = new Review({
      rating: 4
    });

    let err;
    try {
      await reviewWithoutRequired.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.product).toBeDefined();
    expect(err.errors.comment).toBeDefined();
  });

  it('should enforce unique review per user per product', async () => {
    const duplicateReview = new Review({
      product: product._id,
      user: user._id,
      rating: 4,
      comment: 'Wait, another review?'
    });

    let err;
    try {
      await duplicateReview.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    // Unique index might throw 11000
    expect(err.code).toBe(11000);
  });
});
