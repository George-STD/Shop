const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { sendOrderConfirmationEmail } = require('../utils/mailer');
const { CONFIG, MESSAGES } = require('../constants');
const { sendSuccess, sendError, sendCreated, sendNotFound, sendForbidden, sendBadRequest, sendPaginated } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

// =====================================================
// HELPERS
// =====================================================

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
  if (!Number.isInteger(quantity) || quantity < 1) return null;
  return quantity;
};

/**
 * Shared logic: validate items, resolve products, build order items array.
 * Used by both the session and non-session paths to eliminate duplication.
 *
 * @param {Array}  items      - Raw items from the request body
 * @param {Map}    productMap - Map<string, Product>
 * @returns {{ orderItems: Array, subtotal: number, boxGroups: Set }}
 */
const buildOrderItems = (items, productMap) => {
  let subtotal = 0;
  const orderItems = [];
  const boxGroups = new Set();
  const boxCounts = new Map();

  for (const item of items) {
    const productId = String(item.productId);
    const quantity = parseQuantity(item.quantity);
    if (!quantity) throw createClientError(MESSAGES.ORDERS.INVALID_QUANTITY);

    const product = productMap.get(productId);
    if (!product) throw createClientError(`${MESSAGES.ORDERS.PRODUCT_NOT_FOUND_TEMPLATE}: ${productId}`);
    if (product.stock < quantity) throw createClientError(`${MESSAGES.ORDERS.INSUFFICIENT_STOCK_TEMPLATE}: ${product.name}`);

    // Process addons
    const requestedAddons = Array.isArray(item.addons) ? item.addons : [];
    const availableAddons = Array.isArray(product.addons) ? product.addons : [];
    const normalizedAddons = [];
    let addonsTotal = 0;

    for (const addon of requestedAddons) {
      if (!addon || !addon.name) continue;
      const productAddon = availableAddons.find((a) => a.name === addon.name);
      if (!productAddon) continue;
      const addonPrice = Number(productAddon.price) || 0;
      addonsTotal += addonPrice;
      normalizedAddons.push({ name: productAddon.name, price: addonPrice });
    }

    // Price calculation
    let finalPrice = product.price;
    
    // Override price if size is selected
    if (item.selectedSize && Array.isArray(product.sizes) && product.sizes.length > 0) {
      const selectedSizeObj = product.sizes.find(s => s.name === item.selectedSize);
      if (!selectedSizeObj) {
        throw createClientError(`المقاس المختار غير صحيح: ${item.selectedSize}`);
      }
      // Use size price if valid, otherwise fallback to product base price
      finalPrice = (selectedSizeObj.price !== undefined && selectedSizeObj.price !== null) ? Number(selectedSizeObj.price) : product.price;
    }

    // Apply box logic
    if (item.boxId) {
      boxGroups.add(item.boxId);
      boxCounts.set(item.boxId, (boxCounts.get(item.boxId) || 0) + quantity);
      const discountPercent = product.boxDiscount !== undefined ? product.boxDiscount : 25;
      finalPrice = finalPrice * (1 - discountPercent / 100);
    }

    const itemSubtotal = finalPrice * quantity + addonsTotal;

    orderItems.push({
      product: product._id,
      name: product.name,
      slug: product.slug,
      image: product.images[0]?.url,
      price: finalPrice,
      quantity,
      selectedSize: item.selectedSize,
      selectedColor: item.selectedColor,
      selectedShape: item.selectedShape,
      selectedVariants: item.selectedVariants,
      addons: normalizedAddons,
      boxSelections: item.boxSelections,
      boxId: item.boxId,
      subtotal: itemSubtotal,
    });

    subtotal += itemSubtotal;
  }

  // Validate box constraints
  for (const count of boxCounts.values()) {
    if (count < CONFIG.BUSINESS.BOX_MIN_ITEMS) {
      throw createClientError(`الصندوق يجب أن يحتوي على الأقل ${CONFIG.BUSINESS.BOX_MIN_ITEMS} منتجات`);
    }
    if (count > CONFIG.BUSINESS.BOX_MAX_ITEMS) {
      throw createClientError(`الصندوق لا يمكن أن يحتوي على أكثر من ${CONFIG.BUSINESS.BOX_MAX_ITEMS} منتجات`);
    }
  }

  return { orderItems, subtotal, boxGroups };
};

/**
 * Build the full order data object (shared between session/non-session).
 */
