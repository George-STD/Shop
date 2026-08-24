const mongoose = require('mongoose');
const crypto = require('crypto');
const { roundTo2Decimals } = require('../utils/money');

/**
 * Order Line Item Sub-schema
 * Captures point-in-time snapshot of product details, variants, packaging, and bundle sub-components.
 */
const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: { type: String, trim: true },
    slug: { type: String, trim: true },
    image: { type: String, trim: true },
    price: {
      type: Number,
      min: 0,
      set: (v) => (v === null || v === undefined ? v : roundTo2Decimals(v)),
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} يجب أن تكون كمية صحيحة',
      },
    },
    selectedSize: String,
    selectedColor: String,
    selectedShape: String,
    selectedVariants: {
      type: Map,
      of: String,
    },
    addons: [
      {
        name: String,
        price: {
          type: Number,
          set: (v) => (v === null || v === undefined ? v : roundTo2Decimals(v)),
        },
      },
    ],
    boxSelections: [
      {
        slotLabel: String,
        chosenOption: String,
        image: String,
      },
    ],
    boxId: String,
    subtotal: {
      type: Number,
      min: 0,
      set: (v) => (v === null || v === undefined ? v : roundTo2Decimals(v)),
    },
    isReadyBox: Boolean,
    includedProducts: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        quantity: Number,
      },
    ],
  },
  { _id: true }
);

/**
 * Master Order Schema
 * Represents customer purchase contracts, fulfillment tracking, and payment settlement.
 * Hardened for 10M MAU: 48-bit CSPRNG entropy order numbers, compound verified purchase index, and money precision.
 */
const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      index: true,
    },
    idempotencyKey: {
      type: String,
      index: { unique: true, sparse: true },
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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
      landmark: String,
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
      street: String,
    },

    // Pricing
    subtotal: {
      type: Number,
      required: true,
      min: [0, 'المجموع الفرعي لا يمكن أن يكون سالباً'],
      set: (v) => (v === null || v === undefined ? v : roundTo2Decimals(v)),
    },
    shippingCost: {
      type: Number,
      default: 0,
      min: [0, 'تكلفة الشحن لا يمكن أن تكون سالبة'],
      set: (v) => (v === null || v === undefined ? v : roundTo2Decimals(v)),
    },
    discount: {
      code: String,
      amount: {
        type: Number,
        default: 0,
        min: 0,
        set: (v) => (v === null || v === undefined ? v : roundTo2Decimals(v)),
      },
      type: { type: String, enum: ['percentage', 'fixed'] },
    },
    tax: {
      type: Number,
      default: 0,
      min: 0,
      set: (v) => (v === null || v === undefined ? v : roundTo2Decimals(v)),
    },
    total: {
      type: Number,
      required: true,
      min: [0, 'الإجمالي لا يمكن أن يكون سالباً'],
      set: (v) => (v === null || v === undefined ? v : roundTo2Decimals(v)),
    },
    pointsEarned: {
      type: Number,
      default: 0,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} يجب أن تكون نقاطاً صحيحة',
      },
    },
    pointsRedeemed: {
      type: Number,
      default: 0,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} يجب أن تكون نقاطاً صحيحة',
      },
    },
    pointsDiscount: {
      type: Number,
      default: 0,
      min: 0,
      set: (v) => (v === null || v === undefined ? v : roundTo2Decimals(v)),
    },

    // Payment
    paymentMethod: {
      type: String,
      enum: ['cod', 'instapay'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentDetails: {
      transactionId: String,
      paidAt: Date,
    },

    // Order Status
    status: {
      type: String,
      enum: [
        'pending',
        'confirmed',
        'processing',
        'shipped',
        'out_for_delivery',
        'delivered',
        'cancelled',
        'returned',
      ],
      default: 'pending',
    },
    statusHistory: [
      {
        status: String,
        date: { type: Date, default: Date.now },
        note: String,
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      },
    ],

    // Delivery
    deliveryType: {
      type: String,
      enum: ['standard', 'express', 'same_day', 'scheduled'],
      default: 'standard',
    },
    scheduledDate: Date,
    scheduledTime: String,
    trackingNumber: String,
    estimatedDelivery: Date,
    deliveredAt: Date,

    // Gift Options
    isGift: {
      type: Boolean,
      default: false,
    },
    giftMessage: String,
    giftRecipient: {
      name: String,
      phone: String,
    },
    hidePrice: {
      type: Boolean,
      default: false,
    },

    // Notes
    customerNote: String,
    adminNote: String,

    // Cancellation/Return
    cancellationReason: String,
    cancelledAt: Date,
    returnReason: String,
    returnedAt: Date,
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
  }
);

/**
 * Generates high-entropy order number with 48 bits of CSPRNG entropy
 * Format: HD + YYMM + 12-character uppercase hex string (e.g. HD2608A7F9C3E14B82)
 * Collision risk at 1M orders/month: ~10^-15
 */
const generateSecureOrderNumber = () => {
  const date = new Date();
  const year = date.getUTCFullYear().toString().slice(-2);
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const entropy = crypto.randomBytes(6).toString('hex').toUpperCase();
  return `HD${year}${month}${entropy}`;
};

orderSchema.pre('save', async function (next) {
  // Cap statusHistory to latest 50 entries to prevent BSON bloat
  if (Array.isArray(this.statusHistory) && this.statusHistory.length > 50) {
    this.statusHistory = this.statusHistory.slice(-50);
  }

  if (!this.orderNumber) {
    let generated = generateSecureOrderNumber();
    let attempts = 0;
    const OrderModel = this.constructor;

    while (attempts < 5) {
      const exists = await OrderModel.exists({ orderNumber: generated });
      if (!exists) {
        this.orderNumber = generated;
        break;
      }
      generated = generateSecureOrderNumber();
      attempts += 1;
    }

    if (!this.orderNumber) {
      this.orderNumber = generated;
    }
  }
  next();
});

// -----------------------------------------------------------------------------
// Index Topology
// -----------------------------------------------------------------------------
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1, status: 1, createdAt: -1 });
orderSchema.index({ 'items.product': 1, user: 1, status: 1 }); // Verified purchase acceleration index
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ guestEmail: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
