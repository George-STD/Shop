const mongoose = require('mongoose');
const crypto = require('crypto');

/**
 * Order Line Item Sub-schema
 * Captures point-in-time snapshot of product details, variants, packaging, and bundle sub-components.
 */
const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: { type: String, trim: true },
  slug: { type: String, trim: true },
  image: { type: String, trim: true },
  price: { type: Number, min: 0 },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  selectedSize: String,
  selectedColor: String,
  selectedShape: String,
  selectedVariants: {
    type: Map,
    of: String
  },
  addons: [{
    name: String,
    price: Number
  }],
  boxSelections: [{
    slotLabel: String,
    chosenOption: String,
    image: String
  }],
  boxId: String,
  subtotal: { type: Number, min: 0 },
  isReadyBox: Boolean,
  includedProducts: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: Number
  }]
}, { _id: true });

/**
 * Master Order Schema
 * Represents the customer purchase contract, payment lifecycle, fulfillment tracking, and loyalty settlement.
 */
const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true
  },
  idempotencyKey: {
    type: String,
    index: { unique: true, sparse: true }
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
    required: true,
    min: [0, 'المجموع الفرعي لا يمكن أن يكون سالباً']
  },
  shippingCost: {
    type: Number,
    default: 0,
    min: [0, 'تكلفة الشحن لا يمكن أن تكون سالبة']
  },
  discount: {
    code: String,
    amount: { type: Number, default: 0, min: 0 },
    type: { type: String, enum: ['percentage', 'fixed'] }
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: [0, 'الإجمالي لا يمكن أن يكون سالباً']
  },
  pointsEarned: {
    type: Number,
    default: 0,
    min: 0
  },
  pointsRedeemed: {
    type: Number,
    default: 0,
    min: 0
  },
  pointsDiscount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Payment
  paymentMethod: {
    type: String,
    enum: ['cod', 'instapay'],
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
  timestamps: true,
  optimisticConcurrency: true
});

// Generate order number before saving with high entropy (~30 bits)
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = crypto.randomInt(100000000, 999999999).toString();
    this.orderNumber = `HD${year}${month}${random}`;
  }
  next();
});

// Indexes
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ guestEmail: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
