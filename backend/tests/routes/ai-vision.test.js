const request = require('supertest');
const app = require('../../server');
const User = require('../../models/User');

jest.mock('../../config/cloudinary', () => ({
  uploader: {
    upload_stream: jest.fn((options, cb) => {
      // Return a mock stream
      const { Writable } = require('stream');
      const stream = new Writable({
        write(chunk, encoding, next) {
          next();
        },
        final(cb2) {
          cb(null, { secure_url: 'https://res.cloudinary.com/demo/image/upload/v1/mock.jpg' });
          cb2();
        }
      });
      return stream;
    })
  }
}));

jest.mock('../../utils/geminiModelManager', () => ({
  generateWithFallback: jest.fn().mockResolvedValue({
    text: JSON.stringify({
      name: "Mocked AI Name",
      description: "Mocked AI Description",
      categories: ["هدايا حريمي"],
      occasions: ["عيد ميلاد"],
      recipients: ["صديقة"],
      price: 0
    }),
    modelUsed: 'gemini-1.5-flash'
  })
}));

// Mock global fetch for enhance-product
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    statusText: 'OK',
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
    headers: new Map([['content-type', 'image/jpeg']])
  })
);

describe('AI Vision Routes Tests', () => {
  let adminToken;
  let adminUser;

  beforeAll(async () => {
    adminUser = new User({
      firstName: 'Admin',
      lastName: 'Vision',
      email: 'admin.vision@test.com',
      password: 'Password123!',
      phone: '01011112222',
      role: 'admin',
      isVerified: true,
      isActive: true
    });
    await adminUser.save();

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin.vision@test.com', password: 'Password123!' });
    adminToken = loginRes.body.data.token;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/admin/ai/vision-analyze', () => {
    it('should analyze images and return product JSON', async () => {
      const res = await request(app)
        .post('/api/admin/ai/vision-analyze')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('images', Buffer.from('fake-image-data'), 'test.jpg');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Mocked AI Name');
      expect(res.body.data.images[0].url).toBe('https://res.cloudinary.com/demo/image/upload/v1/mock.jpg');
    });

    it('should return 400 if no images provided', async () => {
      const res = await request(app)
        .post('/api/admin/ai/vision-analyze')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/admin/ai/enhance-product', () => {
    it('should enhance product details given an image URL', async () => {
      const res = await request(app)
        .post('/api/admin/ai/enhance-product')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          imageUrl: 'https://example.com/image.jpg',
          currentName: 'Old Name',
          currentDescription: 'Old Desc'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Mocked AI Name');
    });

    it('should return 400 if no imageUrl provided', async () => {
      const res = await request(app)
        .post('/api/admin/ai/enhance-product')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          currentName: 'Old Name'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
