const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Category = require('../models/Category');
const { CONFIG, MESSAGES } = require('../constants');
const { sendSuccess, sendError, sendNotFound, sendPaginated } = require('../utils/response');

// @route   GET /api/products
// @desc    Get all products with filters
// @access  Public
router.get('/', async (req, res) => {
  try {
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
      newArrivals
    } = req.query;

    // Build query
    const query = { isActive: true };

    // Handle category by ID or slug (sanitize to prevent NoSQL injection)
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

    if (featured === 'true') {
      query.isFeatured = true;
    }

    if (bestseller === 'true') {
      query.isBestseller = true;
    }

    if (newArrivals === 'true') {
      query.isNewArrival = true;
    }

    if (search) {
      query.$text = { $search: String(search) };
    }

    // Build sort
    let sortOption = { createdAt: -1 };
    if (sort === 'price_asc') sortOption = { price: 1 };
    if (sort === 'price_desc') sortOption = { price: -1 };
    if (sort === 'rating') sortOption = { 'rating.average': -1 };
    if (sort === 'bestselling') sortOption = { salesCount: -1 };
    if (sort === 'newest') sortOption = { createdAt: -1 };

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);

    const products = await Product.find(query)
      .populate('category', 'name slug')
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit));

    const total = await Product.countDocuments(query);

    return sendPaginated(res, { data: products, page, limit: Number(limit), total });
  } catch (error) {
    console.error('Error fetching products:', error);
    return sendError(res, { message: MESSAGES.PRODUCTS.FETCH_ERROR });
  }
});

// @route   GET /api/products/featured
// @desc    Get featured products
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const { limit = CONFIG.LIMITS.FEATURED_PRODUCTS } = req.query;
    
    const products = await Product.find({ isActive: true, isFeatured: true })
      .populate('category', 'name slug')
      .limit(Number(limit));

    return sendSuccess(res, { data: products });
  } catch (error) {
    return sendError(res, { message: MESSAGES.PRODUCTS.FEATURED_ERROR });
  }
});

// @route   GET /api/products/bestsellers
// @desc    Get bestselling products
// @access  Public
router.get('/bestsellers', async (req, res) => {
  try {
    const { limit = CONFIG.LIMITS.BESTSELLER_PRODUCTS } = req.query;
    
    const products = await Product.find({ isActive: true, isBestseller: true })
      .populate('category', 'name slug')
      .sort({ salesCount: -1 })
      .limit(Number(limit));

    return sendSuccess(res, { data: products });
  } catch (error) {
    return sendError(res, { message: MESSAGES.PRODUCTS.GENERIC_ERROR });
  }
});

// @route   GET /api/products/new
// @desc    Get new arrivals
// @access  Public
router.get('/new', async (req, res) => {
  try {
    const { limit = CONFIG.LIMITS.NEW_ARRIVALS } = req.query;
    
    const products = await Product.find({ isActive: true })
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    return sendSuccess(res, { data: products });
  } catch (error) {
    return sendError(res, { message: MESSAGES.PRODUCTS.GENERIC_ERROR });
  }
});

// @route   GET /api/products/by-occasion/:occasion
// @desc    Get products by occasion
// @access  Public
router.get('/by-occasion/:occasion', async (req, res) => {
  try {
    const { limit = CONFIG.LIMITS.BY_OCCASION } = req.query;
    
    const products = await Product.find({ 
      isActive: true, 
      occasions: req.params.occasion 
    })
      .populate('category', 'name slug')
      .limit(Number(limit));

    return sendSuccess(res, { data: products });
  } catch (error) {
    return sendError(res, { message: MESSAGES.PRODUCTS.GENERIC_ERROR });
  }
});

// @route   GET /api/products/by-recipient/:recipient
// @desc    Get products by recipient
// @access  Public
router.get('/by-recipient/:recipient', async (req, res) => {
  try {
    const { limit = CONFIG.LIMITS.BY_RECIPIENT } = req.query;
    
    const products = await Product.find({ 
      isActive: true, 
      recipients: req.params.recipient 
    })
      .populate('category', 'name slug')
      .limit(Number(limit));

    return sendSuccess(res, { data: products });
  } catch (error) {
    return sendError(res, { message: MESSAGES.PRODUCTS.GENERIC_ERROR });
  }
});

// @route   GET /api/products/slug/:slug
// @desc    Get single product by slug
// @access  Public
router.get('/slug/:slug', async (req, res) => {
  try {
    const product = await Product.findOne({ 
      slug: req.params.slug,
      isActive: true 
    }).populate('category', 'name slug');

    if (!product) {
      return sendNotFound(res, MESSAGES.PRODUCTS.NOT_FOUND);
    }

    // Increment views
    product.views += 1;
    await product.save();

    return sendSuccess(res, { data: product });
  } catch (error) {
    return sendError(res, { message: MESSAGES.PRODUCTS.GENERIC_ERROR });
  }
});

// @route   GET /api/products/:id
// @desc    Get single product by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name slug');

    if (!product) {
      return sendNotFound(res, MESSAGES.PRODUCTS.NOT_FOUND);
    }

    return sendSuccess(res, { data: product });
  } catch (error) {
    return sendError(res, { message: MESSAGES.PRODUCTS.GENERIC_ERROR });
  }
});

// @route   GET /api/products/:id/related
// @desc    Get related products
// @access  Public
router.get('/:id/related', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return sendNotFound(res, MESSAGES.PRODUCTS.NOT_FOUND);
    }

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
  } catch (error) {
    return sendError(res, { message: MESSAGES.PRODUCTS.GENERIC_ERROR });
  }
});

module.exports = router;
