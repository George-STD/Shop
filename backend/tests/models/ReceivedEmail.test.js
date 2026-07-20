const mongoose = require('mongoose');
const ReceivedEmail = require('../../models/ReceivedEmail');

describe('ReceivedEmail Model Test', () => {
  it('should create and save an email successfully', async () => {
    const validEmail = new ReceivedEmail({
      from: 'test@sender.com',
      to: 'info@foryo.me',
      subject: 'Test Subject',
      html: '<p>Hello</p>'
    });

    const savedEmail = await validEmail.save();
    expect(savedEmail._id).toBeDefined();
    expect(savedEmail.from).toBe('test@sender.com');
    expect(savedEmail.to).toBe('info@foryo.me');
    expect(savedEmail.isRead).toBe(false); // default
  });

  it('should fail creation without required fields', async () => {
    const emailWithoutRequired = new ReceivedEmail({
      subject: 'Missing to and from'
    });

    let err;
    try {
      await emailWithoutRequired.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.from).toBeDefined();
    expect(err.errors.to).toBeDefined();
  });
});
