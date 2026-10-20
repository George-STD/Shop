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

  it('prevents pre-account takeover when an attacker registers an unverified email before the real owner', async () => {
    const crypto = require('crypto');
    // 1. Attacker registers victim's email with attacker's password
    await request(app).post('/api/auth/register').send({
      firstName: 'Attacker',
      lastName: 'Evil',
      email: 'victim.takeover@example.com',
      phone: '01011111111',
      password: 'AttackerPassword123!',
    });

    // 2. Real victim registers their email with their own password
    const victimRegRes = await request(app).post('/api/auth/register').send({
      firstName: 'Real',
      lastName: 'Victim',
      email: 'victim.takeover@example.com',
      phone: '01022222222',
      password: 'VictimSecretPassword999!',
    });
    expect(victimRegRes.statusCode).toBe(200);

    // Simulate victim knowing the OTP sent to their inbox
    const knownOtp = '654321';
    const hashedOtp = crypto.createHash('sha256').update(knownOtp).digest('hex');
    await User.updateOne(
      { email: 'victim.takeover@example.com' },
      { $set: { emailVerificationCode: hashedOtp, emailVerificationExpires: new Date(Date.now() + 600000) } }
    );

    // 3. Victim verifies email with OTP
    const verifyRes = await request(app).post('/api/auth/verify-email').send({
      email: 'victim.takeover@example.com',
      code: knownOtp,
    });
    expect(verifyRes.statusCode).toBe(200);

    // 4. Attacker's password MUST be rejected
    const attackerLogin = await request(app).post('/api/auth/login').send({
      email: 'victim.takeover@example.com',
      password: 'AttackerPassword123!',
    });
    expect(attackerLogin.statusCode).toBe(401);

    // 5. Victim's password MUST succeed
    const victimLogin = await request(app).post('/api/auth/login').send({
      email: 'victim.takeover@example.com',
      password: 'VictimSecretPassword999!',
    });
    expect(victimLogin.statusCode).toBe(200);
  });

  it('invalidates OTP after 5 failed brute-force attempts on the account', async () => {
    const crypto = require('crypto');
    const validOtp = '123456';
    const hashedOtp = crypto.createHash('sha256').update(validOtp).digest('hex');

    await User.create({
      firstName: 'Otp',
      lastName: 'Target',
      email: 'otp.target@example.com',
      phone: '01077777777',
      password: 'Password123!',
      isVerified: false,
      emailVerificationCode: hashedOtp,
      emailVerificationExpires: new Date(Date.now() + 600000),
      otpAttempts: 0,
    });

    process.env.ENABLE_PERF_TESTING = 'true';
    try {
      // Send 5 wrong attempts (simulating distributed IPs bypassing IP rate limit)
      for (let i = 1; i <= 5; i++) {
        const wrongRes = await request(app)
          .post('/api/auth/verify-email')
          .send({ email: 'otp.target@example.com', code: '000000' });
        expect(wrongRes.statusCode).toBe(400);
      }

      // 6th attempt with the ACTUAL valid OTP must now fail because the code was invalidated after 5 failures
      const sixthRes = await request(app)
        .post('/api/auth/verify-email')
        .send({ email: 'otp.target@example.com', code: validOtp });
      expect(sixthRes.statusCode).toBe(400);

      const checkUser = await User.findOne({ email: 'otp.target@example.com' }).select('+emailVerificationCode');
      expect(checkUser.isVerified).toBe(false);
      expect(checkUser.emailVerificationCode).toBeUndefined();
    } finally {
      delete process.env.ENABLE_PERF_TESTING;
    }
  });
});
