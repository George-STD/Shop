const Product = require('../../models/Product');
const { validationResult } = require('express-validator');
const asyncHandler = require('../../utils/asyncHandler');
const { escapeRegex, parsePagination, buildPaginationMeta } = require('../../utils/helpers');

// =====================================================
// PRODUCTS MANAGEMENT (Admin)
// =====================================================

const ALLOWED_PRODUCT_FIELDS = [
  'name', 'slug', 'description', 'shortDescription', 'price', 'oldPrice', 'discount',
  'images', 'category', 'subcategory', 'tags', 'occasions', 'recipients', 'budgetRange',
  'stock', 'sku', 'sizes', 'colors', 'shapes', 'addons', 'variantGroups',
  'isActive', 'isFeatured', 'isNewArrival', 'isBestseller',
  'isCustomBox', 'boxSlots', 'seo', 'canBeAddedToBox'
];

exports.getProducts = asyncHandler(async (req, res) => {
  const { search, category } = req.query;
  const { page, limit, skip } = parsePagination(req.query, 10);
  const query = {};

  if (search) {
    query.$or = [
      { name: { $regex: escapeRegex(search), $options: 'i' } },
      { description: { $regex: escapeRegex(search), $options: 'i' } },
      { sku: { $regex: escapeRegex(search), $options: 'i' } }
    ];
  }
  if (category) query.category = { $in: [category] };

  const [products, total] = await Promise.all([
    Product.find(query).populate('category', 'name slug').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Product.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: products,
    pagination: buildPaginationMeta({ page, limit, total })
  });
}, 'حدث خطأ أثناء جلب المنتجات');

exports.createProduct = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const slug = req.body.name.toLowerCase().trim()
    .replace(/\s+/g, '-')
    .replace(/[\u0600-\u06FF]/g, '')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '') || 'product';
  const uniqueSlug = slug + '-' + Date.now();
  const sku = req.body.sku || ('SKU-' + Date.now() + '-' + Math.floor(Math.random() * 1000));

  const product = await Product.create({ ...req.body, slug: uniqueSlug, sku });
  res.status(201).json({ success: true, message: 'تم إنشاء المنتج بنجاح', data: product });
}, 'حدث خطأ أثناء إنشاء المنتج');

exports.createBulkProducts = asyncHandler(async (req, res) => {
  const productsData = req.body.products;
  if (!Array.isArray(productsData) || productsData.length === 0) {
    return res.status(400).json({ success: false, message: 'لم يتم توفير بيانات صالحة للمنتجات' });
  }

  const productsToCreate = productsData.map((data, index) => {
    const slug = (data.name || 'product').toLowerCase().trim()
      .replace(/\s+/g, '-')
      .replace(/[\u0600-\u06FF]/g, '')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '') || 'product';
    const uniqueSlug = slug + '-' + Date.now() + '-' + index;
    const sku = data.sku || ('SKU-' + Date.now() + '-' + Math.floor(Math.random() * 1000) + '-' + index);

    return {
      ...data,
      slug: uniqueSlug,
      sku
    };
  });

  const createdProducts = await Product.insertMany(productsToCreate);
  res.status(201).json({ success: true, message: `تم إنشاء ${createdProducts.length} منتج بنجاح`, count: createdProducts.length });
}, 'حدث خطأ أثناء الإنشاء الجماعي للمنتجات');

exports.updateProduct = asyncHandler(async (req, res) => {
  const updates = {};
  ALLOWED_PRODUCT_FIELDS.forEach(field => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const product = await Product.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  if (!product) return res.status(404).json({ success: false, message: 'المنتج غير موجود' });
  res.json({ success: true, message: 'تم تحديث المنتج', data: product });
}, 'حدث خطأ أثناء تحديث المنتج');

exports.deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'المنتج غير موجود' });
  res.json({ success: true, message: 'تم حذف المنتج' });
}, 'حدث خطأ أثناء حذف المنتج');
