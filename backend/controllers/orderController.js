const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { sendOrderConfirmationEmail } = require('../utils/mailer');
const { CONFIG, MESSAGES } = require('../constants');
const { sendSuccess, sendError, sendCreated, sendNotFound, sendForbidden, sendBadRequest, sendPaginated } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');
const { processReadyBoxes } = require('./productController');
const { addEgp, subEgp, mulEgp, applyPercentDiscount } = require('../utils/money');
const { bustCatalog } = require('../middleware/cache');
const LoyaltyLedger = require('../models/LoyaltyLedger');
const OrderDailyStats = require('../models/OrderDailyStats');
const { isPaymobConfigured, createPaymobCheckoutSession } = require('../services/paymobService');

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

const isFiniteStock = (val) => typeof val === 'number' && Number.isFinite(val);

/**
 * Shared logic: validate items, resolve products, check product & SKU variant stock, build order items array.
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
  const cumulativeProductQty = new Map();
  const cumulativeVariantQty = new Map();

  const addRequiredProductQty = (prodObj, addQty, label) => {
    const pid = String(prodObj._id);
    const nextTotal = (cumulativeProductQty.get(pid) || 0) + addQty;
    if (prodObj.stock < nextTotal) {
      throw createClientError(`${MESSAGES.ORDERS.INSUFFICIENT_STOCK_TEMPLATE}: ${label || prodObj.name}`);
    }
    cumulativeProductQty.set(pid, nextTotal);
  };

  const addRequiredVariantQty = (variantKey, availableStock, addQty, label) => {
    if (!isFiniteStock(availableStock)) return;
    const nextTotal = (cumulativeVariantQty.get(variantKey) || 0) + addQty;
    if (availableStock < nextTotal) {
      throw createClientError(`${MESSAGES.ORDERS.INSUFFICIENT_STOCK_TEMPLATE}: ${label}`);
    }
    cumulativeVariantQty.set(variantKey, nextTotal);
  };

  for (const item of items) {
    const productId = String(item.productId);
    const quantity = parseQuantity(item.quantity);
    if (!quantity) throw createClientError(MESSAGES.ORDERS.INVALID_QUANTITY);

    const product = productMap.get(productId);
    if (!product || product.isActive === false) throw createClientError(`${MESSAGES.ORDERS.PRODUCT_NOT_FOUND_TEMPLATE}: ${product?.name || productId}`);
    
    if (product.isReadyBox) {
      if (!product.includedProducts || product.includedProducts.length === 0) {
        throw createClientError(`صندوق ${product.name} لا يحتوي على أي منتجات مجمعة`);
      }
      product.includedProducts.forEach(boxItem => {
        const itemObj = boxItem.product;
        if (!itemObj || itemObj.isActive === false) throw createClientError(`أحد محتويات الصندوق غير متوفرة`);
        const requiredSubQuantity = boxItem.quantity * quantity;
        addRequiredProductQty(itemObj, requiredSubQuantity, `${itemObj.name} (داخل البوكس)`);
      });
    } else {
      addRequiredProductQty(product, quantity, product.name);
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

    // Price calculation & Variant-Level SKU Stock Validation
    let finalPrice = product.price;
    
    // 1. Size check (price override + cumulative size stock)
    if (item.selectedSize && Array.isArray(product.sizes) && product.sizes.length > 0) {
      const selectedSizeObj = product.sizes.find(s => s.name === item.selectedSize);
      if (!selectedSizeObj) {
        throw createClientError(`المقاس المختار غير صحيح: ${item.selectedSize}`);
      }
      addRequiredVariantQty(
        `${product._id}:size:${item.selectedSize}`,
        selectedSizeObj.stock,
        quantity,
        `${product.name} (مقاس ${item.selectedSize})`
      );
      finalPrice = (selectedSizeObj.price !== undefined && selectedSizeObj.price !== null) ? Number(selectedSizeObj.price) : product.price;
    }

    // 2. Color stock check (strict existence + cumulative color stock)
    if (item.selectedColor && Array.isArray(product.colors) && product.colors.length > 0) {
      const selectedColorObj = product.colors.find(c => c.name === item.selectedColor);
      if (!selectedColorObj) {
        throw createClientError(`اللون المختار غير صحيح: ${item.selectedColor}`);
      }
      addRequiredVariantQty(
        `${product._id}:color:${item.selectedColor}`,
        selectedColorObj.stock,
        quantity,
        `${product.name} (لون ${item.selectedColor})`
      );
    }

    // 3. Shape stock check (strict existence + cumulative shape stock)
    if (item.selectedShape && Array.isArray(product.shapes) && product.shapes.length > 0) {
      const selectedShapeObj = product.shapes.find(sh => sh.name === item.selectedShape);
      if (!selectedShapeObj) {
        throw createClientError(`الشكل المختار غير صحيح: ${item.selectedShape}`);
      }
      addRequiredVariantQty(
        `${product._id}:shape:${item.selectedShape}`,
        selectedShapeObj.stock,
        quantity,
        `${product.name} (شكل ${item.selectedShape})`
      );
    }

    // 4. VariantGroups option stock & priceDelta check
    if (item.selectedVariants && typeof item.selectedVariants === 'object' && Array.isArray(product.variantGroups) && product.variantGroups.length > 0) {
      const entries = item.selectedVariants instanceof Map
        ? Array.from(item.selectedVariants.entries())
        : Object.entries(item.selectedVariants);

      for (const [groupName, optName] of entries) {
        if (!optName) continue;
        const group = product.variantGroups.find(g => g.name === groupName);
        if (!group || !Array.isArray(group.options)) {
          throw createClientError(`مجموعة الخيارات غير صحيحة: ${groupName}`);
        }
        const opt = group.options.find(o => o.name === optName);
        if (!opt) {
          throw createClientError(`الخيار المختار (${optName}) غير متاح في (${groupName})`);
        }
        addRequiredVariantQty(
          `${product._id}:vg:${groupName}:${optName}`,
          opt.stock,
          quantity,
          `${product.name} (${groupName}: ${optName})`
        );
        if (typeof opt.priceDelta === 'number' && opt.priceDelta !== 0) {
          finalPrice = addEgp(finalPrice, opt.priceDelta);
        }
      }
    }

    // Apply box logic
    if (item.boxId) {
      if (!product.canBeAddedToBox) {
        throw createClientError(`المنتج "${product.name}" غير متاح للإضافة إلى بوكس هدايا`);
      }
      boxGroups.add(item.boxId);
      boxCounts.set(item.boxId, (boxCounts.get(item.boxId) || 0) + quantity);
      const discountPercent = product.boxDiscount !== undefined ? product.boxDiscount : CONFIG.BUSINESS.BOX_DISCOUNT_PERCENTAGE;
      finalPrice = applyPercentDiscount(finalPrice, discountPercent);
    }

    const itemSubtotal = mulEgp(addEgp(finalPrice, addonsTotal), quantity);

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

    subtotal = addEgp(subtotal, itemSubtotal);
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

  const totalBoxPrice = mulEgp(boxGroups.size, CONFIG.BUSINESS.BOX_BASE_PRICE_EGP);
  subtotal = addEgp(subtotal, totalBoxPrice);
  const shippingCost = CONFIG.getShippingCostByGovernorate(shippingAddress?.governorate);
  let total = addEgp(subtotal, shippingCost);

  let pointsRedeemed = 0;
  let pointsDiscount = 0;

  // Loyalty points redemption logic
  if (pointsToRedeem !== undefined && pointsToRedeem !== null && pointsToRedeem !== '' && Number(pointsToRedeem) !== 0 && userId) {
    const requestedPoints = Number(pointsToRedeem);
    if (!Number.isInteger(requestedPoints) || requestedPoints < 0) {
      throw createClientError('عدد النقاط المستبدلة يجب أن يكون رقماً صحيحاً موجباً');
    }

    const Settings = require('../models/Settings');
    const User = require('../models/User');
    const settings = await Settings.getSettings();

    if (settings?.loyalty?.enabled) {
      if (requestedPoints < settings.loyalty.minPointsToRedeem) {
        throw createClientError(`الحد الأدنى لاستبدال النقاط هو ${settings.loyalty.minPointsToRedeem} نقطة`);
      }

      const egpPerPoint = Number(settings.loyalty.egpPerPointRedeemed) || 0.1;
      const maxPointsForOrder = egpPerPoint > 0 ? Math.ceil(total / egpPerPoint) : 0;
      const redeemAmount = Math.min(requestedPoints, maxPointsForOrder);

      if (redeemAmount > 0) {
        // ATOMIC check & update on User model to prevent race conditions (double spending)
        const opts = session ? { session } : {};
        const userUpdate = await User.updateOne(
          { _id: userId, loyaltyPoints: { $gte: redeemAmount } },
          {
            $inc: { loyaltyPoints: -redeemAmount },
            $push: {
              pointsHistory: {
                $each: [
                  {
                    points: redeemAmount,
                    reason: 'استبدال نقاط لخصم في طلب جديد',
                    type: 'REDEEMED',
                    createdAt: new Date(),
                  },
                ],
                $slice: -50,
              },
            },
          },
          opts
        );

        if (userUpdate.modifiedCount !== 1) {
          throw createClientError('رصيد النقاط غير كافٍ أو تغير أثناء عملية الشراء');
        }

        pointsRedeemed = redeemAmount;
        pointsDiscount = Math.min(total, mulEgp(redeemAmount, egpPerPoint));
        total = Math.max(0, subEgp(total, pointsDiscount));
      }
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
 * Atomically deduct variant-level SKU stock if the selected size/color/shape/variantGroup option defines a numeric stock.
 */
