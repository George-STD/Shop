const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { protect, apiLimiter } = require('../middleware/auth');
const { sendOrderConfirmationEmail } = require('../utils/mailer');
const { CONFIG, MESSAGES } = require('../constants');
const { sendSuccess, sendError, sendCreated, sendNotFound, sendForbidden, sendBadRequest, sendPaginated } = require('../utils/response');

const createClientError = (message, statusCode = 400, errors) => ({
  isClientError: true,
  message,
  statusCode,
  errors,
});

const isTransactionNotSupportedError = (error) => {
  if (!error) return false;
  const message = String(error.message || '').toLowerCase();
  return (
    error.codeName === 'IllegalOperation' ||
    error.code === 20 ||
    message.includes('transaction numbers are only allowed on a replica set')
  );
};

const parseQuantity = (value) => {
  const quantity = Number(value);
  if (!Number.isInteger(quantity) || quantity < 1) {
    return null;
  }
  return quantity;
};

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

    if (guestEmail && req.user?.email && guestEmail.toLowerCase() !== req.user.email.toLowerCase()) {
      return sendBadRequest(res, MESSAGES.ORDERS.EMAIL_MISMATCH);
    }

    const createOrderWithSession = async (session) => {
      session.startTransaction();

      // Calculate totals and validate products atomically
      let subtotal = 0;
      const orderItems = [];
      const uniqueProductIds = [...new Set(items.map((item) => String(item.productId)))];
      const products = await Product.find({ _id: { $in: uniqueProductIds } }).session(session);
      const productMap = new Map(products.map((product) => [product._id.toString(), product]));

      for (const item of items) {
        const productId = String(item.productId);
        const quantity = parseQuantity(item.quantity);

        if (!quantity) {
          throw createClientError(MESSAGES.ORDERS.INVALID_QUANTITY);
        }

        const product = productMap.get(productId);

        if (!product) {
          throw createClientError(`${MESSAGES.ORDERS.PRODUCT_NOT_FOUND_TEMPLATE}: ${productId}`);
        }

        if (product.stock < quantity) {
          throw createClientError(`${MESSAGES.ORDERS.INSUFFICIENT_STOCK_TEMPLATE}: ${product.name}`);
        }

        // Rebuild addons from product definitions to prevent client-side price tampering.
        const requestedAddons = Array.isArray(item.addons) ? item.addons : [];
        const availableAddons = Array.isArray(product.addons) ? product.addons : [];
        const normalizedAddons = [];
        let addonsTotal = 0;

        for (const addon of requestedAddons) {
          if (!addon || !addon.name) continue;
          const productAddon = availableAddons.find((available) => available.name === addon.name);
          if (!productAddon) continue;

          const addonPrice = Number(productAddon.price) || 0;
          addonsTotal += addonPrice;
          normalizedAddons.push({
            name: productAddon.name,
            price: addonPrice,
          });
        }

        const itemSubtotal = product.price * quantity + addonsTotal;

        orderItems.push({
          product: product._id,
          name: product.name,
          slug: product.slug,
          image: product.images[0]?.url,
          price: product.price,
          quantity,
          selectedSize: item.selectedSize,
          selectedColor: item.selectedColor,
          selectedShape: item.selectedShape,
          selectedVariants: item.selectedVariants,
          addons: normalizedAddons,
          boxSelections: item.boxSelections,
          subtotal: itemSubtotal,
        });

        subtotal += itemSubtotal;
      }

      // Calculate shipping from config
      const shippingCost = CONFIG.BUSINESS.SHIPPING_COST_EGP;

      // Calculate total
      const total = subtotal + shippingCost;

      // Create order
      const [createdOrder] = await Order.create([
        {
          user: userId,
          guestEmail: req.user?.email || guestEmail || undefined,
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
          discount: discountCode ? { code: discountCode } : undefined,
          statusHistory: [
            {
              status: CONFIG.ORDER_STATUS.PENDING,
              note: MESSAGES.ORDERS.RECEIVED,
            },
          ],
        },
      ], { session });

      order = createdOrder;

      // Update product stock atomically with an additional stock guard.
      for (const item of orderItems) {
        const stockUpdate = await Product.updateOne(
          { _id: item.product, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity, salesCount: item.quantity } },
          { session }
        );

        if (stockUpdate.modifiedCount !== 1) {
          throw createClientError(`${MESSAGES.ORDERS.INSUFFICIENT_STOCK_TEMPLATE}: ${item.name}`);
        }
      }

      await session.commitTransaction();

      return order;
    };

    const createOrderWithoutSession = async () => {
      // Calculate totals and validate products.
      let subtotal = 0;
      const orderItems = [];
      const uniqueProductIds = [...new Set(items.map((item) => String(item.productId)))];
      const products = await Product.find({ _id: { $in: uniqueProductIds } });
      const productMap = new Map(products.map((product) => [product._id.toString(), product]));

      for (const item of items) {
        const productId = String(item.productId);
        const quantity = parseQuantity(item.quantity);

        if (!quantity) {
          throw createClientError(MESSAGES.ORDERS.INVALID_QUANTITY);
        }

        const product = productMap.get(productId);

        if (!product) {
          throw createClientError(`${MESSAGES.ORDERS.PRODUCT_NOT_FOUND_TEMPLATE}: ${productId}`);
        }

        if (product.stock < quantity) {
          throw createClientError(`${MESSAGES.ORDERS.INSUFFICIENT_STOCK_TEMPLATE}: ${product.name}`);
        }

        const requestedAddons = Array.isArray(item.addons) ? item.addons : [];
        const availableAddons = Array.isArray(product.addons) ? product.addons : [];
        const normalizedAddons = [];
        let addonsTotal = 0;

        for (const addon of requestedAddons) {
          if (!addon || !addon.name) continue;
          const productAddon = availableAddons.find((available) => available.name === addon.name);
          if (!productAddon) continue;

          const addonPrice = Number(productAddon.price) || 0;
          addonsTotal += addonPrice;
          normalizedAddons.push({ name: productAddon.name, price: addonPrice });
        }

        const itemSubtotal = product.price * quantity + addonsTotal;

        orderItems.push({
          product: product._id,
          name: product.name,
          slug: product.slug,
          image: product.images[0]?.url,
          price: product.price,
          quantity,
          selectedSize: item.selectedSize,
          selectedColor: item.selectedColor,
          selectedShape: item.selectedShape,
          selectedVariants: item.selectedVariants,
          addons: normalizedAddons,
          boxSelections: item.boxSelections,
          subtotal: itemSubtotal,
        });

        subtotal += itemSubtotal;
      }

      const shippingCost = CONFIG.BUSINESS.SHIPPING_COST_EGP;
      const total = subtotal + shippingCost;

      // Reserve stock first with guarded atomic updates, then create the order.
      const stockUpdates = [];
      for (const item of orderItems) {
        const stockUpdate = await Product.updateOne(
          { _id: item.product, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity, salesCount: item.quantity } }
        );

        if (stockUpdate.modifiedCount !== 1) {
          for (const updatedItem of stockUpdates) {
            await Product.updateOne(
              { _id: updatedItem.product },
              { $inc: { stock: updatedItem.quantity, salesCount: -updatedItem.quantity } }
            );
          }
          throw createClientError(`${MESSAGES.ORDERS.INSUFFICIENT_STOCK_TEMPLATE}: ${item.name}`);
        }

        stockUpdates.push(item);
      }

      try {
        return await Order.create({
          user: userId,
          guestEmail: req.user?.email || guestEmail || undefined,
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
          discount: discountCode ? { code: discountCode } : undefined,
          statusHistory: [
            {
              status: CONFIG.ORDER_STATUS.PENDING,
              note: MESSAGES.ORDERS.RECEIVED,
            },
          ],
        });
      } catch (error) {
        for (const updatedItem of stockUpdates) {
          await Product.updateOne(
            { _id: updatedItem.product },
            { $inc: { stock: updatedItem.quantity, salesCount: -updatedItem.quantity } }
          );
        }
        throw error;
      }
    };

    let order;
    const session = await mongoose.startSession();

    try {
      order = await createOrderWithSession(session);
    } catch (error) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }

      if (error?.isClientError) {
        return sendError(res, {
          message: error.message,
          statusCode: error.statusCode,
          errors: error.errors,
        });
      }

      if (isTransactionNotSupportedError(error)) {
        try {
          order = await createOrderWithoutSession();
        } catch (fallbackError) {
          if (fallbackError?.isClientError) {
            return sendError(res, {
              message: fallbackError.message,
              statusCode: fallbackError.statusCode,
              errors: fallbackError.errors,
            });
          }

          console.error('Order creation error:', fallbackError);
          return sendError(res, { message: MESSAGES.ORDERS.CREATE_ERROR });
        }
      } else {
        console.error('Order creation error:', error);
        return sendError(res, { message: MESSAGES.ORDERS.CREATE_ERROR });
      }
    } finally {
      session.endSession();
    }

    // Send confirmation email - use email from form or user's email
    try {
      const emailTo = req.user?.email || guestEmail;
      if (emailTo) {
        await sendOrderConfirmationEmail(emailTo, order);
      }
    } catch (mailErr) {
      console.error('Order email error:', mailErr);
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
    const orderNumber = String(req.params.orderNumber || '').trim().toUpperCase();

    // Keep tracking lookup strict to order numbers only (no raw ObjectId fallback).
    if (!/^[A-Z0-9-]{6,32}$/.test(orderNumber)) {
      return sendNotFound(res, MESSAGES.ORDERS.NOT_FOUND);
    }

    const order = await Order.findOne({ orderNumber }).select(
      'orderNumber status statusHistory items.name items.quantity items.image estimatedDelivery deliveredAt createdAt'
    );

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
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const order = await Order.findById(req.params.id).session(session);

    if (!order) {
      throw createClientError(MESSAGES.ORDERS.NOT_FOUND, 404);
    }

    if (order.user.toString() !== req.user._id.toString()) {
      throw createClientError(MESSAGES.ORDERS.UNAUTHORIZED, 403);
    }

    // Can only cancel pending or confirmed orders
    if (!CONFIG.CANCELLABLE_STATUSES.includes(order.status)) {
      throw createClientError(MESSAGES.ORDERS.CANNOT_CANCEL, 400);
    }

    order.status = CONFIG.ORDER_STATUS.CANCELLED;
    order.cancellationReason = req.body.reason;
    order.cancelledAt = new Date();
    order.statusHistory.push({
      status: CONFIG.ORDER_STATUS.CANCELLED,
      note: req.body.reason || MESSAGES.ORDERS.CANCELLED_BY_CUSTOMER
    });

    await order.save({ session });

    // Restore product stock
    for (const item of order.items) {
      await Product.updateOne(
        { _id: item.product },
        { $inc: { stock: item.quantity, salesCount: -item.quantity } },
        { session }
      );
    }

    await session.commitTransaction();

    return sendSuccess(res, { data: order, message: MESSAGES.ORDERS.CANCELLED });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    if (isTransactionNotSupportedError(error)) {
      try {
        const order = await Order.findById(req.params.id);

        if (!order) {
          return sendNotFound(res, MESSAGES.ORDERS.NOT_FOUND);
        }

        if (order.user.toString() !== req.user._id.toString()) {
          return sendForbidden(res, MESSAGES.ORDERS.UNAUTHORIZED);
        }

        if (!CONFIG.CANCELLABLE_STATUSES.includes(order.status)) {
          return sendBadRequest(res, MESSAGES.ORDERS.CANNOT_CANCEL);
        }

        order.status = CONFIG.ORDER_STATUS.CANCELLED;
        order.cancellationReason = req.body.reason;
        order.cancelledAt = new Date();
        order.statusHistory.push({
          status: CONFIG.ORDER_STATUS.CANCELLED,
          note: req.body.reason || MESSAGES.ORDERS.CANCELLED_BY_CUSTOMER,
        });

        await order.save();

        for (const item of order.items) {
          await Product.updateOne(
            { _id: item.product },
            { $inc: { stock: item.quantity, salesCount: -item.quantity } }
          );
        }

        return sendSuccess(res, { data: order, message: MESSAGES.ORDERS.CANCELLED });
      } catch (fallbackError) {
        if (fallbackError?.isClientError) {
          return sendError(res, {
            message: fallbackError.message,
            statusCode: fallbackError.statusCode,
            errors: fallbackError.errors,
          });
        }

        return sendError(res, { message: MESSAGES.ORDERS.GENERIC_ERROR });
      }
    }

    if (error?.isClientError) {
      return sendError(res, {
        message: error.message,
        statusCode: error.statusCode,
        errors: error.errors,
      });
    }

    return sendError(res, { message: MESSAGES.ORDERS.GENERIC_ERROR });
  } finally {
    session.endSession();
  }
});

module.exports = router;
