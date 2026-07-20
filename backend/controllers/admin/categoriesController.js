const Category = require('../../models/Category');
const Product = require('../../models/Product');
const { validationResult } = require('express-validator');
const asyncHandler = require('../../utils/asyncHandler');

// =====================================================
// CATEGORIES MANAGEMENT
// =====================================================

const ALLOWED_CATEGORY_FIELDS = ['name', 'slug', 'description', 'image', 'icon', 'parent', 'order', 'isActive', 'seo', 'showInBox'];

exports.createCategory = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const category = await Category.create(req.body);
  res.status(201).json({ success: true, message: 'تم إنشاء الفئة بنجاح', data: category });
}, 'حدث خطأ أثناء إنشاء الفئة');

exports.updateCategory = asyncHandler(async (req, res) => {
  const updates = {};
  ALLOWED_CATEGORY_FIELDS.forEach(field => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const category = await Category.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  if (!category) return res.status(404).json({ success: false, message: 'الفئة غير موجودة' });
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
  res.json({ success: true, message: 'تم حذف الفئة' });
}, 'حدث خطأ أثناء حذف الفئة');
