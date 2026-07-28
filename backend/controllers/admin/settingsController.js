const Settings = require('../../models/Settings');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/response');

/**
 * Get Loyalty Settings (Admin & Public)
 */
exports.getLoyaltySettings = asyncHandler(async (req, res) => {
  const settings = await Settings.getSettings();
  return sendSuccess(res, { data: settings.loyalty });
}, 'حدث خطأ أثناء جلب إعدادات نظام الولاء');

/**
 * Update Loyalty Settings (Admin only)
 */
exports.updateLoyaltySettings = asyncHandler(async (req, res) => {
  const {
    enabled,
    pointsPerEgpSpent,
    pointsPerReview,
    egpPerPointRedeemed,
    minPointsToRedeem
  } = req.body;

  let settings = await Settings.getSettings();

  if (typeof enabled === 'boolean') settings.loyalty.enabled = enabled;
  if (typeof pointsPerEgpSpent === 'number') settings.loyalty.pointsPerEgpSpent = Math.max(0, pointsPerEgpSpent);
  if (typeof pointsPerReview === 'number') settings.loyalty.pointsPerReview = Math.max(0, pointsPerReview);
  if (typeof egpPerPointRedeemed === 'number') settings.loyalty.egpPerPointRedeemed = Math.max(0, egpPerPointRedeemed);
  if (typeof minPointsToRedeem === 'number') settings.loyalty.minPointsToRedeem = Math.max(0, minPointsToRedeem);

  await settings.save();

  return sendSuccess(res, {
    message: 'تم حفظ إعدادات نظام الولاء بنجاح',
    data: settings.loyalty
  });
}, 'حدث خطأ أثناء تحديث إعدادات نظام الولاء');
