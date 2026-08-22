const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { sendOrderConfirmationEmail } = require('../utils/mailer');
const { CONFIG, MESSAGES } = require('../constants');
const { sendSuccess, sendError, sendCreated, sendNotFound, sendForbidden, sendBadRequest, sendPaginated } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');
const { processReadyBoxes } = require('./productController');

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
    
    if (product.isReadyBox) {
      if (!product.includedProducts || product.includedProducts.length === 0) {
        throw createClientError(`صندوق ${product.name} لا يحتوي على أي منتجات مجمعة`);
      }
      product.includedProducts.forEach(boxItem => {
        const itemObj = boxItem.product;
        if (!itemObj) throw createClientError(`أحد محتويات الصندوق غير متوفرة`);
        const requiredSubQuantity = boxItem.quantity * quantity;
        if (itemObj.stock < requiredSubQuantity) {
          throw createClientError(`${MESSAGES.ORDERS.INSUFFICIENT_STOCK_TEMPLATE}: ${itemObj.name} (داخل البوكس)`);
        }
      });
    } else {
      if (product.stock < quantity) throw createClientError(`${MESSAGES.ORDERS.INSUFFICIENT_STOCK_TEMPLATE}: ${product.name}`);
    }

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
      if (!product.canBeAddedToBox) {
        throw createClientError(`المنتج "${product.name}" غير متاح للإضافة إلى بوكس هدايا`);
      }
      boxGroups.add(item.boxId);
      boxCounts.set(item.boxId, (boxCounts.get(item.boxId) || 0) + quantity);
      const discountPercent = product.boxDiscount !== undefined ? product.boxDiscount : 25;
      finalPrice = finalPrice * (1 - discountPercent / 100);
    }

    const itemSubtotal = (finalPrice + addonsTotal) * quantity;

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
      isReadyBox: product.isReadyBox,
      includedProducts: product.includedProducts
    });

    subtotal += itemSubtotal;
  }

  if (subtotal < 0) {
    throw createClientError('حدث خطأ في حساب السعر. يرجى التواصل مع الدعم الفني.');
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
const buildOrderData = async ({ userId, guestEmail, orderItems, subtotal, boxGroups, req, session }) => {
  const {
    shippingAddress, billingAddress, paymentMethod, deliveryType,
    scheduledDate, scheduledTime, isGift, giftMessage, giftRecipient,
    hidePrice, customerNote, pointsToRedeem, idempotencyKey
  } = req.body;

  const scopedIdempotencyKey = idempotencyKey
    ? `${userId || guestEmail || 'guest'}:${String(idempotencyKey).trim()}`
    : undefined;

  const totalBoxPrice = boxGroups.size * CONFIG.BUSINESS.BOX_BASE_PRICE_EGP;
  subtotal += totalBoxPrice;
  const shippingCost = CONFIG.BUSINESS.SHIPPING_COST_EGP;
  let total = subtotal + shippingCost;

  let pointsRedeemed = 0;
  let pointsDiscount = 0;

  // Loyalty points redemption logic
  if (pointsToRedeem && Number(pointsToRedeem) > 0 && userId) {
    const Settings = require('../models/Settings');
    const User = require('../models/User');
    const settings = await Settings.getSettings();

    if (settings?.loyalty?.enabled) {
      const redeemAmount = Number(pointsToRedeem);
      if (redeemAmount < settings.loyalty.minPointsToRedeem) {
        throw createClientError(`الحد الأدنى لاستبدال النقاط هو ${settings.loyalty.minPointsToRedeem} نقطة`);
      }

      // ATOMIC check & update on User model to prevent race conditions (double spending)
      const opts = session ? { session } : {};
      const userUpdate = await User.updateOne(
        { _id: userId, loyaltyPoints: { $gte: redeemAmount } },
        {
          $inc: { loyaltyPoints: -redeemAmount },
          $push: {
            pointsHistory: {
              points: redeemAmount,
              reason: 'استبدال نقاط لخصم في طلب جديد',
              type: 'REDEEMED'
            }
          }
        },
        opts
      );

      if (userUpdate.modifiedCount !== 1) {
        throw createClientError('رصيد النقاط غير كافٍ أو تغير أثناء عملية الشراء');
      }

      pointsRedeemed = redeemAmount;
      pointsDiscount = redeemAmount * settings.loyalty.egpPerPointRedeemed;
      total = Math.max(0, total - pointsDiscount);
    }
  }

  return {
    user: userId,
    guestEmail: req.user?.email || guestEmail || undefined,
    idempotencyKey: scopedIdempotencyKey,
    items: orderItems,
    shippingAddress, billingAddress, subtotal, shippingCost, total,
    pointsRedeemed, pointsDiscount,
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
  const deductedItems = [];
  try {
    for (const item of orderItems) {
      if (item.isReadyBox && item.includedProducts) {
        for (const boxItem of item.includedProducts) {
          const requiredSubQty = boxItem.quantity * item.quantity;
          const stockUpdate = await Product.updateOne(
            { _id: (boxItem.product._id || boxItem.product), stock: { $gte: requiredSubQty } },
            { $inc: { stock: -requiredSubQty, salesCount: requiredSubQty } },
            opts
          );
          if (stockUpdate.modifiedCount !== 1) {
            throw createClientError(`${MESSAGES.ORDERS.INSUFFICIENT_STOCK_TEMPLATE}: (داخل البوكس)`);
          }
        }
        await Product.updateOne({ _id: item.product }, { $inc: { salesCount: item.quantity } }, opts);
        deductedItems.push(item);
      } else {
        const stockUpdate = await Product.updateOne(
          { _id: item.product, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity, salesCount: item.quantity } },
          opts
        );
        if (stockUpdate.modifiedCount !== 1) {
          throw createClientError(`${MESSAGES.ORDERS.INSUFFICIENT_STOCK_TEMPLATE}: ${item.name}`);
        }
        deductedItems.push(item);
      }
    }
    return deductedItems;
  } catch (err) {
    err.deductedItems = deductedItems;
    throw err;
  }
};

/**
 * Rollback stock for items that were already deducted.
 */
const rollbackStock = async (items, session) => {
  const opts = session ? { session } : {};
  for (const item of items) {
    let includedProducts = item.includedProducts;
    let isReadyBox = item.isReadyBox;

    if (isReadyBox && (!includedProducts || includedProducts.length === 0)) {
      const dbProduct = await Product.findById(item.product).select('isReadyBox includedProducts');
      if (dbProduct && dbProduct.isReadyBox) {
        includedProducts = dbProduct.includedProducts;
      }
    }

    if (isReadyBox && includedProducts && includedProducts.length > 0) {
      for (const boxItem of includedProducts) {
        const targetProdId = boxItem.product?._id || boxItem.product || boxItem.productId;
        if (!targetProdId) continue;
        const requiredSubQty = (boxItem.quantity || 1) * item.quantity;
        await Product.updateOne(
          { _id: targetProdId },
          { $inc: { stock: requiredSubQty, salesCount: -requiredSubQty } },
          opts
        );
      }
      await Product.updateOne({ _id: item.product }, { $inc: { salesCount: -item.quantity } }, opts);
    } else {
      await Product.updateOne(
        { _id: item.product },
        { $inc: { stock: item.quantity, salesCount: -item.quantity } },
        opts
      );
    }
  }
};


/**
 * Handle loyalty points refund/deduction on order cancellation or status change.
 */
const handleOrderLoyaltyRefundOrDeduction = async (order, session) => {
  if (!order || !order.user) return;
  const User = require('../models/User');
  const opts = session ? { session } : {};

  // 1. Restore redeemed points if any
  if (order.pointsRedeemed > 0) {
    const redeemedToRefund = order.pointsRedeemed;
    order.pointsRedeemed = 0;
    order.pointsDiscount = 0;
    await User.updateOne(
      { _id: order.user },
      {
        $inc: { loyaltyPoints: redeemedToRefund },
        $push: {
          pointsHistory: {
            points: redeemedToRefund,
            reason: `استرجاع نقاط الطلب الملغى #${order.orderNumber || order._id}`,
            type: 'REFUNDED'
          }
        }
      },
      opts
    );
  }

  // 2. Deduct earned points if order was previously marked delivered
  if (order.pointsEarned > 0) {
    const earnedToDeduct = order.pointsEarned;
    order.pointsEarned = 0;
    await User.updateOne(
      { _id: order.user },
      {
        $inc: { loyaltyPoints: -earnedToDeduct },
        $push: {
          pointsHistory: {
            points: earnedToDeduct,
            reason: `إلغاء نقاط الطلب الملغى #${order.orderNumber || order._id}`,
            type: 'DEDUCTED'
          }
        }
      },
      opts
    );
    // Ensure points don't go below 0
    await User.updateOne({ _id: order.user, loyaltyPoints: { $lt: 0 } }, { $set: { loyaltyPoints: 0 } }, opts);
  }
};

// Export helpers for use in admin controllers
exports.handleOrderLoyaltyRefundOrDeduction = handleOrderLoyaltyRefundOrDeduction;
exports.rollbackStock = rollbackStock;
exports.deductStock = deductStock;

// =====================================================
// ROUTE HANDLERS
// =====================================================

exports.createOrder = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendBadRequest(res, MESSAGES.GENERAL.VALIDATION_ERROR, errors.array());
  }

  const userId = req.user._id;
  const { items, guestEmail, idempotencyKey } = req.body;

  if (!items || items.length === 0) {
    return sendBadRequest(res, MESSAGES.ORDERS.NO_ITEMS);
  }
  if (guestEmail && req.user?.email && guestEmail.toLowerCase() !== req.user.email.toLowerCase()) {
    return sendBadRequest(res, MESSAGES.ORDERS.EMAIL_MISMATCH);
  }

  // Check idempotency upfront to avoid re-running order creation / deducting stock twice
  const scopedIdempotencyKey = idempotencyKey
    ? `${userId || guestEmail || 'guest'}:${String(idempotencyKey).trim()}`
    : null;

  if (scopedIdempotencyKey) {
    const existingOrder = await Order.findOne({ idempotencyKey: scopedIdempotencyKey });
    if (existingOrder) {
      return sendSuccess(res, { data: existingOrder, message: MESSAGES.ORDERS.CREATED });
    }
  }

  // --- Attempt with transaction ---
  const createWithSession = async (session) => {
    session.startTransaction();
    const uniqueProductIds = [...new Set(items.map((i) => String(i.productId)))];
    let products = await Product.find({ _id: { $in: uniqueProductIds } })
      .populate('includedProducts.product')
      .session(session);
    
    products = await processReadyBoxes(products);
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    const { orderItems, subtotal, boxGroups } = buildOrderItems(items, productMap);
    const orderData = await buildOrderData({ userId, guestEmail, orderItems, subtotal, boxGroups, req, session });

    const [createdOrder] = await Order.create([orderData], { session });
    await deductStock(orderItems, session);
    await session.commitTransaction();
    return createdOrder;
  };

