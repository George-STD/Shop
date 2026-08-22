const Category = require('../../models/Category');
const Product = require('../../models/Product');
const { validationResult } = require('express-validator');
const { logAudit } = require('../../utils/auditLogger');
const asyncHandler = require('../../utils/asyncHandler');

// =====================================================
// CATEGORIES MANAGEMENT
// =====================================================

const ALLOWED_CATEGORY_FIELDS = ['name', 'slug', 'description', 'image', 'icon', 'parent', 'order', 'isActive', 'seo', 'showInBox'];

const filterAllowedCategoryFields = (data) => {
  const filtered = {};
  ALLOWED_CATEGORY_FIELDS.forEach(field => {
    if (data[field] !== undefined) filtered[field] = data[field];
  });
  return filtered;
};

exports.createCategory = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const filteredData = filterAllowedCategoryFields(req.body);
  const category = await Category.create(filteredData);

  if (req.user?._id) {
    logAudit({
      entityType: 'Category',
      entityId: category._id,
      entityName: category.name,
      action: 'CREATE',
      adminId: req.user._id,
      changes: filteredData,
      reason: 'Admin created category'
    });
  }

  res.status(201).json({ success: true, message: 'تم إنشاء الفئة بنجاح', data: category });
}, 'حدث خطأ أثناء إنشاء الفئة');

exports.updateCategory = asyncHandler(async (req, res) => {
  const existingCategory = await Category.findById(req.params.id);
  if (!existingCategory) return res.status(404).json({ success: false, message: 'الفئة غير موجودة' });

  const updates = filterAllowedCategoryFields(req.body);
  const changes = {};
  ALLOWED_CATEGORY_FIELDS.forEach(field => {
    if (updates[field] !== undefined && updates[field] !== existingCategory[field]) {
      changes[field] = { old: existingCategory[field], new: updates[field] };
    }
  });

  const category = await Category.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });

  if (Object.keys(changes).length > 0 && req.user?._id) {
    logAudit({
      entityType: 'Category',
      entityId: category._id,
      entityName: category.name,
      action: 'UPDATE',
      adminId: req.user._id,
      changes,
      reason: 'Admin updated category'
    });
  }

  res.json({ success: true, message: 'تم تحديث الفئة', data: category });
}, 'حدث خطأ أثناء تحديث الفئة');

exports.deleteCategory = asyncHandler(async (req, res) => {
  const productsCount = await Product.countDocuments({ category: { $in: [req.params.id] } });
  if (productsCount > 0) {
    return res.status(400).json({
      success: false,
      message: `لا يمكن حذف الفئة لأنها تحتوي على ${productsCount} منتج`
    });
  }

  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) return res.status(404).json({ success: false, message: 'الفئة غير موجودة' });

  if (req.user?._id) {
    logAudit({
      entityType: 'Category',
      entityId: category._id,
      entityName: category.name,
      action: 'DELETE',
      adminId: req.user._id,
      changes: { deleted: true },
      reason: 'Admin deleted category'
    });
  }

  res.json({ success: true, message: 'تم حذف الفئة' });
}, 'حدث خطأ أثناء حذف الفئة');
