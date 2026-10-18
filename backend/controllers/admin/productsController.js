const Product = require('../../models/Product');
const { validationResult } = require('express-validator');
const asyncHandler = require('../../utils/asyncHandler');
const { escapeRegex, buildArabicSearchRegex, parsePagination, buildPaginationMeta } = require('../../utils/helpers');
const logAudit = require('../../utils/auditLogger');
const { processReadyBoxes } = require('../productController');
const { bustCatalog } = require('../../middleware/cache');

// =====================================================
// PRODUCTS MANAGEMENT (Admin)
// =====================================================

const ALLOWED_PRODUCT_FIELDS = [
  'name', 'slug', 'description', 'shortDescription', 'price', 'oldPrice', 'discount',
  'images', 'category', 'subcategory', 'tags', 'occasions', 'recipients', 'budgetRange',
  'stock', 'sku', 'sizes', 'colors', 'shapes', 'addons', 'variantGroups',
  'isActive', 'isFeatured', 'isNewArrival', 'isBestseller',
  'isCustomBox', 'boxSlots', 'seo', 'canBeAddedToBox', 'boxDiscount',
  'isReadyBox', 'autoCalculatePrice', 'includedProducts'
];

exports.getProducts = asyncHandler(async (req, res) => {
  const { search, category } = req.query;
  const { page, limit, skip } = parsePagination(req.query, 10);
  const query = {};

  if (search && String(search).trim()) {
    const rx = { $regex: buildArabicSearchRegex(String(search).trim()), $options: 'i' };
    query.$or = [
      { name: rx },
      { description: rx },
      { sku: rx }
    ];
  }
  if (category) query.category = { $in: [category] };

  const [products, total] = await Promise.all([
    Product.find(query).populate('category', 'name slug').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Product.countDocuments(query)
  ]);

  const processedProducts = await processReadyBoxes(products);

  res.json({
    success: true,
    data: processedProducts,
    pagination: buildPaginationMeta({ page, limit, total })
  });
}, 'حدث خطأ أثناء جلب المنتجات');

const filterAllowedProductFields = (data) => {
  const filtered = {};
  ALLOWED_PRODUCT_FIELDS.forEach(field => {
    if (data[field] !== undefined) filtered[field] = data[field];
  });
  return filtered;
};

exports.createProduct = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const baseSlugInput = (req.body.slug || req.body.name || 'product').toLowerCase().trim();
  const slug = baseSlugInput
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}\-]+/gu, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '') || 'product';
  const uniqueSlug = slug + '-' + Date.now();
  const sku = req.body.sku || ('SKU-' + Date.now() + '-' + Math.floor(Math.random() * 1000));

  const filteredData = filterAllowedProductFields(req.body);
  let product = await Product.create({ ...filteredData, slug: uniqueSlug, sku });

  if (product.isReadyBox) {
    const processed = await processReadyBoxes(product.toObject());
    await Product.updateOne(
      { _id: product._id },
      { $set: { price: processed.price, oldPrice: processed.oldPrice, discount: processed.discount, stock: processed.stock } }
    );
    product.price = processed.price;
    product.oldPrice = processed.oldPrice;
    product.discount = processed.discount;
    product.stock = processed.stock;
  }

  bustCatalog('products');
  
  await logAudit({
    entityType: 'Product',
    entityId: product._id,
    entityName: product.name,
    action: 'CREATE',
    adminId: req.user._id,
    changes: filteredData
  });

  res.status(201).json({ success: true, message: 'تم إنشاء المنتج بنجاح', data: product });
}, 'حدث خطأ أثناء إنشاء المنتج');

exports.createBulkProducts = asyncHandler(async (req, res) => {
  const productsData = req.body.products;
  if (!Array.isArray(productsData) || productsData.length === 0) {
    return res.status(400).json({ success: false, message: 'لم يتم توفير بيانات صالحة للمنتجات' });
  }

  const productsToCreate = productsData.map((data, index) => {
    const baseSlugInput = (data.slug || data.name || 'product').toLowerCase().trim();
    const slug = baseSlugInput
      .replace(/\s+/g, '-')
      .replace(/[^\p{L}\p{N}\-]+/gu, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '') || 'product';
    const uniqueSlug = slug + '-' + Date.now() + '-' + index;
    const sku = data.sku || ('SKU-' + Date.now() + '-' + Math.floor(Math.random() * 1000) + '-' + index);

    const filteredData = filterAllowedProductFields(data);
    return {
      ...filteredData,
      slug: uniqueSlug,
      sku
    };
  });

  const createdProducts = await Product.insertMany(productsToCreate);
  bustCatalog('products');
  res.status(201).json({ success: true, message: `تم إنشاء ${createdProducts.length} منتج بنجاح`, count: createdProducts.length });
}, 'حدث خطأ أثناء الإنشاء الجماعي للمنتجات');

