const User = require('../../models/User');
const Product = require('../../models/Product');
const Order = require('../../models/Order');
const AuditLog = require('../../models/AuditLog');
const OrderDailyStats = require('../../models/OrderDailyStats');
const asyncHandler = require('../../utils/asyncHandler');
const { buildPaginationMeta } = require('../../utils/helpers');

// Valid non-cancelled order statuses
const VALID_ORDER_STATUSES = [
  'confirmed',
  'processing',
  'shipped',
  'out_for_delivery',
  'delivered',
];

// =====================================================
// DASHBOARD STATS (Optimized Single-Pass Pipeline)
// =====================================================
exports.getStats = asyncHandler(async (req, res) => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const [
    totalUsers,
    totalProducts,
    orderMetrics,
    recentOrders,
    topProducts,
  ] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    Product.countDocuments({ isActive: true }),
    Order.aggregate([
      {
        $facet: {
          totalCount: [{ $count: 'count' }],
          totalRevenue: [
            { $match: { status: { $ne: 'cancelled' } } },
            { $group: { _id: null, total: { $sum: '$total' } } },
          ],
          byStatus: [
            { $group: { _id: '$status', count: { $sum: 1 } } },
          ],
          monthlyRevenue: [
            {
              $match: {
                createdAt: { $gte: sixMonthsAgo },
              },
            },
            {
              $group: {
                _id: {
                  month: { $month: '$createdAt' },
                  year: { $year: '$createdAt' },
                },
                revenue: { $sum: '$total' },
                orders: { $sum: 1 },
              },
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
          ],
        },
      },
    ], { allowDiskUse: true }),
    Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'firstName lastName email')
      .select('orderNumber total status createdAt')
      .lean(),
    Product.find({ isActive: true })
      .sort({ salesCount: -1 })
      .limit(5)
      .select('name price salesCount images')
      .lean(),
  ]);

  const facet = orderMetrics[0] || {};
  const totalOrders = facet.totalCount?.[0]?.count || 0;
  const totalRevenue = facet.totalRevenue?.[0]?.total || 0;
  const ordersByStatus = (facet.byStatus || []).reduce((acc, curr) => {
    if (curr._id) acc[curr._id] = curr.count;
    return acc;
  }, {});
  const monthlyRevenue = facet.monthlyRevenue || [];

  res.json({
    success: true,
    data: {
      overview: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue,
      },
      recentOrders,
      topProducts,
      ordersByStatus,
      monthlyRevenue,
    },
  });
}, 'حدث خطأ أثناء جلب الإحصائيات');

// =====================================================
// DATA ANALYSIS (Native MongoDB Pipeline Aggregation)
// =====================================================
exports.getAnalysis = asyncHandler(async (req, res) => {
  const { period, startDate, endDate } = req.query;

  const matchQuery = { status: { $ne: 'cancelled' } };
  const now = new Date();

  if (startDate || endDate) {
    matchQuery.createdAt = {};
    if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
    if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
  } else if (period === '7d') {
    matchQuery.createdAt = { $gte: new Date(now.setDate(now.getDate() - 7)) };
  } else if (period === '30d') {
    matchQuery.createdAt = { $gte: new Date(now.setDate(now.getDate() - 30)) };
  } else {
    // Default to 90 days to prevent unbounded O(N) memory exhaustion on M0 free tier
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    matchQuery.createdAt = { $gte: ninetyDaysAgo };
  }

  // Run in MongoDB directly via $facet and $lookup rather than buffering entire dataset in Node V8 heap
  const [analysisResult, lowStockProducts] = await Promise.all([
    Order.aggregate([
      { $match: matchQuery },
      { $unwind: '$items' },
      {
        $facet: {
          productSales: [
            {
              $group: {
                _id: '$items.name',
                sales: { $sum: '$items.quantity' },
              },
            },
            { $sort: { sales: -1 } },
            { $limit: 10 },
            {
              $project: {
                _id: 0,
                name: '$_id',
                sales: 1,
              },
            },
          ],
          categorySales: [
            {
              $lookup: {
                from: 'products',
                localField: 'items.product',
                foreignField: '_id',
                as: 'productDoc',
              },
            },
            { $unwind: { path: '$productDoc', preserveNullAndEmptyArrays: false } },
            { $unwind: { path: '$productDoc.category', preserveNullAndEmptyArrays: false } },
            {
              $lookup: {
                from: 'categories',
                localField: 'productDoc.category',
                foreignField: '_id',
                as: 'catDoc',
              },
            },
            { $unwind: { path: '$catDoc', preserveNullAndEmptyArrays: false } },
            {
              $group: {
                _id: '$catDoc.name',
                sales: { $sum: '$items.quantity' },
              },
            },
            { $sort: { sales: -1 } },
            {
              $project: {
                _id: 0,
                name: '$_id',
                sales: 1,
              },
            },
          ],
        },
      },
    ], { allowDiskUse: true }),
    Product.find({ isActive: true, stock: { $lte: 5 } })
      .select('name price stock category images')
      .sort({ stock: 1 })
      .limit(10)
      .lean(),
  ]);

  const facet = analysisResult[0] || {};

  res.json({
    success: true,
    data: {
      categorySales: facet.categorySales || [],
      productSales: facet.productSales || [],
      lowStockProducts,
    },
  });
}, 'حدث خطأ أثناء جلب بيانات التحليل');

