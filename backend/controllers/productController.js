const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const { CONFIG, MESSAGES } = require('../constants');
const { sendSuccess, sendError, sendNotFound, sendPaginated } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');
const { escapeRegex } = require('../utils/helpers');

const processReadyBoxes = async (products) => {
  if (!products) return products;
  const isArray = Array.isArray(products);
  const items = isArray ? products : [products];
  const readyBoxes = items.filter(p => p && p.isReadyBox);
  
  if (readyBoxes.length > 0) {
    await Product.populate(readyBoxes, {
      path: 'includedProducts.product',
      select: 'name stock price oldPrice boxDiscount images'
    });

    readyBoxes.forEach(p => {
      if (p.includedProducts && p.includedProducts.length > 0) {
        let minStock = Infinity;
        let computedPrice = 0;
        let computedOldPrice = 0;

        p.includedProducts.forEach(item => {
          if (item.product) {
            const availableForThis = Math.floor(item.product.stock / item.quantity);
            if (availableForThis < minStock) minStock = availableForThis;
            
            if (p.autoCalculatePrice) {
              let itemCurrentPrice = item.product.price;
              const itemOldPrice = item.product.oldPrice || item.product.price;
              
              if (item.product.boxDiscount > 0) {
                itemCurrentPrice = itemOldPrice - (itemOldPrice * item.product.boxDiscount / 100);
              }
              
              computedPrice += itemCurrentPrice * item.quantity;
              computedOldPrice += itemOldPrice * item.quantity;
            }
          }
        });
        
        p.stock = minStock === Infinity ? 0 : minStock;
        
        if (p.autoCalculatePrice) {
          p.price = computedPrice;
          p.oldPrice = computedOldPrice > computedPrice ? computedOldPrice : null;
          p.discount = p.oldPrice ? Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100) : 0;
        }
      } else {
        p.stock = 0;
      }
      
      // Clean up the populated object if needed, or leave it so frontend can see what's inside
    });
  }
  return isArray ? items : items[0];
};

exports.processReadyBoxes = processReadyBoxes;

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
    canBeAddedToBox,
    isReadyBox
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
    let min = minPrice ? Number(minPrice) : null;
    let max = maxPrice ? Number(maxPrice) : null;
    if (min !== null && max !== null && !isNaN(min) && !isNaN(max) && min > max) {
      [min, max] = [max, min];
    }
    query.price = {};
    if (min !== null && !isNaN(min)) query.price.$gte = min;
    if (max !== null && !isNaN(max)) query.price.$lte = max;
  }

  if (featured === 'true') query.isFeatured = true;
  if (bestseller === 'true') query.isBestseller = true;
  if (newArrivals === 'true') query.isNewArrival = true;
  if (canBeAddedToBox === 'true') query.canBeAddedToBox = true;
  if (isReadyBox === 'true') query.isReadyBox = true;

  if (search) {
    const searchRegex = new RegExp(escapeRegex(search), 'i');
    query.$or = [
      { name: searchRegex },
      { description: searchRegex },
      { tags: searchRegex }
    ];
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
    .limit(finalLimit)
    .lean();

  const processedProducts = await processReadyBoxes(products);
  const total = await Product.countDocuments(query);

  return sendPaginated(res, { data: processedProducts, page, limit: finalLimit, total });
}, MESSAGES.PRODUCTS.FETCH_ERROR);

/**
 * Get featured products
 */
exports.getFeaturedProducts = asyncHandler(async (req, res) => {
  const { limit = CONFIG.LIMITS.FEATURED_PRODUCTS } = req.query;
  const products = await Product.find({ isActive: true, isFeatured: true })
    .populate('category', 'name slug')
    .limit(Number(limit))
    .lean();
  const processedProducts = await processReadyBoxes(products);
  return sendSuccess(res, { data: processedProducts });
}, MESSAGES.PRODUCTS.FEATURED_ERROR);

/**
 * Get bestselling products
 */
exports.getBestsellers = asyncHandler(async (req, res) => {
  const { limit = CONFIG.LIMITS.BESTSELLER_PRODUCTS } = req.query;
  const products = await Product.find({ isActive: true, isBestseller: true })
    .populate('category', 'name slug')
    .sort({ salesCount: -1 })
    .limit(Number(limit))
    .lean();
  const processedProducts = await processReadyBoxes(products);
  return sendSuccess(res, { data: processedProducts });
}, MESSAGES.PRODUCTS.GENERIC_ERROR);

/**
 * Get new arrivals
 */
exports.getNewArrivals = asyncHandler(async (req, res) => {
  const { limit = CONFIG.LIMITS.NEW_ARRIVALS } = req.query;
  const products = await Product.find({ isActive: true })
    .populate('category', 'name slug')
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .lean();
  const processedProducts = await processReadyBoxes(products);
  return sendSuccess(res, { data: processedProducts });
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
    .limit(Number(limit))
    .lean();
  const processedProducts = await processReadyBoxes(products);
  return sendSuccess(res, { data: processedProducts });
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
    .limit(Number(limit))
    .lean();
  const processedProducts = await processReadyBoxes(products);
  return sendSuccess(res, { data: processedProducts });
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

  const processedProduct = await processReadyBoxes(product);
  processedProduct.views += 1;
  
  // Save the view count to original document without awaiting its result to speed up
  Product.updateOne({ _id: processedProduct._id }, { $inc: { views: 1 } }).exec();

  return sendSuccess(res, { data: processedProduct });
}, MESSAGES.PRODUCTS.GENERIC_ERROR);

/**
 * Get single product by ID
 */
exports.getProductById = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return sendNotFound(res, MESSAGES.PRODUCTS.NOT_FOUND);
  }
  const product = await Product.findById(req.params.id)
    .populate('category', 'name slug');
  if (!product) return sendNotFound(res, MESSAGES.PRODUCTS.NOT_FOUND);
  const processedProduct = await processReadyBoxes(product);
  return sendSuccess(res, { data: processedProduct });
}, MESSAGES.PRODUCTS.GENERIC_ERROR);

/**
 * Get related products
 */
exports.getRelatedProducts = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return sendNotFound(res, MESSAGES.PRODUCTS.NOT_FOUND);
  }
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
    .populate('category', 'name slug')
    .lean();

  const processedRelated = await processReadyBoxes(related);
  return sendSuccess(res, { data: processedRelated });
}, MESSAGES.PRODUCTS.GENERIC_ERROR);

exports.processReadyBoxes = processReadyBoxes;
