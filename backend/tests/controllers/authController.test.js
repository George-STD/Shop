const request = require('supertest');
const app = require('../../server');
const User = require('../../models/User');

describe('Auth Controller Tests', () => {
  it('should register a new user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '01000000000',
        password: 'Password123!',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBeDefined();

    const user = await User.findOne({ email: 'john@example.com' });
    expect(user).toBeTruthy();
    expect(user.isVerified).toBe(false);
  });

  it('should not register user with existing email', async () => {
    // Create first user
    await new User({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      phone: '01011111111',
      password: 'Password123!',
      isVerified: true,
    }).save();

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Jane2',
        lastName: 'Doe2',
        email: 'jane@example.com',
        phone: '01022222222',
        password: 'Password123!',
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should not login an unverified user', async () => {
    const user = new User({
      firstName: 'Bob',
      lastName: 'Smith',
      email: 'bob@example.com',
      phone: '01033333333',
      password: 'Password123!',
      isVerified: false,
    });
    await user.save();

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'bob@example.com',
        password: 'Password123!',
      });

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.data.requiresVerification).toBe(true);
  });

  it('should login verified user successfully', async () => {
    const user = new User({
      firstName: 'Alice',
      lastName: 'Smith',
      email: 'alice@example.com',
      phone: '01044444444',
      password: 'Password123!',
      isVerified: true,
      isActive: true,
    });
    await user.save();

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'alice@example.com',
        password: 'Password123!',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe('alice@example.com');
  });
});
