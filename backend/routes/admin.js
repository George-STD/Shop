const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { body, validationResult, query } = require('express-validator');

// Models
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Category = require('../models/Category');
const Review = require('../models/Review');

// Middleware
const { 
  protect, 
  admin, 
  adminLimiter, 
  validateObjectId, 
  sanitizeInput,
  logAdminAction 
} = require('../middleware/auth');

// Apply protection to all admin routes
router.use(protect);
router.use(admin);
router.use(adminLimiter);
router.use(sanitizeInput);

// =====================================================
// DASHBOARD STATS
// =====================================================

// @route   GET /api/admin/stats
// @desc    Get dashboard statistics
// @access  Private/Admin
router.get('/stats', async (req, res) => {
  try {
    const [
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue,
      recentOrders,
      topProducts,
      ordersByStatus,
      monthlyRevenue
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Product.countDocuments({ isActive: true }),
      Order.countDocuments(),
      Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Order.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('user', 'firstName lastName email')
        .select('orderNumber total status createdAt'),
      Product.find({ isActive: true })
        .sort({ salesCount: -1 })
        .limit(5)
        .select('name price salesCount images'),
      Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Order.aggregate([
        {
          $match: {
            createdAt: { 
              $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) 
            }
          }
        },
        {
          $group: {
            _id: { 
              month: { $month: '$createdAt' }, 
              year: { $year: '$createdAt' } 
            },
            revenue: { $sum: '$total' },
            orders: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalProducts,
          totalOrders,
          totalRevenue: totalRevenue[0]?.total || 0
        },
        recentOrders,
        topProducts,
        ordersByStatus: ordersByStatus.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
        monthlyRevenue
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب الإحصائيات'
    });
  }
});

// =====================================================
// USERS MANAGEMENT
// =====================================================

// @route   GET /api/admin/users
// @desc    Get all users with pagination and filters
// @access  Private/Admin
router.get('/users', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().trim(),
  query('role').optional().isIn(['user', 'admin']),
  query('isActive').optional().isBoolean()
], async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Build query
    const queryObj = {};
    
    if (req.query.search) {
      queryObj.$or = [
        { firstName: { $regex: req.query.search, $options: 'i' } },
        { lastName: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { phone: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    if (req.query.role) {
      queryObj.role = req.query.role;
    }
    
    if (req.query.isActive !== undefined) {
      queryObj.isActive = req.query.isActive === 'true';
    }

    const [users, total] = await Promise.all([
      User.find(queryObj)
        .select('-password -resetPasswordToken -resetPasswordExpires')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(queryObj)
    ]);

    res.json({
      success: true,
      data: users,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب المستخدمين'
    });
  }
});

// @route   GET /api/admin/users/:id
// @desc    Get single user by ID
// @access  Private/Admin
router.get('/users/:id', validateObjectId('id'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -resetPasswordToken -resetPasswordExpires');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    // Get user's orders
    const orders = await Order.find({ user: user._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('orderNumber total status createdAt');

    res.json({
      success: true,
      data: { user, orders }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب بيانات المستخدم'
    });
  }
});

// @route   PUT /api/admin/users/:id
// @desc    Update user
// @access  Private/Admin
router.put('/users/:id', [
  validateObjectId('id'),
  logAdminAction('UPDATE_USER'),
  body('firstName').optional().trim().notEmpty(),
  body('lastName').optional().trim().notEmpty(),
  body('email').optional().isEmail(),
  body('phone').optional().trim().notEmpty(),
  body('role').optional().isIn(['user', 'admin']),
  body('isActive').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Prevent admin from demoting themselves
    if (req.params.id === req.user._id.toString() && req.body.role === 'user') {
      return res.status(400).json({
        success: false,
        message: 'لا يمكنك إزالة صلاحيات المسؤول عن نفسك'
      });
    }

    // Prevent admin from deactivating themselves
    if (req.params.id === req.user._id.toString() && req.body.isActive === false) {
      return res.status(400).json({
        success: false,
        message: 'لا يمكنك تعطيل حسابك'
      });
    }

    const allowedUpdates = ['firstName', 'lastName', 'email', 'phone', 'role', 'isActive'];
    const updates = {};
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password -resetPasswordToken -resetPasswordExpires');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    res.json({
      success: true,
      message: 'تم تحديث بيانات المستخدم',
      data: user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث بيانات المستخدم'
    });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user (soft delete - deactivate)
// @access  Private/Admin
router.delete('/users/:id', [
  validateObjectId('id'),
  logAdminAction('DELETE_USER')
], async (req, res) => {
  try {
    // Prevent admin from deleting themselves
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'لا يمكنك حذف حسابك'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    res.json({
      success: true,
      message: 'تم تعطيل حساب المستخدم'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء حذف المستخدم'
    });
  }
});

// =====================================================
// PRODUCTS MANAGEMENT
// =====================================================

// @route   POST /api/admin/products
// @desc    Create new product
// @access  Private/Admin
router.post('/products', [
  logAdminAction('CREATE_PRODUCT'),
  body('name').trim().notEmpty().withMessage('اسم المنتج مطلوب'),
  body('price').isNumeric().withMessage('السعر مطلوب'),
  body('category').isMongoId().withMessage('الفئة مطلوبة')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Generate slug from name
    const slug = req.body.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      + '-' + Date.now();

      // Auto-generate SKU if not provided
      let sku = req.body.sku;
      if (!sku) {
        // Simple SKU generation: 'SKU-' + timestamp + random 3 digits
        sku = 'SKU-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
      }

      const product = await Product.create({
        ...req.body,
        slug,
        sku
      });

    res.status(201).json({
      success: true,
      message: 'تم إنشاء المنتج بنجاح',
      data: product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إنشاء المنتج'
    });
  }
});

// @route   PUT /api/admin/products/:id
// @desc    Update product
// @access  Private/Admin
router.put('/products/:id', [
  validateObjectId('id'),
  logAdminAction('UPDATE_PRODUCT')
], async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'المنتج غير موجود'
      });
    }

    res.json({
      success: true,
      message: 'تم تحديث المنتج',
      data: product
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث المنتج'
    });
  }
});