// =====================================================
// AUDIT LOGS
// =====================================================
exports.getLogs = asyncHandler(async (req, res) => {
  const { entityType, action } = req.query;
  const pageNum = parseInt(req.query.page) || 1;
  const limitNum = Math.min(parseInt(req.query.limit) || 50, 100);
  const skip = (pageNum - 1) * limitNum;
  const query = {};

  if (entityType) query.entityType = entityType;
  if (action) query.action = action;

  const [logs, total] = await Promise.all([
    AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('adminId', 'firstName lastName email')
      .lean(),
    AuditLog.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: logs,
    pagination: buildPaginationMeta({ page: pageNum, limit: limitNum, total }),
  });
}, 'حدث خطأ أثناء جلب سجل النشاطات');

// =====================================================
// EXPORT REPORT DATA (Streaming Cursor with 50K Max Limit)
// =====================================================
exports.getExportReport = asyncHandler(async (req, res) => {
  const { reportType } = req.query; // 'sales' | 'inventory' | 'orders'
  const MAX_EXPORT_LIMIT = 50000;

  if (reportType === 'inventory') {
    const cursor = Product.find()
      .populate('category', 'name')
      .select('name sku price stock salesCount isActive isFeatured canBeAddedToBox createdAt')
      .limit(MAX_EXPORT_LIMIT)
      .lean()
      .cursor({ batchSize: 500 });

    const formattedData = [];
    try {
      for await (const p of cursor) {
        formattedData.push({
          'اسم المنتج': p.name,
          'SKU': p.sku || '-',
          'السعر (ج.م)': p.price,
          'المخزون': p.stock,
          'عدد المبيعات': p.salesCount || 0,
          'قابل للإضافة لبوكس': p.canBeAddedToBox ? 'نعم' : 'لا',
          'الحالة': p.isActive ? 'نشط' : 'غير نشط',
        });
      }
    } finally {
      await cursor.close();
    }

    return res.json({ success: true, reportType: 'inventory', data: formattedData });
  }

  if (reportType === 'orders' || reportType === 'sales') {
    const cursor = Order.find()
      .populate('user', 'firstName lastName email phone')
      .sort({ createdAt: -1 })
      .limit(MAX_EXPORT_LIMIT)
      .lean()
      .cursor({ batchSize: 500 });

    const formattedData = [];
    try {
      for await (const o of cursor) {
        formattedData.push({
          'رقم الطلب': o.orderNumber || o._id,
          'تاريخ الطلب': new Date(o.createdAt).toLocaleDateString('ar-EG'),
          'العميل': o.user
            ? `${o.user.firstName || ''} ${o.user.lastName || ''}`.trim()
            : o.guestEmail || 'زائر',
          'الهاتف': o.user?.phone || o.shippingAddress?.phone || '-',
          'إجمالي المبلغ (ج.م)': o.total,
          'طريقة الدفع': o.paymentMethod === 'cod' ? 'الدفع عند الاستلام' : 'إنستا باي',
          'خصم النقاط (ج.م)': o.pointsDiscount || 0,
          'حالة الطلب': o.status,
        });
      }
    } finally {
      await cursor.close();
    }

    return res.json({ success: true, reportType, data: formattedData });
  }

  return res.status(400).json({ success: false, message: 'نوع التقرير غير مدعوم' });
}, 'حدث خطأ أثناء تصدير التقرير');
