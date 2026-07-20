const mongoose = require('mongoose');
const Category = require('../../models/Category');

describe('Category Model Test', () => {
  beforeAll(async () => {
    await Category.init();
  });

  it('should create and save a category successfully', async () => {
    const validCategory = new Category({
      name: 'Electronics',
      slug: 'electronics',
      description: 'Gadgets and devices',
      isActive: true,
      showInBox: true
    });

    const savedCategory = await validCategory.save();
    expect(savedCategory._id).toBeDefined();
    expect(savedCategory.name).toBe('Electronics');
    expect(savedCategory.slug).toBe('electronics');
    expect(savedCategory.isActive).toBe(true);
    expect(savedCategory.showInBox).toBe(true);
  });

  it('should fail category creation without required fields', async () => {
    const categoryWithoutRequired = new Category({
      description: 'Missing name and slug'
    });

    let err;
    try {
      await categoryWithoutRequired.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.name).toBeDefined();
    expect(err.errors.slug).toBeDefined();
  });

  it('should enforce unique slug constraint', async () => {
    const category1 = new Category({
      name: 'Category 1',
      slug: 'unique-slug'
    });
    await category1.save();

    const category2 = new Category({
      name: 'Category 2',
      slug: 'unique-slug'
    });

    let err;
    try {
      await category2.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err.code).toBe(11000); // MongoDB duplicate key error
  });
});
