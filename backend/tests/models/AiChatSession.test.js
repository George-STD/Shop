const mongoose = require('mongoose');
const AiChatSession = require('../../models/AiChatSession');

describe('AiChatSession Model Test', () => {
  it('should create a session successfully with required fields', async () => {
    const session = new AiChatSession({
      adminId: new mongoose.Types.ObjectId(),
      title: 'Test Session',
      messages: [{ role: 'user', text: 'Hello' }]
    });

    const savedSession = await session.save();
    expect(savedSession._id).toBeDefined();
    expect(savedSession.adminId).toBeDefined();
    expect(savedSession.title).toBe('Test Session');
    expect(savedSession.messages.length).toBe(1);
    expect(savedSession.messages[0].role).toBe('user');
  });

  it('should fail creation if adminId is missing', async () => {
    const session = new AiChatSession({
      title: 'Test Session'
    });

    let err;
    try {
      await session.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.adminId).toBeDefined();
  });

  it('should fail if message role is invalid', async () => {
    const session = new AiChatSession({
      adminId: new mongoose.Types.ObjectId(),
      messages: [{ role: 'invalid_role', text: 'Hello' }]
    });

    let err;
    try {
      await session.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors['messages.0.role']).toBeDefined();
  });
});
