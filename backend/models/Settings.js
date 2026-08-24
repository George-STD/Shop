const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: 'store_settings',
    },
    loyalty: {
      enabled: { type: Boolean, default: true },
      pointsPerEgpSpent: { type: Number, default: 1, min: 0, max: 100 },
      pointsPerReview: { type: Number, default: 50, min: 0, max: 10000 },
      egpPerPointRedeemed: { type: Number, default: 0.1, min: 0, max: 10 }, // 100 points = 10 EGP
      minPointsToRedeem: { type: Number, default: 100, min: 0, max: 100000 },
    },
  },
  { timestamps: true }
);

/**
 * Atomic helper to get or initialize default settings safely without E11000 race conditions across multiple pods
 */
settingsSchema.statics.getSettings = async function () {
  return await this.findOneAndUpdate(
    { key: 'store_settings' },
    { $setOnInsert: { key: 'store_settings' } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

module.exports = mongoose.model('Settings', settingsSchema);
