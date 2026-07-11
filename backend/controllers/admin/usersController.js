const User = require('../../models/User');
const Order = require('../../models/Order');
const { validationResult } = require('express-validator');
const asyncHandler = require('../../utils/asyncHandler');
const { escapeRegex, parsePagination, buildPaginationMeta } = require('../../utils/helpers');

// =====================================================
// USERS MANAGEMENT
// =====================================================
exports.getUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const queryObj = {};

  if (req.query.search) {
    const search = escapeRegex(req.query.search);
    queryObj.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } }
    ];
  }
  if (req.query.role) queryObj.role = req.query.role;
  if (req.query.isActive !== undefined) queryObj.isActive = req.query.isActive === 'true';

  const [users, total] = await Promise.all([
    User.find(queryObj)
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(queryObj)
  ]);

  res.json({
    success: true,
    data: users,
    pagination: buildPaginationMeta({ page, limit, total })
  });
}, 'حدث خطأ أثناء جلب المستخدمين');

exports.getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select('-password -resetPasswordToken -resetPasswordExpires');
  if (!user) return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });

  const orders = await Order.find({ user: user._id })
    .sort({ createdAt: -1 })
    .limit(10)
    .select('orderNumber total status createdAt');

  res.json({ success: true, data: { user, orders } });
}, 'حدث خطأ أثناء جلب بيانات المستخدم');

exports.updateUser = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  if (req.params.id === req.user._id.toString() && req.body.role === 'user') {
    return res.status(400).json({ success: false, message: 'لا يمكنك إزالة صلاحيات المسؤول عن نفسك' });
  }
  if (req.params.id === req.user._id.toString() && req.body.isActive === false) {
    return res.status(400).json({ success: false, message: 'لا يمكنك تعطيل حسابك' });
  }

  const allowedUpdates = ['firstName', 'lastName', 'email', 'phone', 'role', 'isActive'];
  const updates = {};
  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
    .select('-password -resetPasswordToken -resetPasswordExpires');
  if (!user) return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });

  res.json({ success: true, message: 'تم تحديث بيانات المستخدم', data: user });
}, 'حدث خطأ أثناء تحديث بيانات المستخدم');

exports.deleteUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    return res.status(400).json({ success: false, message: 'لا يمكنك حذف حسابك' });
  }
  const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!user) return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
  res.json({ success: true, message: 'تم تعطيل حساب المستخدم' });
}, 'حدث خطأ أثناء حذف المستخدم');
