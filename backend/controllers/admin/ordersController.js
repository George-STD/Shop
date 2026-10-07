const Order = require('../../models/Order');
const User = require('../../models/User');
const Product = require('../../models/Product');
const { logAudit } = require('../../utils/auditLogger');
const { sendTrackingEmail, sendDeliveredReviewEmail } = require('../../utils/mailer');
const asyncHandler = require('../../utils/asyncHandler');
const { escapeRegex, parsePagination, buildPaginationMeta } = require('../../utils/helpers');
const { addEgp, subEgp, mulEgp, roundTo2Decimals } = require('../../utils/money');

// =====================================================
// ORDERS MANAGEMENT (Admin)
// =====================================================
exports.getOrders = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const queryObj = {};

  if (req.query.status) queryObj.status = req.query.status;
  if (req.query.startDate || req.query.endDate) {
    queryObj.createdAt = {};
    if (req.query.startDate) queryObj.createdAt.$gte = new Date(req.query.startDate);
    if (req.query.endDate) queryObj.createdAt.$lte = new Date(req.query.endDate);
  }
  if (req.query.search) {
    queryObj.$or = [{ orderNumber: { $regex: escapeRegex(req.query.search), $options: 'i' } }];
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
    pagination: buildPaginationMeta({ page, limit, total })
  });
}, 'حدث خطأ أثناء جلب الطلبات');

exports.getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'firstName lastName email phone')
    .populate('items.product', 'name price images lastKnownCost lastKnownVendor');
  if (!order) return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
  res.json({ success: true, data: order });
}, 'حدث خطأ أثناء جلب الطلب');

exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, trackingNumber } = req.body;
  const mongoose = require('mongoose');
  const session = await mongoose.startSession();

  const processStatusChange = async (opts = {}) => {
    const order = await Order.findById(req.params.id, null, opts);
    if (!order) return { notFound: true };

    const previousStatus = order.status;
    order.status = status;
    order.statusHistory.push({ status, date: new Date(), note: 'تم تحديث الحالة بواسطة المسؤول' });
    if (trackingNumber) order.trackingNumber = trackingNumber;

    const Settings = require('../../models/Settings');
    const settings = await Settings.getSettings();

    if (status === 'delivered' && previousStatus !== 'delivered' && order.user) {
      if (settings?.loyalty?.enabled) {
        const earned = Math.floor(order.total * (settings.loyalty.pointsPerEgpSpent || 1));
        if (earned > 0) {
          // Atomic claim to prevent double-awarding loyalty points on concurrent status updates
          const claim = await Order.updateOne(
            { _id: order._id, pointsEarned: { $in: [0, null] } },
            { $set: { pointsEarned: earned } },
            opts
          );
          if (claim.modifiedCount === 1) {
            order.pointsEarned = earned;
            await User.updateOne(
              { _id: order.user },
              {
                $inc: { loyaltyPoints: earned },
                $push: {
                  pointsHistory: {
                    $each: [
                      {
                        points: earned,
                        reason: `مكافأة إتمام الطلب #${order.orderNumber || order._id}`,
                        type: 'EARNED',
                        createdAt: new Date(),
                      },
                    ],
                    $slice: -50,
                  },
                },
              },
              opts
            );
          }
        }
      }
    } else if ((status === 'cancelled' || status === 'returned') && previousStatus !== 'cancelled' && previousStatus !== 'returned') {
      const { handleOrderLoyaltyRefundOrDeduction, rollbackStock } = require('../orderController');
      await handleOrderLoyaltyRefundOrDeduction(order, opts.session);
      await rollbackStock(order.items, opts.session);
    } else if ((previousStatus === 'cancelled' || previousStatus === 'returned') && status !== 'cancelled' && status !== 'returned') {
      // Un-cancelling/un-returning: decrement stock with floor at 0 using atomic aggregation
      for (const item of order.items) {
        if (!item.product) continue;
        if (item.isReadyBox && item.includedProducts && item.includedProducts.length > 0) {
          for (const boxItem of item.includedProducts) {
            const subQty = (boxItem.quantity || 1) * item.quantity;
            await Product.updateOne(
              { _id: boxItem.product?._id || boxItem.product },
              [{ $set: {
                  stock: { $max: [0, { $subtract: ['$stock', subQty] }] },
                  salesCount: { $add: ['$salesCount', subQty] }
              }}],
              opts
            );
          }
          await Product.updateOne({ _id: item.product }, { $inc: { salesCount: item.quantity } }, opts);
        } else {
          await Product.updateOne(
            { _id: item.product },
            [{ $set: {
                stock: { $max: [0, { $subtract: ['$stock', item.quantity] }] },
                salesCount: { $add: ['$salesCount', item.quantity] }
            }}],
            opts
          );
        }
      }
    }

    await order.save(opts);
    return { order, previousStatus };
  };

  try {
    session.startTransaction();
    const result = await processStatusChange({ session });
    if (result.notFound) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
    }
    await session.commitTransaction();

    const { order, previousStatus } = result;
    if (status === 'shipped' && (trackingNumber || order.trackingNumber)) {
      try {
        let emailTo = order.guestEmail || order.shippingAddress?.email;
        if (!emailTo && order.user) {
          const user = await User.findById(order.user);
          emailTo = user?.email;
        }
        if (emailTo) await sendTrackingEmail(emailTo, order, trackingNumber || order.trackingNumber);
      } catch (mailErr) {
        console.error('Tracking email error:', mailErr);
      }
    } else if (status === 'delivered' && previousStatus !== 'delivered') {
      try {
        let emailTo = order.guestEmail || order.shippingAddress?.email;
        if (!emailTo && order.user) {
          const user = await User.findById(order.user);
          emailTo = user?.email;
        }
        if (emailTo) await sendDeliveredReviewEmail(emailTo, order);
      } catch (mailErr) {
        console.error('Delivered review email error:', mailErr);
      }
    }

    return res.json({ success: true, message: 'تم تحديث حالة الطلب', data: order });
  } catch (error) {
    if (session.inTransaction()) await session.abortTransaction();

    // Only fallback to non-transactional mode if transactions aren't supported (standalone MongoDB)
    const isTransactionError = error.codeName === 'IllegalOperation' ||
      error.message?.includes('transaction') ||
      error.message?.includes('replica set') ||
      error.code === 263; // OperationNotSupportedInTransaction

    if (!isTransactionError) throw error;

    const result = await processStatusChange();
    if (result.notFound) return res.status(404).json({ success: false, message: 'الطلب غير موجود' });

    const { order, previousStatus } = result;
    if (status === 'shipped' && (trackingNumber || order.trackingNumber)) {
      try {
        let emailTo = order.guestEmail || order.shippingAddress?.email;
        if (!emailTo && order.user) {
          const user = await User.findById(order.user);
          emailTo = user?.email;
        }
        if (emailTo) await sendTrackingEmail(emailTo, order, trackingNumber || order.trackingNumber);
      } catch (mailErr) {
        console.error('Tracking email error:', mailErr);
      }
    } else if (status === 'delivered' && previousStatus !== 'delivered') {
      try {
        let emailTo = order.guestEmail || order.shippingAddress?.email;
        if (!emailTo && order.user) {
          const user = await User.findById(order.user);
          emailTo = user?.email;
        }
        if (emailTo) await sendDeliveredReviewEmail(emailTo, order);
      } catch (mailErr) {
        console.error('Delivered review email error:', mailErr);
      }
    }

    return res.json({ success: true, message: 'تم تحديث حالة الطلب', data: order });
  } finally {
    session.endSession();
  }
}, 'حدث خطأ أثناء تحديث حالة الطلب');