const buildOrderData = ({ userId, guestEmail, orderItems, subtotal, boxGroups, req }) => {
  const {
    shippingAddress, billingAddress, paymentMethod, deliveryType,
    scheduledDate, scheduledTime, isGift, giftMessage, giftRecipient,
    hidePrice, customerNote
  } = req.body;

  const totalBoxPrice = boxGroups.size * CONFIG.BUSINESS.BOX_BASE_PRICE_EGP;
  subtotal += totalBoxPrice;
  const shippingCost = CONFIG.BUSINESS.SHIPPING_COST_EGP;
  const total = subtotal + shippingCost;

  return {
    user: userId,
    guestEmail: req.user?.email || guestEmail || undefined,
    items: orderItems,
    shippingAddress, billingAddress, subtotal, shippingCost, total,
    paymentMethod, deliveryType, scheduledDate, scheduledTime,
    isGift, giftMessage, giftRecipient, hidePrice, customerNote,
    statusHistory: [{ status: CONFIG.ORDER_STATUS.PENDING, note: MESSAGES.ORDERS.RECEIVED }],
  };
};

/**
 * Deduct stock for each order item. Returns the list of updated items for rollback.
 */
const deductStock = async (orderItems, session) => {
  const opts = session ? { session } : {};
  for (const item of orderItems) {
    const stockUpdate = await Product.updateOne(
      { _id: item.product, stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity, salesCount: item.quantity } },
      opts
    );
    if (stockUpdate.modifiedCount !== 1) {
      throw createClientError(`${MESSAGES.ORDERS.INSUFFICIENT_STOCK_TEMPLATE}: ${item.name}`);
    }
  }
};

/**
 * Rollback stock for items that were already deducted (non-session fallback).
 */
const rollbackStock = async (items) => {
  for (const item of items) {
    await Product.updateOne(
      { _id: item.product },
      { $inc: { stock: item.quantity, salesCount: -item.quantity } }
    );
  }
};

// =====================================================
// ROUTE HANDLERS
// =====================================================

exports.createOrder = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendBadRequest(res, MESSAGES.GENERAL.VALIDATION_ERROR, errors.array());
  }

  const userId = req.user._id;
  const { items, guestEmail } = req.body;

  if (!items || items.length === 0) {
    return sendBadRequest(res, MESSAGES.ORDERS.NO_ITEMS);
  }
  if (guestEmail && req.user?.email && guestEmail.toLowerCase() !== req.user.email.toLowerCase()) {
    return sendBadRequest(res, MESSAGES.ORDERS.EMAIL_MISMATCH);
  }

  // --- Attempt with transaction ---
  const createWithSession = async (session) => {
    session.startTransaction();
    const uniqueProductIds = [...new Set(items.map((i) => String(i.productId)))];
    const products = await Product.find({ _id: { $in: uniqueProductIds } }).session(session);
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    const { orderItems, subtotal, boxGroups } = buildOrderItems(items, productMap);
    const orderData = buildOrderData({ userId, guestEmail, orderItems, subtotal, boxGroups, req });

    const [createdOrder] = await Order.create([orderData], { session });
    await deductStock(orderItems, session);
    await session.commitTransaction();
    return createdOrder;
  };

  // --- Fallback without transaction ---
  const createWithoutSession = async () => {
    const uniqueProductIds = [...new Set(items.map((i) => String(i.productId)))];
    const products = await Product.find({ _id: { $in: uniqueProductIds } });
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    const { orderItems, subtotal, boxGroups } = buildOrderItems(items, productMap);
    const orderData = buildOrderData({ userId, guestEmail, orderItems, subtotal, boxGroups, req });

    // Deduct stock with manual rollback on failure
    const stockUpdates = [];
    for (const item of orderItems) {
      const stockUpdate = await Product.updateOne(
        { _id: item.product, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity, salesCount: item.quantity } }
      );
      if (stockUpdate.modifiedCount !== 1) {
        await rollbackStock(stockUpdates);
        throw createClientError(`${MESSAGES.ORDERS.INSUFFICIENT_STOCK_TEMPLATE}: ${item.name}`);
      }
      stockUpdates.push(item);
    }

    try {
      return await Order.create(orderData);
    } catch (error) {
      await rollbackStock(stockUpdates);
      throw error;
    }
  };

  let order;
  const session = await mongoose.startSession();

  try {
    order = await createWithSession(session);
  } catch (error) {
    if (session.inTransaction()) await session.abortTransaction();

    if (error?.isClientError) {
      return sendError(res, { message: error.message, statusCode: error.statusCode, errors: error.errors });
    }

    if (isTransactionNotSupportedError(error)) {
      try {
        order = await createWithoutSession();
      } catch (fallbackError) {
        if (fallbackError?.isClientError) {
          return sendError(res, { message: fallbackError.message, statusCode: fallbackError.statusCode, errors: fallbackError.errors });
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

  // Send confirmation email (non-blocking)
  try {
    const emailTo = req.user?.email || guestEmail;
    if (emailTo) await sendOrderConfirmationEmail(emailTo, order);
  } catch (mailErr) {
    console.error('Order email error:', mailErr);
  }

  return sendCreated(res, { data: order, message: MESSAGES.ORDERS.CREATED });
}, MESSAGES.ORDERS.CREATE_ERROR);

exports.getOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = CONFIG.PAGINATION.ORDERS_LIMIT, status } = req.query;
  const query = { user: req.user._id };
  if (status && CONFIG.ORDER_STATUSES.includes(String(status))) {
    query.status = String(status);
  }

  const finalLimit = Math.min(Number(limit) || CONFIG.PAGINATION.ORDERS_LIMIT, 100);
  const orders = await Order.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * finalLimit)
    .limit(finalLimit);
  const total = await Order.countDocuments(query);

  return sendPaginated(res, { data: orders, page, limit: finalLimit, total });
}, MESSAGES.ORDERS.GENERIC_ERROR);

