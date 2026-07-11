const ReceivedEmail = require('../../models/ReceivedEmail');
const asyncHandler = require('../../utils/asyncHandler');
const { parsePagination, buildPaginationMeta } = require('../../utils/helpers');

// =====================================================
// RECEIVED EMAILS
// =====================================================
exports.getEmails = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);

  const [emails, total] = await Promise.all([
    ReceivedEmail.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    ReceivedEmail.countDocuments(),
  ]);

  res.json({
    success: true,
    data: emails,
    pagination: buildPaginationMeta({ page, limit, total })
  });
}, 'حدث خطأ أثناء جلب الرسائل');

exports.getEmailById = asyncHandler(async (req, res) => {
  const email = await ReceivedEmail.findById(req.params.id);
  if (!email) return res.status(404).json({ success: false, message: 'الرسالة غير موجودة' });

  if (!email.isRead) {
    email.isRead = true;
    await email.save();
  }
  res.json({ success: true, data: email });
}, 'حدث خطأ أثناء جلب الرسالة');

exports.deleteEmail = asyncHandler(async (req, res) => {
  const email = await ReceivedEmail.findByIdAndDelete(req.params.id);
  if (!email) return res.status(404).json({ success: false, message: 'الرسالة غير موجودة' });
  res.json({ success: true, message: 'تم حذف الرسالة' });
}, 'حدث خطأ أثناء حذف الرسالة');