// =====================================================
// ORDER PROCUREMENT & COST ACCOUNTING
// =====================================================
exports.updateOrderProcurement = asyncHandler(async (req, res) => {
  const { items, overheads, isSettled } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
  }

  // 1. Update line item procurements
  let totalItemsCost = 0;
  const productMemoryUpdates = [];

  if (Array.isArray(items)) {
    for (const itemInput of items) {
      const targetItem = order.items.id(itemInput.itemId || itemInput._id);
      if (!targetItem) continue;

      if (!targetItem.procurement) {
        targetItem.procurement = {};
      }

      if (itemInput.status !== undefined) {
        if (itemInput.status === 'purchased' && targetItem.procurement.status !== 'purchased') {
          targetItem.procurement.purchasedAt = new Date();
        }
        targetItem.procurement.status = itemInput.status;
      }

      const costPrice = Math.max(0, Number(itemInput.costPrice) || 0);
      targetItem.procurement.costPrice = roundTo2Decimals(costPrice);

      if (itemInput.paidBy !== undefined) {
        targetItem.procurement.paidBy = String(itemInput.paidBy).trim() || 'store_fund';
      }
      if (itemInput.vendor !== undefined) {
        targetItem.procurement.vendor = String(itemInput.vendor).trim();
      }
      if (itemInput.notes !== undefined) {
        targetItem.procurement.notes = String(itemInput.notes).trim();
      }

      // Calculate line total cost = quantity * unit cost
      const lineCost = mulEgp(targetItem.procurement.costPrice, targetItem.quantity || 1);
      totalItemsCost = addEgp(totalItemsCost, lineCost);

      // Sourcing memory update if cost or vendor specified
      if (targetItem.product && (costPrice > 0 || targetItem.procurement.vendor)) {
        productMemoryUpdates.push({
          productId: targetItem.product,
          costPrice,
          vendor: targetItem.procurement.vendor,
        });
      }
    }
  } else {
    // If items array was not provided, re-sum existing items cost
    for (const item of order.items) {
      const unitCost = item.procurement?.costPrice || 0;
      totalItemsCost = addEgp(totalItemsCost, mulEgp(unitCost, item.quantity || 1));
    }
  }

  // 2. Overheads
  if (!order.procurement) {
    order.procurement = {};
  }

  if (overheads) {
    if (overheads.actualShippingCost !== undefined) {
      order.procurement.actualShippingCost = Math.max(0, Number(overheads.actualShippingCost) || 0);
    }
    if (overheads.shippingPaidBy !== undefined) {
      order.procurement.shippingPaidBy = String(overheads.shippingPaidBy).trim() || 'store_fund';
    }
    if (overheads.packagingCost !== undefined) {
      order.procurement.packagingCost = Math.max(0, Number(overheads.packagingCost) || 0);
    }
    if (overheads.packagingPaidBy !== undefined) {
      order.procurement.packagingPaidBy = String(overheads.packagingPaidBy).trim() || 'store_fund';
    }
    if (overheads.incidentalExpenses !== undefined) {
      order.procurement.incidentalExpenses = Math.max(0, Number(overheads.incidentalExpenses) || 0);
    }
    if (overheads.incidentalsPaidBy !== undefined) {
      order.procurement.incidentalsPaidBy = String(overheads.incidentalsPaidBy).trim() || 'store_fund';
    }
    if (overheads.notes !== undefined) {
      order.procurement.notes = String(overheads.notes).trim();
    }
  }

  const shippingCost = order.procurement.actualShippingCost || 0;
  const packagingCost = order.procurement.packagingCost || 0;
  const incidentalsCost = order.procurement.incidentalExpenses || 0;

  const totalOverheadsCost = addEgp(shippingCost, packagingCost, incidentalsCost);
  const totalOrderCost = addEgp(totalItemsCost, totalOverheadsCost);
  const revenue = Number(order.total) || 0;
  const netProfit = subEgp(revenue, totalOrderCost);
  const profitMarginPercent = revenue > 0 ? Number(((netProfit / revenue) * 100).toFixed(1)) : 0;

  order.procurement.totalItemsCost = totalItemsCost;
  order.procurement.totalOverheadsCost = totalOverheadsCost;
  order.procurement.totalOrderCost = totalOrderCost;
  order.procurement.netProfit = netProfit;
  order.procurement.profitMarginPercent = profitMarginPercent;

  // 3. Partner Reimbursement Breakdown
  const partnerMap = new Map();

  // Accumulate from items
  for (const item of order.items) {
    const paidBy = item.procurement?.paidBy || 'store_fund';
    if (paidBy !== 'store_fund' && paidBy !== 'store_cash') {
      const itemCost = mulEgp(item.procurement?.costPrice || 0, item.quantity || 1);
      if (itemCost > 0) {
        partnerMap.set(paidBy, addEgp(partnerMap.get(paidBy) || 0, itemCost));
      }
    }
  }

  // Accumulate from overheads
  const checkOverhead = (cost, paidBy) => {
    if (cost > 0 && paidBy && paidBy !== 'store_fund' && paidBy !== 'store_cash') {
      partnerMap.set(paidBy, addEgp(partnerMap.get(paidBy) || 0, cost));
    }
  };
  checkOverhead(shippingCost, order.procurement.shippingPaidBy);
  checkOverhead(packagingCost, order.procurement.packagingPaidBy);
  checkOverhead(incidentalsCost, order.procurement.incidentalsPaidBy);

  // Settlement status
  if (isSettled !== undefined) {
    order.procurement.isSettled = Boolean(isSettled);
    if (order.procurement.isSettled) {
      order.procurement.settledAt = new Date();
      order.procurement.settledBy = req.user?._id;
    } else {
      order.procurement.settledAt = null;
      order.procurement.settledBy = null;
    }
  }

  const partnerBreakdown = [];
  partnerMap.forEach((amount, partner) => {
    partnerBreakdown.push({
      partner,
      amount,
      isSettled: Boolean(order.procurement.isSettled),
    });
  });
  order.procurement.partnerBreakdown = partnerBreakdown;

  // 4. Save order
  await order.save();

  // 5. Update Product sourcing memory asynchronously
  for (const mem of productMemoryUpdates) {
    const updateObj = {};
    if (mem.costPrice > 0) updateObj.lastKnownCost = mem.costPrice;
    if (mem.vendor) updateObj.lastKnownVendor = mem.vendor;
    if (Object.keys(updateObj).length > 0) {
      await Product.updateOne({ _id: mem.productId }, { $set: updateObj });
    }
  }

  // Return re-populated updated order
  const updatedOrder = await Order.findById(order._id)
    .populate('user', 'firstName lastName email phone')
    .populate('items.product', 'name price images lastKnownCost lastKnownVendor');

  res.json({
    success: true,
    message: 'تم تحديث حسابات وتكاليف الطلب بنجاح',
    data: updatedOrder,
  });
}, 'حدث خطأ أثناء تحديث بيانات التكلفة والمشتريات');