const deductVariantLevelStock = async (item, opts = {}) => {
  const qty = Number(item.quantity) || 1;
  const rollbackActions = [];

  try {
    if (item.selectedSize) {
      const sizeUpdate = await Product.updateOne(
        {
          _id: item.product,
          sizes: { $elemMatch: { name: item.selectedSize, stock: { $gte: qty } } },
        },
        { $inc: { 'sizes.$.stock': -qty } },
        opts
      );
      if (sizeUpdate.modifiedCount > 0) {
        rollbackActions.push(() =>
          Product.updateOne(
            { _id: item.product, 'sizes.name': item.selectedSize },
            { $inc: { 'sizes.$.stock': qty } },
            opts
          )
        );
      } else {
        const insufficientDoc = await Product.findOne(
          { _id: item.product, sizes: { $elemMatch: { name: item.selectedSize, stock: { $type: 'number', $lt: qty } } } },
          { _id: 1 },
          opts
        );
        if (insufficientDoc) {
          throw createClientError(`${MESSAGES.ORDERS.INSUFFICIENT_STOCK_TEMPLATE}: ${item.name} (مقاس ${item.selectedSize})`);
        }
      }
    }

    if (item.selectedColor) {
      const colorUpdate = await Product.updateOne(
        {
          _id: item.product,
          colors: { $elemMatch: { name: item.selectedColor, stock: { $gte: qty } } },
        },
        { $inc: { 'colors.$.stock': -qty } },
        opts
      );
      if (colorUpdate.modifiedCount > 0) {
        rollbackActions.push(() =>
          Product.updateOne(
            { _id: item.product, 'colors.name': item.selectedColor },
            { $inc: { 'colors.$.stock': qty } },
            opts
          )
        );
      } else {
        const insufficientDoc = await Product.findOne(
          { _id: item.product, colors: { $elemMatch: { name: item.selectedColor, stock: { $type: 'number', $lt: qty } } } },
          { _id: 1 },
          opts
        );
        if (insufficientDoc) {
          throw createClientError(`${MESSAGES.ORDERS.INSUFFICIENT_STOCK_TEMPLATE}: ${item.name} (لون ${item.selectedColor})`);
        }
      }
    }

    if (item.selectedShape) {
      const shapeUpdate = await Product.updateOne(
        {
          _id: item.product,
          shapes: { $elemMatch: { name: item.selectedShape, stock: { $gte: qty } } },
        },
        { $inc: { 'shapes.$.stock': -qty } },
        opts
      );
      if (shapeUpdate.modifiedCount > 0) {
        rollbackActions.push(() =>
          Product.updateOne(
            { _id: item.product, 'shapes.name': item.selectedShape },
            { $inc: { 'shapes.$.stock': qty } },
            opts
          )
        );
      } else {
        const insufficientDoc = await Product.findOne(
          { _id: item.product, shapes: { $elemMatch: { name: item.selectedShape, stock: { $type: 'number', $lt: qty } } } },
          { _id: 1 },
          opts
        );
        if (insufficientDoc) {
          throw createClientError(`${MESSAGES.ORDERS.INSUFFICIENT_STOCK_TEMPLATE}: ${item.name} (شكل ${item.selectedShape})`);
        }
      }
    }

    if (item.selectedVariants) {
      const entries = item.selectedVariants instanceof Map
        ? Array.from(item.selectedVariants.entries())
        : Object.entries(item.selectedVariants);
      for (const [groupName, optName] of entries) {
        const varUpdate = await Product.updateOne(
          { _id: item.product },
          { $inc: { 'variantGroups.$[g].options.$[o].stock': -qty } },
          {
            ...opts,
            arrayFilters: [
              { 'g.name': groupName },
              { 'o.name': optName, 'o.stock': { $ne: null, $gte: qty } },
            ],
          }
        );
        if (varUpdate.modifiedCount > 0) {
          rollbackActions.push(() =>
            Product.updateOne(
              { _id: item.product },
              { $inc: { 'variantGroups.$[g].options.$[o].stock': qty } },
              {
                ...opts,
                arrayFilters: [
                  { 'g.name': groupName },
                  { 'o.name': optName, 'o.stock': { $ne: null } },
                ],
              }
            )
          );
        } else {
          const insufficientDoc = await Product.findOne(
            {
              _id: item.product,
              variantGroups: {
                $elemMatch: {
                  name: groupName,
                  options: { $elemMatch: { name: optName, stock: { $type: 'number', $lt: qty } } },
                },
              },
            },
            { _id: 1 },
            opts
          );
          if (insufficientDoc) {
            throw createClientError(`${MESSAGES.ORDERS.INSUFFICIENT_STOCK_TEMPLATE}: ${item.name} (${groupName}: ${optName})`);
          }
        }
      }
    }
  } catch (err) {
    for (const undo of rollbackActions) {
      await undo();
    }
    throw err;
  }
};