exports.getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('items.product', 'name slug images');
  if (!order) return sendNotFound(res, MESSAGES.ORDERS.NOT_FOUND);
  if (order.user && order.user.toString() !== req.user._id.toString()) {
    return sendForbidden(res, MESSAGES.ORDERS.UNAUTHORIZED);
  }
  return sendSuccess(res, { data: order });
}, MESSAGES.ORDERS.GENERIC_ERROR);

exports.trackOrder = asyncHandler(async (req, res) => {
  const orderNumber = String(req.params.orderNumber || '').trim().toUpperCase();
  if (!/^[A-Z0-9-]{6,32}$/.test(orderNumber)) {
    return sendNotFound(res, MESSAGES.ORDERS.NOT_FOUND);
  }

  const order = await Order.findOne({ orderNumber }).select(
    'orderNumber status statusHistory items.name items.quantity items.image estimatedDelivery deliveredAt createdAt'
  );

  if (!order) return sendNotFound(res, MESSAGES.ORDERS.NOT_FOUND);
  return sendSuccess(res, { data: order });
}, MESSAGES.ORDERS.GENERIC_ERROR);

exports.cancelOrder = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const order = await Order.findById(req.params.id).session(session);

    if (!order) throw createClientError(MESSAGES.ORDERS.NOT_FOUND, 404);
    if (order.user.toString() !== req.user._id.toString()) throw createClientError(MESSAGES.ORDERS.UNAUTHORIZED, 403);
    if (!CONFIG.CANCELLABLE_STATUSES.includes(order.status)) throw createClientError(MESSAGES.ORDERS.CANNOT_CANCEL, 400);

    order.status = CONFIG.ORDER_STATUS.CANCELLED;
    order.cancellationReason = req.body.reason;
    order.cancelledAt = new Date();
    order.statusHistory.push({ status: CONFIG.ORDER_STATUS.CANCELLED, note: req.body.reason || MESSAGES.ORDERS.CANCELLED_BY_CUSTOMER });

    await order.save({ session });

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
    if (session.inTransaction()) await session.abortTransaction();

    if (isTransactionNotSupportedError(error)) {
      try {
        const order = await Order.findById(req.params.id);
        if (!order) return sendNotFound(res, MESSAGES.ORDERS.NOT_FOUND);
        if (order.user.toString() !== req.user._id.toString()) return sendForbidden(res, MESSAGES.ORDERS.UNAUTHORIZED);
        if (!CONFIG.CANCELLABLE_STATUSES.includes(order.status)) return sendBadRequest(res, MESSAGES.ORDERS.CANNOT_CANCEL);

        order.status = CONFIG.ORDER_STATUS.CANCELLED;
        order.cancellationReason = req.body.reason;
        order.cancelledAt = new Date();
        order.statusHistory.push({ status: CONFIG.ORDER_STATUS.CANCELLED, note: req.body.reason || MESSAGES.ORDERS.CANCELLED_BY_CUSTOMER });
        await order.save();

        // Restore stock for cancelled order items using rollbackStock
        await rollbackStock(order.items);
        return sendSuccess(res, { data: order, message: MESSAGES.ORDERS.CANCELLED });
      } catch (fallbackError) {
        if (fallbackError?.isClientError) {
          return sendError(res, { message: fallbackError.message, statusCode: fallbackError.statusCode, errors: fallbackError.errors });
        }
        return sendError(res, { message: MESSAGES.ORDERS.GENERIC_ERROR });
      }
    }

    if (error?.isClientError) {
      return sendError(res, { message: error.message, statusCode: error.statusCode, errors: error.errors });
    }

    return sendError(res, { message: MESSAGES.ORDERS.GENERIC_ERROR });
  } finally {
    session.endSession();
  }
};
