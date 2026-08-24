const mongoose = require('mongoose');

/**
 * Daily Order Analytics Rollup Schema
 * Pre-aggregates daily metrics to replace full O(N) collection scans across millions of orders on the admin dashboard.
 */
const orderDailyStatsSchema = new mongoose.Schema(
  {
    date: {
      type: String, // Format: YYYY-MM-DD (UTC)
      required: true,
      unique: true,
      index: true,
    },
    totalOrders: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalRevenue: {
      type: Number,
      default: 0,
      min: 0,
    },
    confirmedRevenue: {
      type: Number,
      default: 0,
      min: 0,
    },
    ordersByStatus: {
      pending: { type: Number, default: 0 },
      confirmed: { type: Number, default: 0 },
      processing: { type: Number, default: 0 },
      shipped: { type: Number, default: 0 },
      out_for_delivery: { type: Number, default: 0 },
      delivered: { type: Number, default: 0 },
      cancelled: { type: Number, default: 0 },
      returned: { type: Number, default: 0 },
    },
    paymentMethods: {
      cod: { type: Number, default: 0 },
      instapay: { type: Number, default: 0 },
    },
    itemsSold: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('OrderDailyStats', orderDailyStatsSchema);
