const request = require('supertest');
const app = require('../../server');
const User = require('../../models/User');

jest.mock('../../config/cloudinary', () => ({
  uploader: {
    upload_stream: jest.fn((options, cb) => {
      const { Writable } = require('stream');
      const stream = new Writable({
        write(chunk, encoding, next) {
          next();
        },
        final(cb2) {
          cb(null, { secure_url: 'https://res.cloudinary.com/demo/image/upload/v1/mock-upload.jpg' });
          cb2();
        }
      });
      return stream;
    })
  }
}));

describe('Upload Routes Tests', () => {
  let adminToken;
  let userToken;

  beforeAll(async () => {
    const adminUser = new User({
      firstName: 'Admin',
      lastName: 'Upload',
      email: 'admin.upload@test.com',
      password: 'Password123!',
      phone: '01033334444',
      role: 'admin',
      isVerified: true,
      isActive: true
    });
    await adminUser.save();

    const normalUser = new User({
      firstName: 'Normal',
      lastName: 'Upload',
      email: 'user.upload@test.com',
      password: 'Password123!',
      phone: '01044445555',
      role: 'user',
      isVerified: true,
      isActive: true
    });
    await normalUser.save();

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin.upload@test.com', password: 'Password123!' });
    adminToken = loginRes.body.data.token;

    const userLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user.upload@test.com', password: 'Password123!' });
    userToken = userLoginRes.body.data.token;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/upload', () => {
    it('should upload an image successfully as admin', async () => {
      const res = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('image', Buffer.from('fake-image-data'), 'test.jpg');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.url).toBe('https://res.cloudinary.com/demo/image/upload/v1/mock-upload.jpg');
    });

    it('should return 400 if no file provided', async () => {
      const res = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('لم يتم رفع أي ملف');
    });

    it('should return 400 for invalid file type', async () => {
      const res = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('image', Buffer.from('fake-pdf-data'), 'test.pdf');

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 403 for non-admin user', async () => {
      const res = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${userToken}`)
        .attach('image', Buffer.from('fake-image-data'), 'test.jpg');

      expect(res.statusCode).toBe(403);
    });
  });
});
