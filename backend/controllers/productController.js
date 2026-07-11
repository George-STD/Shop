const Product = require('../models/Product');
const Category = require('../models/Category');
const { CONFIG, MESSAGES } = require('../constants');
const { sendSuccess, sendError, sendNotFound, sendPaginated } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Get all products with filters
 */
exports.getAllProducts = asyncHandler(async (req, res) => {
  const {
    category,
    categorySlug,
    occasion,
    recipient,
    minPrice,
    maxPrice,
    sort,
    search,
    page = CONFIG.PAGINATION.DEFAULT_PAGE,
    limit = CONFIG.PAGINATION.PRODUCTS_LIMIT,
    featured,
    bestseller,
    newArrivals,
    canBeAddedToBox
  } = req.query;

  const query = { isActive: true };

  if (category) {
    query.category = { $in: [String(category)] };
  } else if (categorySlug) {
    const categoryDoc = await Category.findOne({ slug: String(categorySlug) });
    if (categoryDoc) {
      query.category = { $in: [categoryDoc._id] };
    }
  }

  if (occasion) {
    const occasions = Array.isArray(occasion) ? occasion.map(String) : [String(occasion)];
    query.occasions = { $in: occasions };
  }

  if (recipient) {
    const recipients = Array.isArray(recipient) ? recipient.map(String) : [String(recipient)];
    query.recipients = { $in: recipients };
  }

  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  if (featured === 'true') query.isFeatured = true;
  if (bestseller === 'true') query.isBestseller = true;
  if (newArrivals === 'true') query.isNewArrival = true;
  if (canBeAddedToBox === 'true') query.canBeAddedToBox = true;

  if (search) {
    query.$text = { $search: String(search) };
  }

  let sortOption = { createdAt: -1 };
  if (sort === 'price_asc') sortOption = { price: 1 };
  if (sort === 'price_desc') sortOption = { price: -1 };
  if (sort === 'rating') sortOption = { 'rating.average': -1 };
  if (sort === 'bestselling') sortOption = { salesCount: -1 };
  if (sort === 'newest') sortOption = { createdAt: -1 };

  const finalLimit = Math.min(Number(limit) || 12, 100);
  const skip = (Number(page) - 1) * finalLimit;

  const products = await Product.find(query)
    .populate('category', 'name slug')
    .sort(sortOption)
    .skip(skip)
    .limit(finalLimit);

  const total = await Product.countDocuments(query);

  return sendPaginated(res, { data: products, page, limit: finalLimit, total });
}, MESSAGES.PRODUCTS.FETCH_ERROR);

/**
 * Get featured products
 */
exports.getFeaturedProducts = asyncHandler(async (req, res) => {
  const { limit = CONFIG.LIMITS.FEATURED_PRODUCTS } = req.query;
  const products = await Product.find({ isActive: true, isFeatured: true })
    .populate('category', 'name slug')
    .limit(Number(limit));
  return sendSuccess(res, { data: products });
}, MESSAGES.PRODUCTS.FEATURED_ERROR);

/**
 * Get bestselling products
 */
exports.getBestsellers = asyncHandler(async (req, res) => {
  const { limit = CONFIG.LIMITS.BESTSELLER_PRODUCTS } = req.query;
  const products = await Product.find({ isActive: true, isBestseller: true })
    .populate('category', 'name slug')
    .sort({ salesCount: -1 })
    .limit(Number(limit));
  return sendSuccess(res, { data: products });
}, MESSAGES.PRODUCTS.GENERIC_ERROR);

/**
 * Get new arrivals
 */
exports.getNewArrivals = asyncHandler(async (req, res) => {
  const { limit = CONFIG.LIMITS.NEW_ARRIVALS } = req.query;
  const products = await Product.find({ isActive: true })
    .populate('category', 'name slug')
    .sort({ createdAt: -1 })
    .limit(Number(limit));
  return sendSuccess(res, { data: products });
}, MESSAGES.PRODUCTS.GENERIC_ERROR);

/**
 * Get products by occasion
 */
exports.getProductsByOccasion = asyncHandler(async (req, res) => {
  const { limit = CONFIG.LIMITS.BY_OCCASION } = req.query;
  const products = await Product.find({ 
    isActive: true, 
    occasions: req.params.occasion 
  })
    .populate('category', 'name slug')
    .limit(Number(limit));
  return sendSuccess(res, { data: products });
}, MESSAGES.PRODUCTS.GENERIC_ERROR);

/**
 * Get products by recipient
 */
exports.getProductsByRecipient = asyncHandler(async (req, res) => {
  const { limit = CONFIG.LIMITS.BY_RECIPIENT } = req.query;
  const products = await Product.find({ 
    isActive: true, 
    recipients: req.params.recipient 
  })
    .populate('category', 'name slug')
    .limit(Number(limit));
  return sendSuccess(res, { data: products });
}, MESSAGES.PRODUCTS.GENERIC_ERROR);

/**
 * Get single product by slug
 */
exports.getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ 
    slug: req.params.slug,
    isActive: true 
  }).populate('category', 'name slug');

  if (!product) return sendNotFound(res, MESSAGES.PRODUCTS.NOT_FOUND);

  product.views += 1;
  await product.save();

  return sendSuccess(res, { data: product });
}, MESSAGES.PRODUCTS.GENERIC_ERROR);

/**
 * Get single product by ID
 */
exports.getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate('category', 'name slug');
  if (!product) return sendNotFound(res, MESSAGES.PRODUCTS.NOT_FOUND);
  return sendSuccess(res, { data: product });
}, MESSAGES.PRODUCTS.GENERIC_ERROR);

/**
 * Get related products
 */
exports.getRelatedProducts = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return sendNotFound(res, MESSAGES.PRODUCTS.NOT_FOUND);

  const related = await Product.find({
    _id: { $ne: product._id },
    isActive: true,
    $or: [
      { category: { $in: product.category } },
      { occasions: { $in: product.occasions } },
      { tags: { $in: product.tags } }
    ]
  })
    .limit(CONFIG.LIMITS.RELATED_PRODUCTS)
    .populate('category', 'name slug');

  return sendSuccess(res, { data: related });
}, MESSAGES.PRODUCTS.GENERIC_ERROR);
