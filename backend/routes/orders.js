const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { protect, apiLimiter } = require('../middleware/auth');
const { CONFIG, MESSAGES } = require('../constants');
const orderController = require('../controllers/orderController');

// @route   POST /api/orders
// @desc    Create new order
// @access  Private (requires authentication)
router.post('/', protect, apiLimiter, [
  body('items').isArray({ min: 1 }).withMessage(MESSAGES.ORDERS.ITEMS_REQUIRED),
  body('items.*.productId').isMongoId().withMessage(MESSAGES.GENERAL.INVALID_ID),
  body('items.*.quantity').isInt({ min: 1 }).withMessage(MESSAGES.ORDERS.INVALID_QUANTITY),
  body('shippingAddress.street').trim().notEmpty().withMessage(MESSAGES.ORDERS.ADDRESS_REQUIRED),
  body('shippingAddress.governorate').trim().notEmpty().withMessage(MESSAGES.ORDERS.GOVERNORATE_REQUIRED),
  body('shippingAddress.phone').trim().notEmpty().withMessage(MESSAGES.ORDERS.PHONE_REQUIRED),
  body('paymentMethod').isIn(CONFIG.PAYMENT_METHODS).withMessage(MESSAGES.ORDERS.PAYMENT_INVALID),
  body('guestEmail').optional().isEmail().withMessage(MESSAGES.VALIDATION.EMAIL_INVALID),
], orderController.createOrder);

// @route   GET /api/orders
// @desc    Get user orders
// @access  Private
router.get('/', protect, orderController.getOrders);

// @route   GET /api/orders/:id
// @desc    Get order by ID
// @access  Private
router.get('/:id', protect, orderController.getOrderById);

// Strict rate limiter for order tracking (prevent brute-force enumeration)
const trackOrderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    success: false,
    message: 'تم تجاوز الحد الأقصى لمحاولات التتبع. حاول مرة أخرى لاحقاً.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/track/:orderNumber', trackOrderLimiter, orderController.trackOrder);

// @route   PUT /api/orders/:id/cancel
// @desc    Cancel order
// @access  Private
router.put('/:id/cancel', protect, orderController.cancelOrder);

module.exports = router;
