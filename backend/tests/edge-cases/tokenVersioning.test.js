const request = require('supertest');
const app = require('../../server');
const User = require('../../models/User');

describe('Edge Case: JWT Token Versioning & Complete Session Revocation', () => {
  let user;
  let activeToken;

  beforeEach(async () => {
    // Recreate a clean verified user for each test
    await User.deleteMany({ email: 'session.test@example.com' });

    user = new User({
      firstName: 'Session',
      lastName: 'Tester',
      email: 'session.test@example.com',
      phone: '01012345678',
      password: 'InitialPassword123!',
      isVerified: true,
      isActive: true,
      tokenVersion: 0,
    });
    await user.save();

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'session.test@example.com', password: 'InitialPassword123!' });
    activeToken = loginRes.body.data.token;
  });

  it('should allow access to protected endpoints with valid tokenVersion', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${activeToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('session.test@example.com');
  });

  it('should immediately revoke old JWT token after user logs out', async () => {
    // 1. Verify token works initially
    const preLogoutRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${activeToken}`);
    expect(preLogoutRes.statusCode).toBe(200);

    // 2. Perform Logout
    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${activeToken}`);
    expect(logoutRes.statusCode).toBe(200);

    // 3. Attempting to use the SAME token must be rejected with 401
    const postLogoutRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${activeToken}`);

    expect(postLogoutRes.statusCode).toBe(401);
    expect(postLogoutRes.body.success).toBe(false);

    // Verify tokenVersion was incremented in MongoDB
    const updatedUser = await User.findById(user._id);
    expect(updatedUser.tokenVersion).toBe(1);
  });

  it('should revoke all existing JWT tokens when user changes their password', async () => {
    // 1. User changes password using current token
    const changePasswordRes = await request(app)
      .put('/api/auth/change-password')
      .set('Authorization', `Bearer ${activeToken}`)
      .send({
        currentPassword: 'InitialPassword123!',
        newPassword: 'BrandNewPassword456!',
      });

    expect(changePasswordRes.statusCode).toBe(200);
    expect(changePasswordRes.body.success).toBe(true);

    // 2. The old token must now be rejected immediately
    const postChangeRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${activeToken}`);

    expect(postChangeRes.statusCode).toBe(401);
    expect(postChangeRes.body.success).toBe(false);

    // 3. Logging in with new password returns a new valid token
    const newLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'session.test@example.com',
        password: 'BrandNewPassword456!',
      });

    expect(newLoginRes.statusCode).toBe(200);
    const newToken = newLoginRes.body.data.token;

    // 4. New token works seamlessly
    const newMeRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${newToken}`);
    expect(newMeRes.statusCode).toBe(200);
  });
});
