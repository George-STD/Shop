const Order = require('../../models/Order');
const User = require('../../models/User');
const { sendTrackingEmail, sendDeliveredReviewEmail } = require('../../utils/mailer');
const asyncHandler = require('../../utils/asyncHandler');
const { escapeRegex, parsePagination, buildPaginationMeta } = require('../../utils/helpers');

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
    .populate('items.product', 'name price images');
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
      if (settings?.loyalty?.enabled && (order.pointsEarned || 0) === 0) {
        const earned = Math.floor(order.total * (settings.loyalty.pointsPerEgpSpent || 1));
        if (earned > 0) {
          order.pointsEarned = earned;
          await User.updateOne(
            { _id: order.user },
            {
              $inc: { loyaltyPoints: earned },
              $push: {
                pointsHistory: {
                  points: earned,
                  reason: `مكافأة إتمام الطلب #${order.orderNumber || order._id}`,
                  type: 'EARNED'
                }
              }
            },
            opts
          );
        }
      }
    } else if ((status === 'cancelled' || status === 'returned') && previousStatus !== 'cancelled' && previousStatus !== 'returned') {
      const { handleOrderLoyaltyRefundOrDeduction, rollbackStock } = require('../orderController');
      await handleOrderLoyaltyRefundOrDeduction(order, opts.session);
      await rollbackStock(order.items, opts.session);
    } else if ((previousStatus === 'cancelled' || previousStatus === 'returned') && status !== 'cancelled' && status !== 'returned') {
      const { deductStock } = require('../orderController');
      await deductStock(order.items, opts.session);
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
