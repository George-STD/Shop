const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: String,
  image: String,
  price: Number,
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  selectedSize: String,
  selectedColor: String,
  addons: [{
    name: String,
    price: Number
  }],
  giftWrap: {
    enabled: { type: Boolean, default: false },
    message: String,
    style: String
  },
  subtotal: Number
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  guestEmail: String,
  guestPhone: String,
  items: [orderItemSchema],
  
  // Shipping Address
  shippingAddress: {
    firstName: String,
    lastName: String,
    phone: String,
    governorate: String,
    city: String,
    area: String,
    street: String,
    building: String,
    floor: String,
    apartment: String,
    landmark: String
  },
  
  // Billing
  billingAddress: {
    sameAsShipping: { type: Boolean, default: true },
    firstName: String,
    lastName: String,
    phone: String,
    governorate: String,
    city: String,
    area: String,
    street: String
  },
  
  // Pricing
  subtotal: {
    type: Number,
    required: true
  },
  shippingCost: {
    type: Number,
    default: 0
  },
  discount: {
    code: String,
    amount: { type: Number, default: 0 },
    type: { type: String, enum: ['percentage', 'fixed'] }
  },
  tax: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  
  // Payment
  paymentMethod: {
    type: String,
    enum: ['cod', 'card', 'wallet', 'instapay', 'vodafone_cash'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentDetails: {
    transactionId: String,
    paidAt: Date
  },
  
  // Order Status
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'],
    default: 'pending'
  },
  statusHistory: [{
    status: String,
    date: { type: Date, default: Date.now },
    note: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Delivery
  deliveryType: {
    type: String,
    enum: ['standard', 'express', 'same_day', 'scheduled'],
    default: 'standard'
  },
  scheduledDate: Date,
  scheduledTime: String,
  trackingNumber: String,
  estimatedDelivery: Date,
  deliveredAt: Date,
  
  // Gift Options
  isGift: {
    type: Boolean,
    default: false
  },
  giftMessage: String,
  giftRecipient: {
    name: String,
    phone: String
  },
  hidePrice: {
    type: Boolean,
    default: false
  },
  
  // Notes
  customerNote: String,
  adminNote: String,
  
  // Cancellation/Return
  cancellationReason: String,
  cancelledAt: Date,
  returnReason: String,
  returnedAt: Date
}, {
  timestamps: true
});

// Generate order number before saving
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.orderNumber = `HD${year}${month}${random}`;
  }
  next();
});

// Indexes
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
