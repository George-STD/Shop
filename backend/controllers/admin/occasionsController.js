const Occasion = require('../../models/Occasion');
const { validationResult } = require('express-validator');
const asyncHandler = require('../../utils/asyncHandler');

// =====================================================
// OCCASIONS MANAGEMENT
// =====================================================
exports.getOccasions = asyncHandler(async (req, res) => {
  const occasions = await Occasion.find().sort({ order: 1, createdAt: 1 });
  res.json({ success: true, data: occasions });
}, 'حدث خطأ أثناء جلب المناسبات');

exports.createOccasion = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { name, icon, color, isActive, order } = req.body;
  const existing = await Occasion.findOne({ name });
  if (existing) return res.status(400).json({ success: false, message: 'هذه المناسبة موجودة بالفعل' });

  const occasion = await Occasion.create({ name, icon, color, isActive, order });
  res.status(201).json({ success: true, message: 'تم إنشاء المناسبة بنجاح', data: occasion });
}, 'حدث خطأ أثناء إنشاء المناسبة');

exports.updateOccasion = asyncHandler(async (req, res) => {
  const { name, icon, color, isActive, order } = req.body;
  const occasion = await Occasion.findById(req.params.id);
  if (!occasion) return res.status(404).json({ success: false, message: 'المناسبة غير موجودة' });

  if (name) occasion.name = name;
  if (icon !== undefined) occasion.icon = icon;
  if (color !== undefined) occasion.color = color;
  if (isActive !== undefined) occasion.isActive = isActive;
  if (order !== undefined) occasion.order = order;
  await occasion.save();

  res.json({ success: true, message: 'تم تحديث المناسبة بنجاح', data: occasion });
}, 'حدث خطأ أثناء تحديث المناسبة');

exports.deleteOccasion = asyncHandler(async (req, res) => {
  const occasion = await Occasion.findByIdAndDelete(req.params.id);
  if (!occasion) return res.status(404).json({ success: false, message: 'المناسبة غير موجودة' });
  res.json({ success: true, message: 'تم حذف المناسبة بنجاح' });
}, 'حدث خطأ أثناء حذف المناسبة');
