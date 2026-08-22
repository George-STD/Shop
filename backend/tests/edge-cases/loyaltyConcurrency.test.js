const request = require('supertest');
const app = require('../../server');
const User = require('../../models/User');
const Product = require('../../models/Product');
const Settings = require('../../models/Settings');

describe('Edge Case: Loyalty Points Atomic Settlement & Double-Spend Defense', () => {
  let user;
  let userToken;
  let product;

  beforeAll(async () => {
    // 1. Configure loyalty settings in DB
    await Settings.findOneAndUpdate(
      {},
      {
        $set: {
          'loyalty.enabled': true,
          'loyalty.minPointsToRedeem': 100,
          'loyalty.egpPerPointRedeemed': 0.1, // 100 pts = 10 EGP
          'loyalty.pointsPerEgpSpent': 1,
        },
      },
      { upsert: true, new: true }
    );

    // 2. Create customer with exactly 200 loyalty points
    user = new User({
      firstName: 'Loyalty',
      lastName: 'Customer',
      email: 'loyalty.user@example.com',
      phone: '01033334444',
      password: 'Password123!',
      isVerified: true,
      isActive: true,
      loyaltyPoints: 200,
      pointsHistory: [
        {
          points: 200,
          reason: 'Initial promotional balance',
          type: 'EARNED',
        },
      ],
    });
    await user.save();

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'loyalty.user@example.com', password: 'Password123!' });
    userToken = loginRes.body.data.token;

    // 3. Create product
    product = new Product({
      name: 'Loyalty Test Product',
      slug: 'loyalty-test-product',
      description: 'Test loyalty checkout',
      price: 200,
      stock: 50,
      isActive: true,
    });
    await product.save();
  });

  it('should reject redeeming points below the configured minPointsToRedeem threshold', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        items: [{ productId: product._id, quantity: 1 }],
        pointsToRedeem: 50, // Less than minimum 100
        shippingAddress: {
          firstName: 'Loyalty',
          lastName: 'Customer',
          phone: '01033334444',
          governorate: 'Cairo',
          city: 'Cairo',
          street: 'Test St',
          building: '1',
        },
        paymentMethod: 'cod',
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);

    // Balance must remain unchanged
    const userInDb = await User.findById(user._id);
    expect(userInDb.loyaltyPoints).toBe(200);
  });

  it('should deduct points and apply monetary discount when redeeming valid points', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        items: [{ productId: product._id, quantity: 1 }],
        pointsToRedeem: 150, // 150 pts = 15 EGP discount
        shippingAddress: {
          firstName: 'Loyalty',
          lastName: 'Customer',
          phone: '01033334444',
          governorate: 'Cairo',
          city: 'Cairo',
          street: 'Test St',
          building: '1',
        },
        paymentMethod: 'cod',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.pointsRedeemed).toBe(150);
    expect(res.body.data.pointsDiscount).toBe(15);

    // Balance must be 200 - 150 = 50
    const userInDb = await User.findById(user._id);
    expect(userInDb.loyaltyPoints).toBe(50);
  });

  it('should reject subsequent order attempting to redeem more points than the remaining balance', async () => {
    // Current balance is 50. Attempting to redeem 100 should fail
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        items: [{ productId: product._id, quantity: 1 }],
        pointsToRedeem: 100, // exceeds remaining 50
        shippingAddress: {
          firstName: 'Loyalty',
          lastName: 'Customer',
          phone: '01033334444',
          governorate: 'Cairo',
          city: 'Cairo',
          street: 'Test St',
          building: '1',
        },
        paymentMethod: 'cod',
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);

    // Remaining balance must remain at 50
    const userInDb = await User.findById(user._id);
    expect(userInDb.loyaltyPoints).toBe(50);
  });
});