/**
 * Rollback loyalty points redeemed during order construction if non-transactional order fails.
 */
const rollbackLoyaltyPoints = async (userId, pointsRedeemed) => {
  if (!userId || !pointsRedeemed || pointsRedeemed <= 0) return;
  const User = require('../models/User');
  try {
    await User.updateOne(
      { _id: userId },
      {
        $inc: { loyaltyPoints: pointsRedeemed },
        $push: {
          pointsHistory: {
            points: pointsRedeemed,
            reason: 'استرجاع نقاط بسبب فشل إنشاء الطلب',
            type: 'REFUNDED'
          }
        }
      }
    );
  } catch (err) {
    console.error('Failed to refund loyalty points on order rollback:', err.message);
  }
};

// --- Fallback without transaction ---
  const createWithoutSession = async () => {
    const uniqueProductIds = [...new Set(items.map((i) => String(i.productId)))];
    let products = await Product.find({ _id: { $in: uniqueProductIds } })
      .populate('includedProducts.product');
      
    products = await processReadyBoxes(products);
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    const { orderItems, subtotal, boxGroups } = buildOrderItems(items, productMap);
    const orderData = await buildOrderData({ userId, guestEmail, orderItems, subtotal, boxGroups, req });

    // Deduct stock using unified function (handles ReadyBox logic)
    let deductedItems = [];
    try {
      deductedItems = await deductStock(orderItems);
    } catch (stockError) {
      // On failure, rollback ONLY whatever was already deducted & refund points
      await rollbackStock(stockError.deductedItems || []);
      await rollbackLoyaltyPoints(userId, orderData.pointsRedeemed);
      throw stockError;
    }

    try {
      return await Order.create(orderData);
    } catch (error) {
      await rollbackStock(deductedItems);
      await rollbackLoyaltyPoints(userId, orderData.pointsRedeemed);
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

    if (error?.code === 11000 && (error.keyPattern?.idempotencyKey || error.message?.includes('idempotencyKey'))) {
      if (scopedIdempotencyKey) {
        const existingOrder = await Order.findOne({ idempotencyKey: scopedIdempotencyKey });
        if (existingOrder) {
          return sendSuccess(res, { data: existingOrder, message: MESSAGES.ORDERS.CREATED });
        }
      }
    }

    if (isTransactionNotSupportedError(error)) {
      try {
        order = await createWithoutSession();
      } catch (fallbackError) {
        if (fallbackError?.isClientError) {
          return sendError(res, { message: fallbackError.message, statusCode: fallbackError.statusCode, errors: fallbackError.errors });
        }
        if (fallbackError?.code === 11000 && (fallbackError.keyPattern?.idempotencyKey || fallbackError.message?.includes('idempotencyKey'))) {
          if (scopedIdempotencyKey) {
            const existingOrder = await Order.findOne({ idempotencyKey: scopedIdempotencyKey });
            if (existingOrder) {
              return sendSuccess(res, { data: existingOrder, message: MESSAGES.ORDERS.CREATED });
            }
          }
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
  const pageNum = Math.max(1, Math.floor(Number(page) || 1));
  const finalLimit = Math.min(Math.max(1, Math.floor(Number(limit) || CONFIG.PAGINATION.ORDERS_LIMIT)), 100);

  const query = { user: req.user._id };
  if (status && CONFIG.ORDER_STATUSES.includes(String(status))) {
    query.status = String(status);
  }

  const orders = await Order.find(query)
    .sort({ createdAt: -1 })
    .skip((pageNum - 1) * finalLimit)
    .limit(finalLimit);
  const total = await Order.countDocuments(query);

  return sendPaginated(res, { data: orders, page: pageNum, limit: finalLimit, total });
}, MESSAGES.ORDERS.GENERIC_ERROR);

exports.getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('items.product', 'name slug images');
  if (!order) return sendNotFound(res, MESSAGES.ORDERS.NOT_FOUND);
  if (!order.user || order.user.toString() !== req.user._id.toString()) {
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

    await handleOrderLoyaltyRefundOrDeduction(order, session);
    await order.save({ session });

    await rollbackStock(order.items, session);

    await session.commitTransaction();
    return sendSuccess(res, { data: order, message: MESSAGES.ORDERS.CANCELLED });
  } catch (error) {
    if (session.inTransaction()) await session.abortTransaction();

    if (isTransactionNotSupportedError(error)) {
      try {
        const order = await Order.findOneAndUpdate(
          {
            _id: req.params.id,
            user: req.user._id,
            status: { $in: CONFIG.CANCELLABLE_STATUSES }
          },
          {
            $set: {
              status: CONFIG.ORDER_STATUS.CANCELLED,
              cancellationReason: req.body.reason,
              cancelledAt: new Date()
            },
            $push: {
              statusHistory: {
                status: CONFIG.ORDER_STATUS.CANCELLED,
                note: req.body.reason || MESSAGES.ORDERS.CANCELLED_BY_CUSTOMER
              }
            }
          },
          { new: true }
        );

        if (!order) {
          const existingOrder = await Order.findById(req.params.id);
          if (!existingOrder) return sendNotFound(res, MESSAGES.ORDERS.NOT_FOUND);
          if (existingOrder.user?.toString() !== req.user._id.toString()) return sendForbidden(res, MESSAGES.ORDERS.UNAUTHORIZED);
          return sendBadRequest(res, MESSAGES.ORDERS.CANNOT_CANCEL);
        }

        await handleOrderLoyaltyRefundOrDeduction(order);

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
