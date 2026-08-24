const User = require('../models/User');
const LoyaltyLedger = require('../models/LoyaltyLedger');

/**
 * Atomic Loyalty Delta Processor
 * Ensures strictly idempotent, atomic balance updates paired with immutable ledger records.
 *
 * @param {Object} params
 * @param {string|mongoose.Types.ObjectId} params.userId - Target user
 * @param {number} params.pointsDelta - Points to add (positive) or deduct (negative)
 * @param {'EARNED'|'REDEEMED'|'EXPIRED'|'REFUNDED'|'ADJUSTED'} params.type - Transaction type
 * @param {string} params.reason - Human-readable reason
 * @param {string} params.idempotencyKey - Unique operation key (e.g. `order:HD1234:earn`, `review:usr_1:prd_2`)
 * @param {string|mongoose.Types.ObjectId} [params.orderId] - Optional associated order
 * @param {Object} [params.metadata] - Optional additional metadata
 * @param {mongoose.ClientSession} [params.session] - Optional active MongoDB transaction session
 * @returns {Promise<{ success: boolean, ledgerEntry?: Object, alreadyProcessed?: boolean }>}
 */
const applyLoyaltyDelta = async ({
  userId,
  pointsDelta,
  type,
  reason,
  idempotencyKey,
  orderId = null,
  metadata = {},
  session = null,
}) => {
  const points = Math.round(Number(pointsDelta));
  if (!Number.isInteger(points) || points === 0) {
    return { success: false, message: 'Invalid loyalty points delta' };
  }

  // 1. Check if this exact idempotency key was already executed
  const existingLedger = await LoyaltyLedger.findOne({ idempotencyKey }).session(session);
  if (existingLedger) {
    return { success: true, alreadyProcessed: true, ledgerEntry: existingLedger };
  }

  // 2. Build atomic User query filter (prevent negative balances on redemption)
  const userFilter = { _id: userId };
  if (points < 0) {
    userFilter.loyaltyPoints = { $gte: Math.abs(points) };
  }

  const userUpdate = {
    $inc: { loyaltyPoints: points },
    $push: {
      pointsHistory: {
        $each: [
          {
            points,
            reason,
            type,
            createdAt: new Date(),
          },
        ],
        $slice: -50, // Keep in-doc array capped at 50 to prevent BSON bloat
      },
    },
  };

  const updateOptions = session ? { session, new: true } : { new: true };
  const userResult = await User.findOneAndUpdate(userFilter, userUpdate, updateOptions);

  if (!userResult) {
    if (points < 0) {
      throw new Error('رصيد نقاط الولاء غير كافٍ لإتمام العملية');
    }
    throw new Error('المستخدم غير موجود');
  }

  // 3. Write immutable audit ledger entry
  try {
    const ledgerEntry = new LoyaltyLedger({
      user: userId,
      points,
      type,
      reason,
      order: orderId,
      idempotencyKey,
      metadata,
    });

    await ledgerEntry.save({ session });
    return { success: true, ledgerEntry };
  } catch (ledgerError) {
    // If ledger write failed (e.g. concurrent race on unique idempotencyKey) and no transaction is active, compensate
    if (!session && ledgerError.code === 11000) {
      await User.updateOne({ _id: userId }, { $inc: { loyaltyPoints: -points } });
      const duplicateRecord = await LoyaltyLedger.findOne({ idempotencyKey });
      return { success: true, alreadyProcessed: true, ledgerEntry: duplicateRecord };
    }
    throw ledgerError;
  }
};

module.exports = {
  applyLoyaltyDelta,
};
