const mongoose = require('mongoose');
const User = require('../models/User');

// Grace period after verification code expiry before an unverified account is purged
// Default: 1 hour (3600000 ms) after emailVerificationExpires
const DEFAULT_GRACE_PERIOD_MS = 60 * 60 * 1000;

let cleanupIntervalTimer = null;

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

  cleanupIntervalTimer = setInterval(() => {
    cleanupUnverifiedUsers().catch((err) => {
      console.error('[Auto-Cleanup] Periodic run error:', err.message);
    });
  }, intervalMs);

  // Unref timer so it does not block Node.js event loop shutdown
  if (typeof cleanupIntervalTimer.unref === 'function') {
    cleanupIntervalTimer.unref();
  }

  console.log(`[Auto-Cleanup] Unverified user cleanup service scheduled (interval: ${Math.round(intervalMs / 60000)}m).`);
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
  startPeriodicCleanup,
  stopPeriodicCleanup,
  DEFAULT_GRACE_PERIOD_MS
};