// @route   DELETE /api/admin/products/:id
// @desc    Delete product (soft delete)
// @access  Private/Admin
router.delete('/products/:id', [
  validateObjectId('id'),
  logAdminAction('DELETE_PRODUCT')
], async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'المنتج غير موجود'
      });
    }

    res.json({
      success: true,
      message: 'تم حذف المنتج'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء حذف المنتج'
    });
  }
});

// =====================================================
// ORDERS MANAGEMENT
// =====================================================

// @route   GET /api/admin/orders
// @desc    Get all orders with filters
// @access  Private/Admin
router.get('/orders', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
], async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const queryObj = {};

    if (req.query.status) {
      queryObj.status = req.query.status;
    }

    if (req.query.startDate || req.query.endDate) {
      queryObj.createdAt = {};
      if (req.query.startDate) queryObj.createdAt.$gte = new Date(req.query.startDate);
      if (req.query.endDate) queryObj.createdAt.$lte = new Date(req.query.endDate);
    }

    if (req.query.search) {
      queryObj.$or = [
        { orderNumber: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const [orders, total] = await Promise.all([
      Order.find(queryObj)
        .populate('user', 'firstName lastName email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(queryObj)
    ]);

    res.json({
      success: true,
      data: orders,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب الطلبات'
    });
  }
});

// @route   GET /api/admin/orders/:id
// @desc    Get single order
// @access  Private/Admin
router.get('/orders/:id', validateObjectId('id'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'firstName lastName email phone')
      .populate('items.product', 'name price images');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'الطلب غير موجود'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب الطلب'
    });
  }
});

