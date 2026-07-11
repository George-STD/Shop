const Order = require('../../models/Order');
const User = require('../../models/User');
const { sendTrackingEmail } = require('../../utils/mailer');
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
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'الطلب غير موجود' });

  order.status = status;
  order.statusHistory.push({ status, date: new Date(), note: 'تم تحديث الحالة بواسطة المسؤول' });
  if (trackingNumber) order.trackingNumber = trackingNumber;
  await order.save();

  if (status === 'shipped' && (trackingNumber || order.trackingNumber)) {
    try {
      let emailTo = order.guestEmail;
      if (!emailTo && order.user) {
        const user = await User.findById(order.user);
        emailTo = user?.email;
      }
      if (emailTo) await sendTrackingEmail(emailTo, order, trackingNumber || order.trackingNumber);
    } catch (mailErr) {
      console.error('Tracking email error:', mailErr);
    }
  }

  res.json({ success: true, message: 'تم تحديث حالة الطلب', data: order });
}, 'حدث خطأ أثناء تحديث حالة الطلب');
