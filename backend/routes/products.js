const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Category = require('../models/Category');

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
      page = 1,
      limit = 12,
      featured,
      bestseller,
      newArrivals
    } = req.query;

    // Build query
    const query = { isActive: true };

    // Handle category by ID or slug
    if (category) {
      query.category = category;
    } else if (categorySlug) {
      const categoryDoc = await Category.findOne({ slug: categorySlug });
      if (categoryDoc) {
        query.category = categoryDoc._id;
      }
    }

    if (occasion) {
      query.occasions = { $in: Array.isArray(occasion) ? occasion : [occasion] };
    }

    if (recipient) {
      query.recipients = { $in: Array.isArray(recipient) ? recipient : [recipient] };
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
      query.$text = { $search: search };
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

    res.json({
      success: true,
      data: products,
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / Number(limit)),
        total,
        limit: Number(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب المنتجات'
    });
  }
});

// @route   GET /api/products/featured
// @desc    Get featured products
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const { limit = 8 } = req.query;
    
    const products = await Product.find({ isActive: true, isFeatured: true })
      .populate('category', 'name slug')
      .limit(Number(limit));

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب المنتجات المميزة'
    });
  }
});

// @route   GET /api/products/bestsellers
// @desc    Get bestselling products
// @access  Public
router.get('/bestsellers', async (req, res) => {
  try {
    const { limit = 8 } = req.query;
    
    const products = await Product.find({ isActive: true, isBestseller: true })
      .populate('category', 'name slug')
      .sort({ salesCount: -1 })
      .limit(Number(limit));

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'حدث خطأ'
    });
  }
});

// @route   GET /api/products/new
// @desc    Get new arrivals
// @access  Public
router.get('/new', async (req, res) => {
  try {
    const { limit = 8 } = req.query;
    
    const products = await Product.find({ isActive: true, isNewArrival: true })
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'حدث خطأ'
    });
  }
});

// @route   GET /api/products/by-occasion/:occasion
// @desc    Get products by occasion
// @access  Public
router.get('/by-occasion/:occasion', async (req, res) => {
  try {
    const { limit = 12 } = req.query;
    
    const products = await Product.find({ 
      isActive: true, 
      occasions: req.params.occasion 
    })
      .populate('category', 'name slug')
      .limit(Number(limit));

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'حدث خطأ'
    });
  }
});

// @route   GET /api/products/by-recipient/:recipient
// @desc    Get products by recipient
// @access  Public
router.get('/by-recipient/:recipient', async (req, res) => {
  try {
    const { limit = 12 } = req.query;
    
    const products = await Product.find({ 
      isActive: true, 
      recipients: req.params.recipient 
    })
      .populate('category', 'name slug')
      .limit(Number(limit));

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'حدث خطأ'
    });
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
      return res.status(404).json({
        success: false,
        message: 'المنتج غير موجود'
      });
    }

    // Increment views
    product.views += 1;
    await product.save();

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'حدث خطأ'
    });
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
      return res.status(404).json({
        success: false,
        message: 'المنتج غير موجود'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'حدث خطأ'
    });
  }
});

// @route   GET /api/products/:id/related
// @desc    Get related products
// @access  Public
router.get('/:id/related', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'المنتج غير موجود'
      });
    }

    const related = await Product.find({
      _id: { $ne: product._id },
      isActive: true,
      $or: [
        { category: product.category },
        { occasions: { $in: product.occasions } },
        { tags: { $in: product.tags } }
      ]
    })
      .limit(4)
      .populate('category', 'name slug');

    res.json({
      success: true,
      data: related
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'حدث خطأ'
    });
  }
});

module.exports = router;
