const request = require('supertest');
const app = require('../../server');
const ReceivedEmail = require('../../models/ReceivedEmail');

jest.mock('svix', () => {
  return {
    Webhook: jest.fn().mockImplementation(() => ({
      verify: jest.fn((payload, headers) => {
        if (headers['svix-signature'] === 'invalid') {
          throw new Error('Invalid signature');
        }
        return JSON.parse(payload);
      })
    }))
  };
});

describe('Webhooks Routes Tests', () => {
  beforeAll(() => {
    process.env.RESEND_WEBHOOK_SECRET = 'test_secret';
  });

  afterEach(async () => {
    await ReceivedEmail.deleteMany({});
  });

  describe('POST /api/webhooks/resend', () => {
    it('should process a valid support email webhook', async () => {
      const payload = {
        type: 'email.received',
        data: {
          from: 'sender@example.com',
          to: 'support@foryo.me',
          subject: 'Test Subject',
          text: 'This is a test email'
        }
      };

      const res = await request(app)
        .post('/api/webhooks/resend')
        .set('svix-id', 'test_id')
        .set('svix-timestamp', 'test_timestamp')
        .set('svix-signature', 'valid_signature')
        .send(payload);

      expect(res.statusCode).toBe(200);
      expect(res.body.received).toBe(true);

      const emails = await ReceivedEmail.find({});
      expect(emails.length).toBe(1);
      expect(emails[0].subject).toBe('Test Subject');
    });

    it('should ignore non-support emails', async () => {
      const payload = {
        type: 'email.received',
        data: {
          from: 'sender@example.com',
          to: 'other@example.com',
          subject: 'Test Subject',
          text: 'This is a test email'
        }
      };

      const res = await request(app)
        .post('/api/webhooks/resend')
        .set('svix-id', 'test_id')
        .set('svix-timestamp', 'test_timestamp')
        .set('svix-signature', 'valid_signature')
        .send(payload);

      expect(res.statusCode).toBe(200);
      expect(res.body.ignored).toBe(true);

      const emails = await ReceivedEmail.find({});
      expect(emails.length).toBe(0);
    });

    it('should ignore non-email.received events', async () => {
      const payload = {
        type: 'email.sent',
        data: {}
      };

      const res = await request(app)
        .post('/api/webhooks/resend')
        .set('svix-id', 'test_id')
        .set('svix-timestamp', 'test_timestamp')
        .set('svix-signature', 'valid_signature')
        .send(payload);

      expect(res.statusCode).toBe(200);
      expect(res.body.received).toBe(true);

      const emails = await ReceivedEmail.find({});
      expect(emails.length).toBe(0);
    });

    it('should return 401 for invalid signature', async () => {
      const payload = {
        type: 'email.received',
        data: {}
      };

      const res = await request(app)
        .post('/api/webhooks/resend')
        .set('svix-id', 'test_id')
        .set('svix-timestamp', 'test_timestamp')
        .set('svix-signature', 'invalid')
        .send(payload);

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('Invalid signature');
    });

    it('should return 500 if secret is missing', async () => {
      delete process.env.RESEND_WEBHOOK_SECRET;

      const res = await request(app)
        .post('/api/webhooks/resend')
        .send({});

      expect(res.statusCode).toBe(500);

      // Restore secret
      process.env.RESEND_WEBHOOK_SECRET = 'test_secret';
    });
  });
});
