const Review = require('../../models/Review');
const { logAudit } = require('../../utils/auditLogger');
const asyncHandler = require('../../utils/asyncHandler');
const { parsePagination, buildPaginationMeta } = require('../../utils/helpers');

// =====================================================
// REVIEWS MANAGEMENT
// =====================================================
exports.getReviews = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const queryObj = {};

  if (req.query.approved !== undefined) queryObj.isApproved = req.query.approved === 'true';

  const [reviews, total] = await Promise.all([
    Review.find(queryObj)
      .populate('user', 'firstName lastName')
      .populate('product', 'name images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Review.countDocuments(queryObj)
  ]);

  res.json({
    success: true,
    data: reviews,
    pagination: buildPaginationMeta({ page, limit, total })
  });
}, 'حدث خطأ أثناء جلب التقييمات');

exports.approveReview = asyncHandler(async (req, res) => {
  const existingReview = await Review.findById(req.params.id);
  if (!existingReview) return res.status(404).json({ success: false, message: 'التقييم غير موجود' });

  const isApproved = Boolean(req.body.isApproved);
  const review = await Review.findByIdAndUpdate(
    req.params.id,
    { isApproved },
    { new: true }
  );

  if (req.user?._id) {
    logAudit({
      entityType: 'Product',
      entityId: review.product?._id || review.product,
      entityName: `Review #${review._id}`,
      action: 'STATUS_CHANGE',
      adminId: req.user._id,
      changes: { isApproved: { old: existingReview.isApproved, new: isApproved } },
      reason: isApproved ? 'Admin approved review' : 'Admin unapproved review'
    });
  }

  res.json({
    success: true,
    message: isApproved ? 'تم اعتماد التقييم' : 'تم إلغاء اعتماد التقييم',
    data: review
  });
}, 'حدث خطأ أثناء تحديث التقييم');

exports.deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findByIdAndDelete(req.params.id);
  if (!review) return res.status(404).json({ success: false, message: 'التقييم غير موجود' });

  if (req.user?._id) {
    logAudit({
      entityType: 'Product',
      entityId: review.product?._id || review.product,
      entityName: `Review #${review._id}`,
      action: 'DELETE',
      adminId: req.user._id,
      changes: { deleted: true },
      reason: 'Admin deleted review'
    });
  }

  res.json({ success: true, message: 'تم حذف التقييم' });
}, 'حدث خطأ أثناء حذف التقييم');
