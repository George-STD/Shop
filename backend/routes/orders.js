const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { protect, apiLimiter } = require('../middleware/auth');
const { sendOrderConfirmationEmail } = require('../utils/mailer');
const { CONFIG, MESSAGES } = require('../constants');
const { sendSuccess, sendError, sendCreated, sendNotFound, sendForbidden, sendBadRequest, sendPaginated } = require('../utils/response');

// @route   POST /api/orders
// @desc    Create new order
// @access  Private (requires authentication)
router.post('/', protect, apiLimiter, [
  body('items').isArray({ min: 1 }).withMessage(MESSAGES.ORDERS.ITEMS_REQUIRED),
  body('shippingAddress.street').trim().notEmpty().withMessage(MESSAGES.ORDERS.ADDRESS_REQUIRED),
  body('shippingAddress.governorate').trim().notEmpty().withMessage(MESSAGES.ORDERS.GOVERNORATE_REQUIRED),
  body('shippingAddress.phone').trim().notEmpty().withMessage(MESSAGES.ORDERS.PHONE_REQUIRED),
  body('paymentMethod').isIn(CONFIG.PAYMENT_METHODS).withMessage(MESSAGES.ORDERS.PAYMENT_INVALID),
  body('guestEmail').optional().isEmail().withMessage(MESSAGES.VALIDATION.EMAIL_INVALID),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendBadRequest(res, MESSAGES.GENERAL.VALIDATION_ERROR, errors.array());
    }

    // User is guaranteed to exist because of protect middleware
    const userId = req.user._id;

    const {
      items,
      shippingAddress,
      billingAddress,
      paymentMethod,
      deliveryType,
      scheduledDate,
      scheduledTime,
      isGift,
      giftMessage,
      giftRecipient,
      hidePrice,
      customerNote,
      discountCode,
      guestEmail
    } = req.body;

    // Validate items
    if (!items || items.length === 0) {
      return sendBadRequest(res, MESSAGES.ORDERS.NO_ITEMS);
    }

    // Calculate totals and validate products
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      
      if (!product) {
        return sendBadRequest(res, `${MESSAGES.ORDERS.PRODUCT_NOT_FOUND_TEMPLATE}: ${item.productId}`);
      }

      if (product.stock < item.quantity) {
        return sendBadRequest(res, `${MESSAGES.ORDERS.INSUFFICIENT_STOCK_TEMPLATE}: ${product.name}`);
      }

      let itemSubtotal = product.price * item.quantity;
      
      // Add addons price
      if (item.addons && item.addons.length > 0) {
        item.addons.forEach(addon => {
          itemSubtotal += addon.price;
        });
      }

      orderItems.push({
        product: product._id,
        name: product.name,
        slug: product.slug,
        image: product.images[0]?.url,
        price: product.price,
        quantity: item.quantity,
        selectedSize: item.selectedSize,
        selectedColor: item.selectedColor,
        selectedShape: item.selectedShape,
        selectedVariants: item.selectedVariants,
        addons: item.addons,
        boxSelections: item.boxSelections,
        subtotal: itemSubtotal
      });

      subtotal += itemSubtotal;
    }

    // Calculate shipping from config
    const shippingCost = CONFIG.BUSINESS.SHIPPING_COST_EGP;

    // Calculate total
    const total = subtotal + shippingCost;


    // Create order
    const order = await Order.create({
      user: userId,
      items: orderItems,
      shippingAddress,
      billingAddress,
      subtotal,
      shippingCost,
      total,
      paymentMethod,
      deliveryType,
      scheduledDate,
      scheduledTime,
      isGift,
      giftMessage,
      giftRecipient,
      hidePrice,
      customerNote,
      statusHistory: [{
        status: CONFIG.ORDER_STATUS.PENDING,
        note: MESSAGES.ORDERS.RECEIVED
      }]
    });

    // Send confirmation email - use email from form or user's email
    try {
      const emailTo = guestEmail || req.user.email;
      if (emailTo) {
        await sendOrderConfirmationEmail(emailTo, order);
      }
    } catch (mailErr) {
      console.error('Order email error:', mailErr);
    }

    // Update product stock
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity, salesCount: item.quantity }
      });
    }

    return sendCreated(res, { data: order, message: MESSAGES.ORDERS.CREATED });
  } catch (error) {
    console.error('Order creation error:', error);
    return sendError(res, { message: MESSAGES.ORDERS.CREATE_ERROR });
  }
});

// @route   GET /api/orders
// @desc    Get user orders
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = CONFIG.PAGINATION.ORDERS_LIMIT, status } = req.query;
    
    const query = { user: req.user._id };
    if (status && CONFIG.ORDER_STATUSES.includes(String(status))) {
      query.status = String(status);
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Order.countDocuments(query);

    return sendPaginated(res, { data: orders, page, limit, total });
  } catch (error) {
    return sendError(res, { message: MESSAGES.ORDERS.GENERIC_ERROR });
  }
});

// @route   GET /api/orders/:id
// @desc    Get order by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product', 'name slug images');

    if (!order) {
      return sendNotFound(res, MESSAGES.ORDERS.NOT_FOUND);
    }

    // Check if user owns this order
    if (order.user && order.user.toString() !== req.user._id.toString()) {
      return sendForbidden(res, MESSAGES.ORDERS.UNAUTHORIZED);
    }

    return sendSuccess(res, { data: order });
  } catch (error) {
    return sendError(res, { message: MESSAGES.ORDERS.GENERIC_ERROR });
  }
});

// @route   GET /api/orders/track/:orderNumber
// @desc    Track order by order number
// @access  Public
router.get('/track/:orderNumber', async (req, res) => {
  try {
    const param = req.params.orderNumber;
    const query = CONFIG.PATTERNS.MONGODB_ID.test(param) ? { _id: param } : { orderNumber: param };
    const order = await Order.findOne(query).select('orderNumber status statusHistory items.name items.quantity items.image items.price shippingAddress.firstName shippingAddress.lastName shippingAddress.governorate shippingAddress.city shippingAddress.street shippingAddress.phone estimatedDelivery deliveredAt createdAt total subtotal shippingCost');

    if (!order) {
      return sendNotFound(res, MESSAGES.ORDERS.NOT_FOUND);
    }

    return sendSuccess(res, { data: order });
  } catch (error) {
    return sendError(res, { message: MESSAGES.ORDERS.GENERIC_ERROR });
  }
});

// @route   PUT /api/orders/:id/cancel
// @desc    Cancel order
// @access  Private
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return sendNotFound(res, MESSAGES.ORDERS.NOT_FOUND);
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return sendForbidden(res, MESSAGES.ORDERS.UNAUTHORIZED);
    }

    // Can only cancel pending or confirmed orders
    if (!CONFIG.CANCELLABLE_STATUSES.includes(order.status)) {
      return sendBadRequest(res, MESSAGES.ORDERS.CANNOT_CANCEL);
    }

    order.status = CONFIG.ORDER_STATUS.CANCELLED;
    order.cancellationReason = req.body.reason;
    order.cancelledAt = new Date();
    order.statusHistory.push({
      status: CONFIG.ORDER_STATUS.CANCELLED,
      note: req.body.reason || MESSAGES.ORDERS.CANCELLED_BY_CUSTOMER
    });

    await order.save();

    // Restore product stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity, salesCount: -item.quantity }
      });
    }

    return sendSuccess(res, { data: order, message: MESSAGES.ORDERS.CANCELLED });
  } catch (error) {
    return sendError(res, { message: MESSAGES.ORDERS.GENERIC_ERROR });
  }
});

module.exports = router;
