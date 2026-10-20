const mongoose = require('mongoose');
const User = require('../models/User');
const Order = require('../models/Order');
const { rollbackStock, handleOrderLoyaltyRefundOrDeduction } = require('../controllers/orderController');
const { bustCatalog } = require('../middleware/cache');

// Grace period after verification code expiry before an unverified account is purged
// Default: 1 hour (3600000 ms) after emailVerificationExpires
const DEFAULT_GRACE_PERIOD_MS = 60 * 60 * 1000;
const DEFAULT_PAYMOB_ORDER_EXPIRY_MS = 60 * 60 * 1000; // 60 minutes

let cleanupIntervalTimer = null;

/**
 * Cancels abandoned unpaid Paymob orders older than expiryMs and restores reserved stock & loyalty points.
 * @param {Object} options
 * @param {number} [options.expiryMs=3600000] - Time in ms before an unpaid Paymob order is cancelled
 * @returns {Promise<{ cancelledCount: number }>}
 */
const cleanupExpiredPaymobOrders = async (options = {}) => {
  if (mongoose.connection.readyState !== 1) {
    return { cancelledCount: 0 };
  }

  const expiryMs = typeof options.expiryMs === 'number' ? options.expiryMs : DEFAULT_PAYMOB_ORDER_EXPIRY_MS;
  const threshold = new Date(Date.now() - expiryMs);

  try {
    const expiredOrders = await Order.find({
      paymentMethod: { $in: ['paymob', 'paymob_card', 'paymob_wallet'] },
      paymentStatus: { $in: ['pending', 'failed'] },
      status: 'pending',
      createdAt: { $lt: threshold },
    }).limit(100);

    let cancelledCount = 0;
    for (const candidate of expiredOrders) {
      const updated = await Order.findOneAndUpdate(
        {
          _id: candidate._id,
          status: 'pending',
          paymentStatus: { $in: ['pending', 'failed'] },
        },
        {
          $set: {
            status: 'cancelled',
            paymentStatus: 'failed',
            cancellationReason: 'انتهت مهلة الدفع الإلكتروني تلقائياً',
            cancelledAt: new Date(),
          },
          $push: {
            statusHistory: {
              $each: [
                {
                  status: 'cancelled',
                  date: new Date(),
                  note: 'تم إلغاء الطلب تلقائياً لعدم استكمال الدفع الإلكتروني خلال المهلة المحددة واسترجاع المخزون',
                },
              ],
              $slice: -50,
            },
          },
        },
        { new: true }
      );

      if (updated) {
        await rollbackStock(updated.items);
        await handleOrderLoyaltyRefundOrDeduction(updated);
        cancelledCount += 1;
      }
    }

    if (cancelledCount > 0) {
      bustCatalog('products');
      bustCatalog('admin-stats');
      console.log(`[Auto-Cleanup] Cancelled ${cancelledCount} expired unpaid Paymob order(s) and restored stock.`);
    }

    return { cancelledCount };
  } catch (error) {
    console.error('[Auto-Cleanup] Error cleaning up expired Paymob orders:', error.message);
    return { cancelledCount: 0, error };
  }
};

/**
 * Purges abandoned unverified user accounts whose verification code expired.
 * Safety fences:
 * - Only users with isVerified === false
 * - Only users with role === 'user' (never touches admins)
 * - Excludes users who still have active unexpired verification windows
 * @param {Object} options
 * @param {number} [options.gracePeriodMs] - Time in ms past emailVerificationExpires before purge
 * @returns {Promise<{ deletedCount: number }>}
 */
const cleanupUnverifiedUsers = async (options = {}) => {
  if (mongoose.connection.readyState !== 1) {
    return { deletedCount: 0 };
  }

  const gracePeriodMs = typeof options.gracePeriodMs === 'number' ? options.gracePeriodMs : DEFAULT_GRACE_PERIOD_MS;
  const now = new Date();
  const expiryThreshold = new Date(now.getTime() - gracePeriodMs);

  const filter = {
    isVerified: false,
    role: 'user',
    $or: [
      { emailVerificationExpires: { $lt: expiryThreshold } },
      {
        emailVerificationExpires: { $exists: false },
        createdAt: { $lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
      }
    ]
  };

  try {
    const result = await User.deleteMany(filter);
    if (result.deletedCount > 0) {
      console.log(`[Auto-Cleanup] Successfully removed ${result.deletedCount} unverified expired user account(s).`);
    }
    return { deletedCount: result.deletedCount || 0 };
  } catch (error) {
    console.error('[Auto-Cleanup] Error cleaning up unverified users:', error.message);
    return { deletedCount: 0, error };
  }
};

/**
 * Starts periodic background cleanup of unverified users.
 * Runs once immediately, then every intervalMs.
 * @param {number} [intervalMs=3600000] - Cleanup interval in ms (default 1 hour)
 */
const startPeriodicCleanup = (intervalMs = 60 * 60 * 1000) => {
  if (cleanupIntervalTimer) {
    clearInterval(cleanupIntervalTimer);
    cleanupIntervalTimer = null;
  }

  // Run initial cleanup in background (non-blocking)
  cleanupUnverifiedUsers().catch((err) => {
    console.error('[Auto-Cleanup] Initial run error:', err.message);
  });
  cleanupExpiredPaymobOrders().catch((err) => {
    console.error('[Auto-Cleanup] Initial Paymob order cleanup error:', err.message);
  });

  cleanupIntervalTimer = setInterval(() => {
    cleanupUnverifiedUsers().catch((err) => {
      console.error('[Auto-Cleanup] Periodic run error:', err.message);
    });
    cleanupExpiredPaymobOrders().catch((err) => {
      console.error('[Auto-Cleanup] Periodic Paymob order cleanup error:', err.message);
    });
  }, intervalMs);

  // Unref timer so it does not block Node.js event loop shutdown
  if (typeof cleanupIntervalTimer.unref === 'function') {
    cleanupIntervalTimer.unref();
  }

  console.log(`[Auto-Cleanup] Unverified user & unpaid order cleanup service scheduled (interval: ${Math.round(intervalMs / 60000)}m).`);
};

/**
 * Stops periodic cleanup timer (for graceful shutdown or test teardown).
 */
const stopPeriodicCleanup = () => {
  if (cleanupIntervalTimer) {
    clearInterval(cleanupIntervalTimer);
    cleanupIntervalTimer = null;
    console.log('[Auto-Cleanup] Cleanup service stopped.');
  }
};

module.exports = {
  cleanupUnverifiedUsers,
  cleanupExpiredPaymobOrders,
  startPeriodicCleanup,
  stopPeriodicCleanup,
  DEFAULT_GRACE_PERIOD_MS,
  DEFAULT_PAYMOB_ORDER_EXPIRY_MS,
};
