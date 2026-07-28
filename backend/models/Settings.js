const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: 'store_settings'
    },
    loyalty: {
      enabled: { type: Boolean, default: true },
      pointsPerEgpSpent: { type: Number, default: 1, min: 0 },
      pointsPerReview: { type: Number, default: 50, min: 0 },
      egpPerPointRedeemed: { type: Number, default: 0.1, min: 0 }, // 100 points = 10 EGP
      minPointsToRedeem: { type: Number, default: 100, min: 0 }
    }
  },
  { timestamps: true }
);

// Helper method to get or initialize default settings
settingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne({ key: 'store_settings' });
  if (!settings) {
    settings = await this.create({ key: 'store_settings' });
  }
  return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);
