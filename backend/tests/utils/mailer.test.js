const { sendVerificationEmail, sendPasswordResetEmail, sendOrderConfirmationEmail } = require('../../utils/mailer');

describe('Mailer Utility Tests', () => {
  it('should skip sendVerificationEmail in test environment', async () => {
    await expect(sendVerificationEmail('test@test.com', '123456')).resolves.not.toThrow();
  });

  it('should skip sendPasswordResetEmail in test environment', async () => {
    await expect(sendPasswordResetEmail('test@test.com', 'reset-token-123')).resolves.not.toThrow();
  });

  it('should skip sendOrderConfirmationEmail in test environment', async () => {
    const mockOrder = {
      _id: 'order_123',
      total: 500,
      items: [
        { product: { name: 'Test Product' }, quantity: 1, price: 500 }
      ]
    };
    await expect(sendOrderConfirmationEmail('test@test.com', mockOrder)).resolves.not.toThrow();
  });
});
