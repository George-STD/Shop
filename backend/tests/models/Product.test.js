const mongoose = require('mongoose');
const Product = require('../../models/Product');

describe('Product Model Test', () => {
  it('should create and save a product successfully', async () => {
    const validProduct = new Product({
      name: 'Test Product',
      slug: 'test-product',
      description: 'This is a test product',
      price: 150,
      stock: 10,
      category: [new mongoose.Types.ObjectId()]
    });
    const savedProduct = await validProduct.save();

    expect(savedProduct._id).toBeDefined();
    expect(savedProduct.name).toBe('Test Product');
    expect(savedProduct.price).toBe(150);
    expect(savedProduct.discount).toBe(0); // Default value
    expect(savedProduct.boxDiscount).toBe(25); // Default value
    expect(savedProduct.isActive).toBe(true);
  });

  it('should fail product creation without required fields', async () => {
    const productWithoutRequiredField = new Product({ name: 'Test Product' });
    let err;
    try {
      await productWithoutRequiredField.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.slug).toBeDefined();
    expect(err.errors.description).toBeDefined();
    expect(err.errors.price).toBeDefined();
  });

  it('should enforce enum constraint on recipients', async () => {
    const invalidProduct = new Product({
      name: 'Test', slug: 't2', description: 'desc', price: 10,
      recipients: ['InvalidRecipient']
    });
    let err;
    try {
      await invalidProduct.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors['recipients.0']).toBeDefined();
  });
});