exports.updateProduct = asyncHandler(async (req, res) => {
  const updates = filterAllowedProductFields(req.body);

  if (updates.price !== undefined || updates.oldPrice !== undefined) {
    const existing = await Product.findById(req.params.id).select('price oldPrice').lean();
    if (existing) {
      const nextPrice = updates.price !== undefined ? Number(updates.price) : Number(existing.price);
      const nextOldPrice = updates.oldPrice !== undefined ? Number(updates.oldPrice) : Number(existing.oldPrice);
      if (nextOldPrice && nextOldPrice > nextPrice && nextPrice >= 0) {
        updates.discount = Math.min(100, Math.max(0, Math.round(((nextOldPrice - nextPrice) / nextOldPrice) * 100)));
      } else if (updates.discount === undefined) {
        updates.discount = 0;
      }
    }
  }

  const product = await Product.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  if (!product) return res.status(404).json({ success: false, message: 'المنتج غير موجود' });

  if (product.isReadyBox) {
    const processed = await processReadyBoxes(product.toObject());
    await Product.updateOne(
      { _id: product._id },
      { $set: { price: processed.price, oldPrice: processed.oldPrice, discount: processed.discount, stock: processed.stock } }
    );
    product.price = processed.price;
    product.oldPrice = processed.oldPrice;
    product.discount = processed.discount;
    product.stock = processed.stock;
  }
  
  bustCatalog('products');

  await logAudit({
    entityType: 'Product',
    entityId: product._id,
    entityName: product.name,
    action: 'UPDATE',
    adminId: req.user._id,
    changes: updates
  });

  res.json({ success: true, message: 'تم تحديث المنتج', data: product });
}, 'حدث خطأ أثناء تحديث المنتج');

exports.deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'المنتج غير موجود' });
  
  bustCatalog('products');

  await logAudit({
    entityType: 'Product',
    entityId: product._id,
    entityName: product.name,
    action: 'DELETE',
    adminId: req.user._id,
  });

  res.json({ success: true, message: 'تم حذف المنتج' });
}, 'حدث خطأ أثناء حذف المنتج');

exports.bulkProductAction = asyncHandler(async (req, res) => {
  const { productIds, action, data } = req.body;
  
  if (!Array.isArray(productIds) || productIds.length === 0) {
    return res.status(400).json({ success: false, message: 'يجب تحديد منتج واحد على الأقل' });
  }

  let result;
  const filter = { _id: { $in: productIds } };

  switch (action) {
    case 'activate':
      result = await Product.updateMany(filter, { $set: { isActive: true } });
      break;
    case 'deactivate':
      result = await Product.updateMany(filter, { $set: { isActive: false } });
      break;
    case 'delete':
      result = await Product.deleteMany(filter);
      break;
    case 'setCategory':
      if (!data || !data.categoryId) return res.status(400).json({ success: false, message: 'الفئة مطلوبة' });
      result = await Product.updateMany(filter, { $set: { category: [data.categoryId] } });
      break;
    case 'addCategory':
      if (!data || !data.categoryId) return res.status(400).json({ success: false, message: 'الفئة مطلوبة' });
      result = await Product.updateMany(filter, { $addToSet: { category: data.categoryId } });
      break;
    case 'removeCategory':
      if (!data || !data.categoryId) return res.status(400).json({ success: false, message: 'الفئة مطلوبة' });
      result = await Product.updateMany(filter, { $pull: { category: data.categoryId } });
      break;
    default:
      return res.status(400).json({ success: false, message: 'إجراء غير معروف' });
  }

  bustCatalog('products');
  const count = result.modifiedCount || result.deletedCount || 0;
  
  await logAudit({
    entityType: 'Product',
    entityName: 'تحديث جماعي',
    action: 'BULK_UPDATE',
    adminId: req.user._id,
    changes: { action, count, productIds }
  });

  res.json({ success: true, message: `تم تطبيق الإجراء بنجاح على ${count} منتج`, count });
}, 'حدث خطأ أثناء تطبيق الإجراء الجماعي');
