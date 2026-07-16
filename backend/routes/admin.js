const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');

// Controllers (split into focused modules, re-exported from index)
const adminController = require('../controllers/admin');

// Middleware
const { protect, admin, adminLimiter, validateObjectId, sanitizeInput, logAdminAction } = require('../middleware/auth');

router.use(protect);
router.use(admin);
router.use(adminLimiter);
router.use(sanitizeInput);

// =====================================================
// DASHBOARD STATS
// =====================================================
router.get('/stats', adminController.getStats);

// =====================================================
// USERS MANAGEMENT
// =====================================================
router.get('/users', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().trim(),
  query('role').optional().isIn(['user', 'admin']),
  query('isActive').optional().isBoolean()
], adminController.getUsers);

router.get('/users/:id', validateObjectId('id'), adminController.getUserById);

router.put('/users/:id', [
  validateObjectId('id'),
  logAdminAction('UPDATE_USER'),
  body('firstName').optional().trim().notEmpty(),
  body('lastName').optional().trim().notEmpty(),
  body('email').optional().isEmail(),
  body('phone').optional().trim().notEmpty(),
  body('role').optional().isIn(['user', 'admin']),
  body('isActive').optional().isBoolean()
], adminController.updateUser);

router.delete('/users/:id', [
  validateObjectId('id'),
  logAdminAction('DELETE_USER')
], adminController.deleteUser);

// =====================================================
// PRODUCTS MANAGEMENT
// =====================================================
router.get('/products', adminController.getProducts);

router.post('/products', [
  logAdminAction('CREATE_PRODUCT'),
  body('name').trim().notEmpty().withMessage('اسم المنتج مطلوب'),
  body('description').trim().notEmpty().withMessage('وصف المنتج مطلوب'),
  body('price').isNumeric().withMessage('السعر مطلوب'),
  body('stock').optional().isNumeric().withMessage('الكمية يجب أن تكون رقم'),
  body('category').isArray({ min: 1 }).withMessage('الفئة مطلوبة'),
  body('category.*').isMongoId().withMessage('فئة غير صالحة')
], adminController.createProduct);

router.post('/products/bulk', [
  logAdminAction('CREATE_BULK_PRODUCTS'),
  body('products').isArray({ min: 1 }).withMessage('يجب تقديم مصفوفة المنتجات')
], adminController.createBulkProducts);

router.put('/products/:id', [
  validateObjectId('id'),
  logAdminAction('UPDATE_PRODUCT')
], adminController.updateProduct);

router.delete('/products/:id', [
  validateObjectId('id'),
  logAdminAction('DELETE_PRODUCT')
], adminController.deleteProduct);

// =====================================================
// ORDERS MANAGEMENT
// =====================================================
router.get('/orders', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
], adminController.getOrders);

router.get('/orders/:id', validateObjectId('id'), adminController.getOrderById);

router.put('/orders/:id/status', [
  validateObjectId('id'),
  logAdminAction('UPDATE_ORDER_STATUS'),
  body('status').isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']),
  body('trackingNumber').optional().trim()
], adminController.updateOrderStatus);

// =====================================================
// CATEGORIES MANAGEMENT
// =====================================================
router.post('/categories', [
  logAdminAction('CREATE_CATEGORY'),
  body('name').trim().notEmpty().withMessage('اسم الفئة مطلوب'),
  body('slug').trim().notEmpty().withMessage('slug مطلوب')
], adminController.createCategory);

router.put('/categories/:id', [
  validateObjectId('id'),
  logAdminAction('UPDATE_CATEGORY')
], adminController.updateCategory);

router.delete('/categories/:id', [
  validateObjectId('id'),
  logAdminAction('DELETE_CATEGORY')
], adminController.deleteCategory);

// =====================================================
// REVIEWS MANAGEMENT
// =====================================================
router.get('/reviews', adminController.getReviews);

router.put('/reviews/:id/approve', [
  validateObjectId('id'),
  logAdminAction('APPROVE_REVIEW'),
  body('isApproved').isBoolean()
], adminController.approveReview);

router.delete('/reviews/:id', [
  validateObjectId('id'),
  logAdminAction('DELETE_REVIEW')
], adminController.deleteReview);

// =====================================================
// OCCASIONS MANAGEMENT
// =====================================================
router.get('/occasions', adminController.getOccasions);

router.post('/occasions', [
  body('name').trim().notEmpty().withMessage('اسم المناسبة مطلوب'),
  logAdminAction('CREATE_OCCASION')
], adminController.createOccasion);

router.put('/occasions/:id', [
  validateObjectId('id'),
  logAdminAction('UPDATE_OCCASION')
], adminController.updateOccasion);

router.delete('/occasions/:id', [
  validateObjectId('id'),
  logAdminAction('DELETE_OCCASION')
], adminController.deleteOccasion);

// =====================================================
// RECEIVED EMAILS
// =====================================================
router.get('/emails', adminController.getEmails);
router.get('/emails/:id', validateObjectId('id'), adminController.getEmailById);
router.delete('/emails/:id', validateObjectId('id'), adminController.deleteEmail);

// =====================================================
// BARCODE LOOKUP
// =====================================================
router.get('/barcode/:barcode', adminController.barcodeLookup);

module.exports = router;
