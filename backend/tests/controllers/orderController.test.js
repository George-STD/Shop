const request = require('supertest');
const app = require('../../server');
const User = require('../../models/User');
const Product = require('../../models/Product');
const { BUSINESS_CONFIG } = require('../../constants');

describe('Order Controller Tests', () => {
  let token;
  let user;
  let productNormal;
  let productBox;

  beforeAll(async () => {
    // 1. Create User
    user = new User({
      firstName: 'Order',
      lastName: 'Tester',
      email: 'order@example.com',
      phone: '01055555555',
      password: 'Password123!',
      isVerified: true,
      isActive: true,
    });
    await user.save();

    // 2. Login to get token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'order@example.com', password: 'Password123!' });
    token = loginRes.body.data.token;

    // 3. Create normal product
    productNormal = new Product({
      name: 'Normal Gift',
      slug: 'normal-gift',
      description: 'Test normal',
      price: 100,
      stock: 50,
      isActive: true
    });
    await productNormal.save();

    // 4. Create build-a-box product
    productBox = new Product({
      name: 'Box Item',
      slug: 'box-item',
      description: 'Test box',
      price: 50,
      stock: 20,
      isActive: true,
      isBuildABoxAvailable: true,
      boxDiscount: 20 // 20% discount if in box
    });
    await productBox.save();
  });

  it('should create a normal order successfully', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        items: [
          { productId: productNormal._id, quantity: 2 }
        ],
        shippingAddress: {
          firstName: 'John', lastName: 'Doe', phone: '01000000000',
          governorate: 'Cairo', city: 'Nasr City', street: 'Street 1', building: '1'
        },
        paymentMethod: 'cod'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.total).toBe(260); // (100 * 2) + 60 (shipping)
  });

  it('should fail to create box order with less than minimum items', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        items: [
          { productId: productBox._id, quantity: 1, isBoxItem: true, boxId: 'box-1' }
        ],
        shippingAddress: {
          firstName: 'John', lastName: 'Doe', phone: '01000000000',
          governorate: 'Cairo', city: 'Nasr City', street: 'Street 1', building: '1'
        },
        paymentMethod: 'cod'
      });

    // Based on BUSINESS_CONFIG.BOX_MIN_ITEMS (usually 3)
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should deduct product stock when an order is created and restore stock when order is cancelled', async () => {
    // Check initial stock of productNormal
    const initialProduct = await Product.findById(productNormal._id);
    const initialStock = initialProduct.stock;

    // Create order for 3 items
    const createRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        items: [{ productId: productNormal._id, quantity: 3 }],
        shippingAddress: {
          firstName: 'Stock', lastName: 'Tester', phone: '01000000000',
          governorate: 'Cairo', city: 'Cairo', street: 'Main St', building: '1'
        },
        paymentMethod: 'cod'
      });

    expect(createRes.statusCode).toBe(201);
    const orderId = createRes.body.data._id;

    // Verify stock decreased by 3
    const productAfterOrder = await Product.findById(productNormal._id);
    expect(productAfterOrder.stock).toBe(initialStock - 3);

    // Cancel order
    const cancelRes = await request(app)
      .put(`/api/orders/${orderId}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'Changed mind' });

    expect(cancelRes.statusCode).toBe(200);

    // Verify stock restored back to initialStock
    const productAfterCancel = await Product.findById(productNormal._id);
    expect(productAfterCancel.stock).toBe(initialStock);
  });

  it('should restore stock when admin updates order status to cancelled', async () => {
    // Set user role to admin
    await User.findByIdAndUpdate(user._id, { role: 'admin' });

    const initialProduct = await Product.findById(productNormal._id);
    const initialStock = initialProduct.stock;

    // Create order for 4 items
    const createRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        items: [{ productId: productNormal._id, quantity: 4 }],
        shippingAddress: {
          firstName: 'AdminStock', lastName: 'Tester', phone: '01000000000',
          governorate: 'Cairo', city: 'Cairo', street: 'Main St', building: '1'
        },
        paymentMethod: 'cod'
      });

    expect(createRes.statusCode).toBe(201);
    const orderId = createRes.body.data._id;

    // Verify stock decreased by 4
    const productAfterOrder = await Product.findById(productNormal._id);
    expect(productAfterOrder.stock).toBe(initialStock - 4);

    // Admin updates order status to cancelled
    const adminCancelRes = await request(app)
      .put(`/api/admin/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'cancelled' });

    expect(adminCancelRes.statusCode).toBe(200);

    // Verify stock restored back to initialStock
    const productAfterAdminCancel = await Product.findById(productNormal._id);
    expect(productAfterAdminCancel.stock).toBe(initialStock);
  });
});
