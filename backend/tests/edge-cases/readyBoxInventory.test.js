const request = require('supertest');
const app = require('../../server');
const User = require('../../models/User');
const Product = require('../../models/Product');

describe('Edge Case: Pre-Assembled Ready Box Bundle Inventory & Multi-Item Integrity', () => {
  let userToken;
  let subProductA;
  let subProductB;
  let readyBoxProduct;

  beforeAll(async () => {
    // 1. Create a customer
    const user = new User({
      firstName: 'BoxTester',
      lastName: 'Customer',
      email: 'boxtester@example.com',
      phone: '01055556666',
      password: 'Password123!',
      isVerified: true,
      isActive: true,
    });
    await user.save();

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'boxtester@example.com', password: 'Password123!' });
    userToken = loginRes.body.data.token;

    // 2. Create sub-products
    subProductA = new Product({
      name: 'Custom Mug',
      slug: 'custom-mug',
      description: 'Part of bundle',
      price: 60,
      stock: 10,
      isActive: true,
    });
    await subProductA.save();

    subProductB = new Product({
      name: 'Gourmet Chocolate',
      slug: 'gourmet-chocolate',
      description: 'Part of bundle',
      price: 80,
      stock: 4, // Critical constraint: only 4 in stock
      isActive: true,
    });
    await subProductB.save();

    // 3. Create Ready Box containing 1x SubProductA and 2x SubProductB
    readyBoxProduct = new Product({
      name: 'Luxury Coffee & Chocolate Box',
      slug: 'luxury-coffee-chocolate-box',
      description: 'Pre-assembled gift box',
      price: 220,
      isReadyBox: true,
      autoCalculatePrice: false,
      includedProducts: [
        { product: subProductA._id, quantity: 1 },
        { product: subProductB._id, quantity: 2 }, // Requires 2 units of B per box
      ],
      isActive: true,
    });
    await readyBoxProduct.save();
  });

  it('should successfully deduct stock from all included sub-products when ordering a ready box', async () => {
    // Order 1 box: Should deduct 1 from subProductA (10 -> 9) and 2 from subProductB (4 -> 2)
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        items: [{ productId: readyBoxProduct._id, quantity: 1 }],
        shippingAddress: {
          firstName: 'BoxTester',
          lastName: 'Customer',
          phone: '01055556666',
          governorate: 'Cairo',
          city: 'Cairo',
          street: 'Main St',
          building: '20',
        },
        paymentMethod: 'cod',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);

    const updatedA = await Product.findById(subProductA._id);
    const updatedB = await Product.findById(subProductB._id);

    expect(updatedA.stock).toBe(9);
    expect(updatedB.stock).toBe(2);
  });

  it('should fail and rollback all sub-product deductions if any sub-product stock is insufficient', async () => {
    // Attempting to order 2 boxes: Requires 2 of A (9 available - OK), and 4 of B (only 2 available - FAILS)
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        items: [{ productId: readyBoxProduct._id, quantity: 2 }],
        shippingAddress: {
          firstName: 'BoxTester',
          lastName: 'Customer',
          phone: '01055556666',
          governorate: 'Cairo',
          city: 'Cairo',
          street: 'Main St',
          building: '20',
        },
        paymentMethod: 'cod',
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);

    // Rollback verification: subProductA stock must remain untouched at 9, and subProductB at 2
    const currentA = await Product.findById(subProductA._id);
    const currentB = await Product.findById(subProductB._id);

    expect(currentA.stock).toBe(9);
    expect(currentB.stock).toBe(2);
  });
});