/**
 * Restore variant-level SKU stock on order cancellation/return/rollback.
 */
const restoreVariantLevelStock = async (item, opts = {}) => {
  const qty = Number(item.quantity) || 1;

  if (item.selectedSize) {
    await Product.updateOne(
      {
        _id: item.product,
        sizes: { $elemMatch: { name: item.selectedSize, stock: { $ne: null } } },
      },
      { $inc: { 'sizes.$.stock': qty } },
      opts
    );
  }

  if (item.selectedColor) {
    await Product.updateOne(
      {
        _id: item.product,
        colors: { $elemMatch: { name: item.selectedColor, stock: { $ne: null } } },
      },
      { $inc: { 'colors.$.stock': qty } },
      opts
    );
  }

  if (item.selectedShape) {
    await Product.updateOne(
      {
        _id: item.product,
        shapes: { $elemMatch: { name: item.selectedShape, stock: { $ne: null } } },
      },
      { $inc: { 'shapes.$.stock': qty } },
      opts
    );
  }

  if (item.selectedVariants) {
    const entries = item.selectedVariants instanceof Map
      ? Array.from(item.selectedVariants.entries())
      : Object.entries(item.selectedVariants);
    for (const [groupName, optName] of entries) {
      await Product.updateOne(
        { _id: item.product },
        { $inc: { 'variantGroups.$[g].options.$[o].stock': qty } },
        {
          ...opts,
          arrayFilters: [
            { 'g.name': groupName },
            { 'o.name': optName, 'o.stock': { $ne: null } },
          ],
        }
      );
    }
  }
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
        const deductedSubItems = [];
        try {
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
            deductedSubItems.push(boxItem);
          }
        } catch (subErr) {
          if (deductedSubItems.length > 0) {
            deductedItems.push({
              ...item,
              includedProducts: deductedSubItems,
              _skipParentSalesRollback: true,
            });
          }
          throw subErr;
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
        try {
          await deductVariantLevelStock(item, opts);
        } catch (variantErr) {
          await Product.updateOne(
            { _id: item.product },
            { $inc: { stock: item.quantity, salesCount: -item.quantity } },
            opts
          );
          throw variantErr;
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
      if (!item._skipParentSalesRollback) {
        await Product.updateOne({ _id: item.product }, { $inc: { salesCount: -item.quantity } }, opts);
      }
    } else {
      await Product.updateOne(
        { _id: item.product },
        { $inc: { stock: item.quantity, salesCount: -item.quantity } },
        opts
      );
      await restoreVariantLevelStock(item, opts);
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
  const orderUpdates = {};

  // 1. Restore redeemed points if any (only once, tracked via pointsRefunded)
  if (order.pointsRedeemed > 0 && !order.pointsRefunded) {
    const redeemedToRefund = order.pointsRedeemed;
    order.pointsRefunded = true;
    orderUpdates.pointsRefunded = true;

    await User.updateOne(
      { _id: order.user },
      {
        $inc: { loyaltyPoints: redeemedToRefund },
        $push: {
          pointsHistory: {
            $each: [
              {
                points: redeemedToRefund,
                reason: `استرجاع نقاط الطلب الملغى #${order.orderNumber || order._id}`,
                type: 'REFUNDED',
                createdAt: new Date(),
              },
            ],
            $slice: -50,
          },
        },
      },
      opts
    );

    LoyaltyLedger.updateOne(
      { idempotencyKey: `order:${order._id}:refund` },
      {
        $setOnInsert: {
          user: order.user,
          points: Math.abs(redeemedToRefund),
          type: 'REFUNDED',
          reason: `استرجاع نقاط الطلب الملغى #${order.orderNumber || order._id}`,
          order: order._id,
          idempotencyKey: `order:${order._id}:refund`,
        },
      },
      { upsert: true }
    ).catch((err) => console.error('LoyaltyLedger refund log error:', err.message));
  }

  // 2. Deduct earned points if order was previously marked delivered
  if (order.pointsEarned > 0) {
    const earnedToDeduct = order.pointsEarned;
    order.pointsEarned = 0;
    orderUpdates.pointsEarned = 0;

    await User.updateOne(
      { _id: order.user },
      {
        $inc: { loyaltyPoints: -earnedToDeduct },
        $push: {
          pointsHistory: {
            $each: [
              {
                points: earnedToDeduct,
                reason: `إلغاء نقاط الطلب الملغى #${order.orderNumber || order._id}`,
                type: 'DEDUCTED',
                createdAt: new Date(),
              },
            ],
            $slice: -50,
          },
        },
      },
      opts
    );
    // Ensure points don't go below 0
    await User.updateOne({ _id: order.user, loyaltyPoints: { $lt: 0 } }, { $set: { loyaltyPoints: 0 } }, opts);

    LoyaltyLedger.updateOne(
      { idempotencyKey: `order:${order._id}:deduct` },
      {
        $setOnInsert: {
          user: order.user,
          points: -Math.abs(earnedToDeduct),
          type: 'DEDUCTED',
          reason: `إلغاء نقاط الطلب الملغى #${order.orderNumber || order._id}`,
          order: order._id,
          idempotencyKey: `order:${order._id}:deduct`,
        },
      },
      { upsert: true }
    ).catch((err) => console.error('LoyaltyLedger deduct log error:', err.message));
  }

  if (!session && Object.keys(orderUpdates).length > 0 && order._id) {
    await Order.updateOne({ _id: order._id }, { $set: orderUpdates });
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
  const { items, guestEmail, idempotencyKey, paymentMethod } = req.body;

  if (!items || items.length === 0) {
    return sendBadRequest(res, MESSAGES.ORDERS.NO_ITEMS);
  }
  if (guestEmail && req.user?.email && guestEmail.toLowerCase() !== req.user.email.toLowerCase()) {
    return sendBadRequest(res, MESSAGES.ORDERS.EMAIL_MISMATCH);
  }

  const isPaymobPayment = typeof paymentMethod === 'string' && paymentMethod.startsWith('paymob');
  if (isPaymobPayment && !isPaymobConfigured()) {
    return sendBadRequest(res, 'وسيلة الدفع الإلكتروني غير مفعلة حالياً، يرجى اختيار الدفع عند الاستلام أو إنستاباي');
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

    // Deduct stock first: if stock is insufficient, throws ClientError immediately before creating Order
    await deductStock(orderItems, session);
    const [createdOrder] = await Order.create([orderData], { session });
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
            $each: [
              {
                points: pointsRedeemed,
                reason: 'استرجاع نقاط بسبب فشل إنشاء الطلب',
                type: 'REFUNDED',
                createdAt: new Date(),
              },
            ],
            $slice: -50,
          },
        },
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
    const MAX_TXN_RETRIES = 10;
    let lastError;
    for (let attempt = 1; attempt <= MAX_TXN_RETRIES; attempt++) {
      try {
        order = await createWithSession(session);
        lastError = null;
        break;
      } catch (txnError) {
        if (session.inTransaction()) await session.abortTransaction();
        const isTransient =
          txnError.hasErrorLabel?.('TransientTransactionError') ||
          txnError.code === 112 ||
          txnError.errorResponse?.code === 112 ||
          txnError.errorLabels?.includes?.('TransientTransactionError');

        if (isTransient && attempt < MAX_TXN_RETRIES) {
          // Exponential backoff with random jitter to prevent thundering-herd write conflicts
          const baseDelay = Math.min(500, 30 * Math.pow(1.3, attempt));
          const jitter = Math.floor(Math.random() * 60);
          await new Promise((r) => setTimeout(r, baseDelay + jitter));
          continue;
        }
        lastError = txnError;
        break;
      }
    }
    if (lastError) throw lastError;
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

  // Generate Paymob Checkout Session if paymentMethod is Paymob
  if (order && isPaymobPayment) {
    try {
      const paymentSession = await createPaymobCheckoutSession(order, req.user);
      order.paymentDetails = {
        ...(order.paymentDetails || {}),
        gateway: 'paymob',
        intentionId: paymentSession.intentionId,
        paymobOrderId: paymentSession.paymobOrderId,
        paymentUrl: paymentSession.paymentUrl,
      };
      await order.save();
    } catch (paymobErr) {
      console.error('Paymob session creation error:', paymobErr.message);
      // Rollback reserved stock and loyalty points so inventory is never locked on gateway error
      try {
        await rollbackStock(order.items);
        await handleOrderLoyaltyRefundOrDeduction(order);
        await Order.findByIdAndDelete(order._id);
        bustCatalog('products');
        bustCatalog('admin-stats');
      } catch (cleanupErr) {
        console.error('Failed to rollback order after Paymob session failure:', cleanupErr.message);
      }
      return sendError(res, {
        statusCode: 502,
        message: 'تعذر الاتصال ببوابة الدفع الإلكتروني حالياً، لم يتم خصم أي مبلغ. يرجى المحاولة مرة أخرى أو اختيار الدفع عند الاستلام.',
      });
    }
  }

  bustCatalog('products');
  bustCatalog('admin-stats');

  // Record LoyaltyLedger entry if points were redeemed (non-blocking)
  if (order && order.pointsRedeemed > 0 && userId) {
    LoyaltyLedger.updateOne(
      { idempotencyKey: `order:${order._id}:redeem` },
      {
        $setOnInsert: {
          user: userId,
          points: -Math.abs(order.pointsRedeemed),
          type: 'REDEEMED',
          reason: `استبدال نقاط في الطلب #${order.orderNumber || order._id}`,
          order: order._id,
          idempotencyKey: `order:${order._id}:redeem`,
        },
      },
      { upsert: true }
    ).catch((err) => console.error('LoyaltyLedger redeem log error:', err.message));
  }

  // Update OrderDailyStats rollup (non-blocking)
  if (order) {
    const dateKey = new Date(order.createdAt || Date.now()).toISOString().slice(0, 10);
    const itemsSold = (order.items || []).reduce((acc, it) => acc + (Number(it.quantity) || 0), 0);
    const validPayMethods = ['cod', 'instapay', 'paymob', 'paymob_card', 'paymob_wallet'];
    const methodKey = validPayMethods.includes(order.paymentMethod) ? order.paymentMethod : 'cod';
    const payField = `paymentMethods.${methodKey}`;
    OrderDailyStats.updateOne(
      { date: dateKey },
      {
        $inc: {
          totalOrders: 1,
          totalRevenue: Number(order.total) || 0,
          'ordersByStatus.pending': 1,
          [payField]: 1,
          itemsSold,
        },
      },
      { upsert: true }
    ).catch((err) => console.error('OrderDailyStats update error:', err.message));
  }

  // Send confirmation email (truly non-blocking so SMTP latency never slows checkout)
  const emailTo = req.user?.email || guestEmail;
  if (emailTo) {
    Promise.resolve(sendOrderConfirmationEmail(emailTo, order)).catch((mailErr) => {
      console.error('Order email error:', mailErr?.message || mailErr);
    });
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

exports.cancelOrder = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const order = await Order.findById(req.params.id).session(session);

    if (!order) throw createClientError(MESSAGES.ORDERS.NOT_FOUND, 404);
    if (order.user.toString() !== req.user._id.toString()) throw createClientError(MESSAGES.ORDERS.UNAUTHORIZED, 403);
    if (!CONFIG.CANCELLABLE_STATUSES.includes(order.status)) throw createClientError(MESSAGES.ORDERS.CANNOT_CANCEL, 400);

    const previousStatus = order.status;
    order.status = CONFIG.ORDER_STATUS.CANCELLED;
    order.cancellationReason = req.body.reason;
    order.cancelledAt = new Date();
    order.statusHistory.push({ status: CONFIG.ORDER_STATUS.CANCELLED, note: req.body.reason || MESSAGES.ORDERS.CANCELLED_BY_CUSTOMER });

    await handleOrderLoyaltyRefundOrDeduction(order, session);
    await order.save({ session });

    await rollbackStock(order.items, session);

    await session.commitTransaction();
    const cancelDateKey = new Date(order.createdAt || Date.now()).toISOString().slice(0, 10);
    OrderDailyStats.updateOne(
      { date: cancelDateKey },
      {
        $inc: {
          totalRevenue: -(Number(order.total) || 0),
          [`ordersByStatus.${previousStatus}`]: -1,
          'ordersByStatus.cancelled': 1,
        },
      }
    ).catch(() => {});
    bustCatalog('products');
    bustCatalog('admin-stats');
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
                $each: [
                  {
                    status: CONFIG.ORDER_STATUS.CANCELLED,
                    note: req.body.reason || MESSAGES.ORDERS.CANCELLED_BY_CUSTOMER,
                    date: new Date(),
                  },
                ],
                $slice: -50,
              },
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
        const cancelDateKey = new Date(order.createdAt || Date.now()).toISOString().slice(0, 10);
        OrderDailyStats.updateOne(
          { date: cancelDateKey },
          {
            $inc: {
              totalRevenue: -(Number(order.total) || 0),
              'ordersByStatus.cancelled': 1,
            },
          }
        ).catch(() => {});
        bustCatalog('products');
        bustCatalog('admin-stats');
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
}, MESSAGES.ORDERS.GENERIC_ERROR);

