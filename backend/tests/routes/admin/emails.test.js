const request = require('supertest');
const app = require('../../../server');
const User = require('../../../models/User');
const ReceivedEmail = require('../../../models/ReceivedEmail');
const mongoose = require('mongoose');

jest.mock('../../../utils/resendInbound', () => ({
  fetchReceivedEmailContent: jest.fn().mockImplementation((id) => {
    return Promise.resolve({
      id: id || 'resend_auto_123',
      text: 'Recovered email content from Resend',
      html: '<p>Recovered email content from Resend</p>',
    });
  }),
  listReceivedEmails: jest.fn().mockResolvedValue([
    {
      id: 'resend_sync_1',
      from: 'sync_sender@test.com',
      to: ['support@foryo.me'],
      subject: 'Synced Subject',
      created_at: new Date().toISOString(),
    }
  ])
}));

describe('Admin Emails Routes Tests', () => {
  let adminToken;
  let adminUser;
  let email;

  beforeAll(async () => {
    adminUser = new User({
      firstName: 'Admin',
      lastName: 'Emails',
      email: 'admin.emails@test.com',
      password: 'Password123!',
      phone: '01011112222',
      role: 'admin',
      isVerified: true,
      isActive: true
    });
    await adminUser.save();

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin.emails@test.com', password: 'Password123!' });
    adminToken = loginRes.body.data.token;
  });

  beforeEach(async () => {
    await ReceivedEmail.deleteMany({});
    
    email = new ReceivedEmail({
      name: 'Test Sender',
      email: 'sender@test.com',
      to: 'admin@test.com',
      from: 'sender@test.com',
      subject: 'Test Subject',
      message: 'Test Message',
      isRead: false
    });
    await email.save();
  });

  describe('GET /api/admin/emails', () => {
    it('should get all emails with pagination', async () => {
      const res = await request(app)
        .get('/api/admin/emails?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].subject).toBe('Test Subject');
    });
  });

  describe('GET /api/admin/emails/:id', () => {
    it('should get an email by ID and mark as read', async () => {
      const res = await request(app)
        .get(`/api/admin/emails/${email._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.subject).toBe('Test Subject');
      expect(res.body.data.isRead).toBe(true);

      const dbEmail = await ReceivedEmail.findById(email._id);
      expect(dbEmail.isRead).toBe(true);
    });

    it('should auto-fetch body from Resend if text is empty', async () => {
      const emptyEmail = new ReceivedEmail({
        from: 'empty@test.com',
        to: 'support@foryo.me',
        subject: 'Empty Email',
        emailId: 'resend_auto_123',
        text: '',
      });
      await emptyEmail.save();

      const res = await request(app)
        .get(`/api/admin/emails/${emptyEmail._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.text).toBe('Recovered email content from Resend');

      const updated = await ReceivedEmail.findById(emptyEmail._id);
      expect(updated.text).toBe('Recovered email content from Resend');
    });

    it('should return 404 for non-existent email', async () => {
      const res = await request(app)
        .get(`/api/admin/emails/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(404);
    });
  });

  describe('POST /api/admin/emails/sync', () => {
    it('should sync emails from Resend', async () => {
      const res = await request(app)
        .post('/api/admin/emails/sync')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.createdCount).toBeGreaterThanOrEqual(1);

      const synced = await ReceivedEmail.findOne({ emailId: 'resend_sync_1' });
      expect(synced).not.toBeNull();
      expect(synced.subject).toBe('Synced Subject');
      expect(synced.text).toBe('Recovered email content from Resend');
    });
  });

  describe('DELETE /api/admin/emails/:id', () => {
    it('should delete an email', async () => {
      const res = await request(app)
        .delete(`/api/admin/emails/${email._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      
      const dbEmail = await ReceivedEmail.findById(email._id);
      expect(dbEmail).toBeNull();
    });

    it('should return 404 for non-existent email', async () => {
      const res = await request(app)
        .delete(`/api/admin/emails/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(404);
    });
  });
});