// @route   PUT /api/admin/orders/:id/status
// @desc    Update order status
// @access  Private/Admin
router.put('/orders/:id/status', [
  validateObjectId('id'),
  logAdminAction('UPDATE_ORDER_STATUS'),
  body('status').isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'])
], async (req, res) => {
  try {
    const { status } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'الطلب غير موجود'
      });
    }

    // Update status and add to history
    order.status = status;
    order.statusHistory.push({
      status,
      date: new Date(),
      note: `تم تحديث الحالة بواسطة المسؤول`
    });

    await order.save();

    res.json({
      success: true,
      message: 'تم تحديث حالة الطلب',
      data: order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث حالة الطلب'
    });
  }
});

// =====================================================
// CATEGORIES MANAGEMENT
// =====================================================

// @route   POST /api/admin/categories
// @desc    Create category
// @access  Private/Admin
router.post('/categories', [
  logAdminAction('CREATE_CATEGORY'),
  body('name').trim().notEmpty().withMessage('اسم الفئة مطلوب'),
  body('slug').trim().notEmpty().withMessage('slug مطلوب')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const category = await Category.create(req.body);

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الفئة بنجاح',
      data: category
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إنشاء الفئة'
    });
  }
});

// @route   PUT /api/admin/categories/:id
// @desc    Update category
// @access  Private/Admin
router.put('/categories/:id', [
  validateObjectId('id'),
  logAdminAction('UPDATE_CATEGORY')
], async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'الفئة غير موجودة'
      });
    }

    res.json({
      success: true,
      message: 'تم تحديث الفئة',
      data: category
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث الفئة'
    });
  }
});

// @route   DELETE /api/admin/categories/:id
// @desc    Delete category
// @access  Private/Admin
router.delete('/categories/:id', [
  validateObjectId('id'),
  logAdminAction('DELETE_CATEGORY')
], async (req, res) => {
  try {
    // Check if category has products
    const productsCount = await Product.countDocuments({ category: req.params.id });
    
    if (productsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `لا يمكن حذف الفئة لأنها تحتوي على ${productsCount} منتج`
      });
    }

    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'الفئة غير موجودة'
      });
    }

    res.json({
      success: true,
      message: 'تم حذف الفئة'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء حذف الفئة'
    });
  }
});

// =====================================================
// REVIEWS MANAGEMENT
// =====================================================

// @route   GET /api/admin/reviews
// @desc    Get all reviews
// @access  Private/Admin
router.get('/reviews', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const queryObj = {};

    if (req.query.approved !== undefined) {
      queryObj.isApproved = req.query.approved === 'true';
    }

    const [reviews, total] = await Promise.all([
      Review.find(queryObj)
        .populate('user', 'firstName lastName')
        .populate('product', 'name images')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Review.countDocuments(queryObj)
    ]);

    res.json({
      success: true,
      data: reviews,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب التقييمات'
    });
  }
});

// @route   PUT /api/admin/reviews/:id/approve
// @desc    Approve or reject review
// @access  Private/Admin
router.put('/reviews/:id/approve', [
  validateObjectId('id'),
  logAdminAction('APPROVE_REVIEW'),
  body('isApproved').isBoolean()
], async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { isApproved: req.body.isApproved },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'التقييم غير موجود'
      });
    }

    res.json({
      success: true,
      message: req.body.isApproved ? 'تم اعتماد التقييم' : 'تم رفض التقييم',
      data: review
    });
  } catch (error) {
    console.error('Approve review error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث التقييم'
    });
  }
});

// @route   DELETE /api/admin/reviews/:id
// @desc    Delete review
// @access  Private/Admin
router.delete('/reviews/:id', [
  validateObjectId('id'),
  logAdminAction('DELETE_REVIEW')
], async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'التقييم غير موجود'
      });
    }

    res.json({
      success: true,
      message: 'تم حذف التقييم'
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء حذف التقييم'
    });
  }
});

module.exports = router;
