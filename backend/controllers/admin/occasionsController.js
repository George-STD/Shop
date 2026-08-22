const Occasion = require('../../models/Occasion');
const { validationResult } = require('express-validator');
const { logAudit } = require('../../utils/auditLogger');
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

  try {
    const occasion = await Occasion.create({ name, icon, color, isActive, order });

    if (req.user?._id) {
      logAudit({
        entityType: 'Occasion',
        entityId: occasion._id,
        entityName: occasion.name,
        action: 'CREATE',
        adminId: req.user._id,
        changes: { name, icon, color, isActive, order },
        reason: 'Admin created occasion'
      });
    }

    res.status(201).json({ success: true, message: 'تم إنشاء المناسبة بنجاح', data: occasion });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'هذه المناسبة موجودة بالفعل' });
    }
    throw err;
  }
}, 'حدث خطأ أثناء إنشاء المناسبة');

exports.updateOccasion = asyncHandler(async (req, res) => {
  const { name, icon, color, isActive, order } = req.body;
  const occasion = await Occasion.findById(req.params.id);
  if (!occasion) return res.status(404).json({ success: false, message: 'المناسبة غير موجودة' });

  const changes = {};
  if (name && name !== occasion.name) changes.name = { old: occasion.name, new: name };
  if (icon !== undefined && icon !== occasion.icon) changes.icon = { old: occasion.icon, new: icon };
  if (color !== undefined && color !== occasion.color) changes.color = { old: occasion.color, new: color };
  if (isActive !== undefined && isActive !== occasion.isActive) changes.isActive = { old: occasion.isActive, new: isActive };
  if (order !== undefined && order !== occasion.order) changes.order = { old: occasion.order, new: order };

  if (name) occasion.name = name;
  if (icon !== undefined) occasion.icon = icon;
  if (color !== undefined) occasion.color = color;
  if (isActive !== undefined) occasion.isActive = isActive;
  if (order !== undefined) occasion.order = order;
  await occasion.save();

  if (Object.keys(changes).length > 0 && req.user?._id) {
    logAudit({
      entityType: 'Occasion',
      entityId: occasion._id,
      entityName: occasion.name,
      action: 'UPDATE',
      adminId: req.user._id,
      changes,
      reason: 'Admin updated occasion'
    });
  }

  res.json({ success: true, message: 'تم تحديث المناسبة بنجاح', data: occasion });
}, 'حدث خطأ أثناء تحديث المناسبة');

exports.deleteOccasion = asyncHandler(async (req, res) => {
  const occasion = await Occasion.findByIdAndDelete(req.params.id);
  if (!occasion) return res.status(404).json({ success: false, message: 'المناسبة غير موجودة' });

  if (req.user?._id) {
    logAudit({
      entityType: 'Occasion',
      entityId: occasion._id,
      entityName: occasion.name,
      action: 'DELETE',
      adminId: req.user._id,
      changes: { deleted: true },
      reason: 'Admin deleted occasion'
    });
  }

  res.json({ success: true, message: 'تم حذف المناسبة بنجاح' });
}, 'حدث خطأ أثناء حذف المناسبة');
