const mongoose = require('mongoose');
const Occasion = require('../../models/Occasion');

describe('Occasion Model Test', () => {
  beforeAll(async () => {
    await Occasion.init();
  });

  it('should create and save an occasion successfully', async () => {
    const validOccasion = new Occasion({
      name: 'عيد ميلاد سعيد'
    });

    const savedOccasion = await validOccasion.save();
    expect(savedOccasion._id).toBeDefined();
    expect(savedOccasion.name).toBe('عيد ميلاد سعيد');
    expect(savedOccasion.slug).toBe('عيد-ميلاد-سعيد'); // auto-generated
    expect(savedOccasion.icon).toBe('🎉'); // default value
  });

  it('should fail occasion creation without required fields', async () => {
    const occasionWithoutRequired = new Occasion({
      icon: '🎁'
    });

    let err;
    try {
      await occasionWithoutRequired.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.name).toBeDefined();
  });

  it('should enforce unique name constraint', async () => {
    const occasion1 = new Occasion({
      name: 'عيد الحب'
    });
    await occasion1.save();

    const occasion2 = new Occasion({
      name: 'عيد الحب'
    });

    let err;
    try {
      await occasion2.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err.code).toBe(11000); // duplicate key error
  });
});
