const express = require('express');
const router = express.Router();
const Category = require('../models/Category');

// @route   GET /api/categories
// @desc    Get all categories
// @access  Public
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .populate('parent', 'name slug')
      .sort({ order: 1 });

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب الفئات'
    });
  }
});

// @route   GET /api/categories/tree
// @desc    Get categories in tree structure
// @access  Public
router.get('/tree', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort({ order: 1 });

    // Build tree structure
    const buildTree = (categories, parentId = null) => {
      return categories
        .filter(cat => {
          if (parentId === null) {
            return !cat.parent;
          }
          return cat.parent && cat.parent.toString() === parentId.toString();
        })
        .map(cat => ({
          ...cat.toObject(),
          children: buildTree(categories, cat._id)
        }));
    };

    const tree = buildTree(categories);

    res.json({
      success: true,
      data: tree
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'حدث خطأ'
    });
  }
});

// @route   GET /api/categories/main
// @desc    Get main (parent) categories only
// @access  Public
router.get('/main', async (req, res) => {
  try {
    const categories = await Category.find({ 
      isActive: true,
      parent: null 
    }).sort({ order: 1 });

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'حدث خطأ'
    });
  }
});

// @route   GET /api/categories/slug/:slug
// @desc    Get category by slug
// @access  Public
router.get('/slug/:slug', async (req, res) => {
  try {
    const category = await Category.findOne({ 
      slug: req.params.slug,
      isActive: true 
    }).populate('parent', 'name slug');

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'الفئة غير موجودة'
      });
    }

    // Get subcategories
    const subcategories = await Category.find({ 
      parent: category._id,
      isActive: true 
    });

    res.json({
      success: true,
      data: {
        ...category.toObject(),
        subcategories
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'حدث خطأ'
    });
  }
});

// @route   GET /api/categories/:id
// @desc    Get category by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('parent', 'name slug');

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'الفئة غير موجودة'
      });
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'حدث خطأ'
    });
  }
});

// @route   GET /api/categories/:id/subcategories
// @desc    Get subcategories of a category
// @access  Public
router.get('/:id/subcategories', async (req, res) => {
  try {
    const subcategories = await Category.find({ 
      parent: req.params.id,
      isActive: true 
    }).sort({ order: 1 });

    res.json({
      success: true,
      data: subcategories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'حدث خطأ'
    });
  }
});

module.exports = router;
