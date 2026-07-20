const mongoose = require('mongoose');
const Order = require('../../models/Order');
const Product = require('../../models/Product');
const Category = require('../../models/Category');

describe('Order Model Test', () => {
  it('should create and save an order successfully', async () => {
    // We only test validation in isolation here, we don't strictly need real products saved, 
    // but Mongoose validation might require valid ObjectIds
    const orderItem = {
      product: new mongoose.Types.ObjectId(),
      quantity: 2,
      price: 150
    };

    const orderData = {
      user: new mongoose.Types.ObjectId(),
      items: [orderItem],
      shippingAddress: {
        firstName: 'Test',
        lastName: 'User',
        phone: '01011111111',
        governorate: 'Cairo',
        city: 'Nasr City',
        street: 'Main St',
        building: '10'
      },
      paymentMethod: 'cod',
      paymentStatus: 'pending',
      subtotal: 300,
      shippingCost: 50,
      total: 350
    };

    const validOrder = new Order(orderData);
    const savedOrder = await validOrder.save();

    expect(savedOrder._id).toBeDefined();
    expect(savedOrder.status).toBe('pending');
    expect(savedOrder.total).toBe(350);
  });

  it('should fail order creation without required fields', async () => {
    const orderWithoutRequired = new Order({ subtotal: 100 });
    let err;
    try {
      await orderWithoutRequired.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.paymentMethod).toBeDefined();
    expect(err.errors.total).toBeDefined();
  });
});
