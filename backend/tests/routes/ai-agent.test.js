const request = require('supertest');
const app = require('../../server');
const User = require('../../models/User');
const AiChatSession = require('../../models/AiChatSession');
const Product = require('../../models/Product');

const mongoose = require('mongoose');

jest.mock('@google/genai', () => {
  const mChatSession = {
    sendMessage: jest.fn().mockResolvedValue({
      text: 'Mocked AI response',
      functionCalls: []
    })
  };
  const mGoogleGenAI = jest.fn().mockImplementation(() => ({
    chats: {
      create: jest.fn().mockReturnValue(mChatSession)
    }
  }));
  return { GoogleGenAI: mGoogleGenAI };
});

describe('AI Agent Routes Tests', () => {
  let adminToken;
  let adminUser;
  let sessionId;
  let product;

  beforeAll(async () => {
    adminUser = new User({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin.agent@test.com',
      password: 'Password123!',
      phone: '01012345678',
      role: 'admin',
      isVerified: true,
      isActive: true
    });
    await adminUser.save();

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin.agent@test.com', password: 'Password123!' });
    adminToken = loginRes.body.data.token;

    product = new Product({
      name: 'Agent Product',
      slug: 'agent-product',
      description: 'Agent product desc',
      price: 100,
      stock: 10,
      isActive: true
    });
    await product.save();
  });

  describe('Sessions Management', () => {
    it('should fetch empty sessions initially', async () => {
      const res = await request(app)
        .get('/api/admin/ai-agent/sessions')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toEqual([]);
    });

    it('should create a new session', async () => {
      const res = await request(app)
        .post('/api/admin/ai-agent/sessions')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.data._id).toBeDefined();
      sessionId = res.body.data._id;
    });

    it('should fetch a specific session', async () => {
      const res = await request(app)
        .get(`/api/admin/ai-agent/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.data._id).toBe(sessionId);
    });
  });

  describe('Chat', () => {
    it('should send a message to a session', async () => {
      const res = await request(app)
        .post(`/api/admin/ai-agent/sessions/${sessionId}/chat`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ message: 'Hello AI' });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.role).toBe('model');
      expect(res.body.data.text).toBe('Mocked AI response');
    });
  });

  describe('Actions', () => {
    it('should execute a proposed action', async () => {
      const res = await request(app)
        .post('/api/admin/ai-agent/execute')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          collectionName: 'Product',
          documentIds: [product._id],
          updates: { price: 200 },
          sessionId: sessionId.toString(),
          messageId: new mongoose.Types.ObjectId().toString()
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 400 for missing data on execute', async () => {
      const res = await request(app)
        .post('/api/admin/ai-agent/execute')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ collectionName: 'Product' });
      
      expect(res.statusCode).toBe(400);
    });

    it('should reject a proposed action', async () => {
      const session = await AiChatSession.findById(sessionId);
      session.messages.push({
        role: 'model',
        text: 'I propose this update',
        proposedAction: { collectionName: 'Product', documentIds: [], updates: {} }
      });
      await session.save();
      const messageId = session.messages[session.messages.length - 1]._id;

      const res = await request(app)
        .post('/api/admin/ai-agent/reject')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          sessionId: sessionId.toString(),
          messageId: messageId.toString()
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      const updatedSession = await AiChatSession.findById(sessionId);
      const rejectedMsg = updatedSession.messages.id(messageId);
      expect(rejectedMsg.executed).toBe('rejected');
    });
  });

  describe('Delete Session', () => {
    it('should delete a session', async () => {
      const res = await request(app)
        .delete(`/api/admin/ai-agent/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      const fetchRes = await request(app)
        .get(`/api/admin/ai-agent/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(fetchRes.statusCode).toBe(404);
    });
  });
});
