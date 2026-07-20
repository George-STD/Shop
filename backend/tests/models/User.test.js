const mongoose = require('mongoose');
const User = require('../../models/User');

describe('User Model Test', () => {
  it('should create and save a user successfully', async () => {
    const validUser = new User({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      phone: '01000000000',
      password: 'password123',
    });
    const savedUser = await validUser.save();

    expect(savedUser._id).toBeDefined();
    expect(savedUser.firstName).toBe('Test');
    expect(savedUser.lastName).toBe('User');
    expect(savedUser.email).toBe('test@example.com');
    expect(savedUser.role).toBe('user'); // Default role
    expect(savedUser.isVerified).toBe(false); // Default isVerified
  });

  it('should fail user creation without required fields', async () => {
    const userWithoutRequiredField = new User({ firstName: 'Test' });
    let err;
    try {
      await userWithoutRequiredField.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.lastName).toBeDefined();
    expect(err.errors.email).toBeDefined();
    expect(err.errors.phone).toBeDefined();
    expect(err.errors.password).toBeDefined();
  });

  it('should enforce unique email constraint', async () => {
    const user1 = new User({
      firstName: 'Test1', lastName: 'User', email: 'unique@example.com', phone: '01000000000', password: 'password123'
    });
    const user2 = new User({
      firstName: 'Test2', lastName: 'User', email: 'unique@example.com', phone: '01011111111', password: 'password123'
    });

    await user1.save();
    let err;
    try {
      await user2.save();
    } catch (error) {
      err = error;
    }
    // Mongoose throws MongoServerError code 11000 for duplicate key
    expect(err.code).toBe(11000);
  });
});
