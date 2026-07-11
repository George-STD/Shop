const Review = require('../../models/Review');
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
  const review = await Review.findByIdAndUpdate(
    req.params.id,
    { isApproved: req.body.isApproved },
    { new: true }
  );
  if (!review) return res.status(404).json({ success: false, message: 'التقييم غير موجود' });
  res.json({
    success: true,
    message: req.body.isApproved ? 'تم اعتماد التقييم' : 'تم رفض التقييم',
    data: review
  });
}, 'حدث خطأ أثناء تحديث التقييم');

exports.deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findByIdAndDelete(req.params.id);
  if (!review) return res.status(404).json({ success: false, message: 'التقييم غير موجود' });
  res.json({ success: true, message: 'تم حذف التقييم' });
}, 'حدث خطأ أثناء حذف التقييم');
