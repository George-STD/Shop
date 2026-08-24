const mongoose = require('mongoose');

/**
 * Immutable Append-Only Loyalty Ledger Schema
 * Serves as the single source of truth for all loyalty earnings, redemptions, and adjustments.
 * Eliminates race conditions, duplicate point minting, and in-document array bloat.
 */
const loyaltyLedgerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    points: {
      type: Number,
      required: true,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} يجب أن تكون قيمة صحيحة لنقاط الولاء',
      },
    },
    type: {
      type: String,
      enum: ['EARNED', 'REDEEMED', 'EXPIRED', 'REFUNDED', 'ADJUSTED'],
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 250,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      sparse: true,
      index: true,
    },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

// Compound index to accelerate user history lookups
loyaltyLedgerSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('LoyaltyLedger', loyaltyLedgerSchema);
