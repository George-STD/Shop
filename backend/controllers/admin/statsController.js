const User = require('../../models/User');
const Product = require('../../models/Product');
const Order = require('../../models/Order');
const AuditLog = require('../../models/AuditLog');
const asyncHandler = require('../../utils/asyncHandler');
const { buildPaginationMeta } = require('../../utils/helpers');

// =====================================================
// DASHBOARD STATS
// =====================================================
exports.getStats = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalProducts,
    totalOrders,
    totalRevenue,
    recentOrders,
    topProducts,
    ordersByStatus,
    monthlyRevenue
  ] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    Product.countDocuments({ isActive: true }),
    Order.countDocuments(),
    Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]),
    Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'firstName lastName email')
      .select('orderNumber total status createdAt'),
    Product.find({ isActive: true })
      .sort({ salesCount: -1 })
      .limit(5)
      .select('name price salesCount images'),
    Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(new Date().setMonth(new Date().getMonth() - 6))
          }
        }
      },
      {
        $group: {
          _id: {
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' }
          },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ])
  ]);

  res.json({
    success: true,
    data: {
      overview: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0
      },
      recentOrders,
      topProducts,
      ordersByStatus: ordersByStatus.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
      monthlyRevenue
    }
  });
}, 'حدث خطأ أثناء جلب الإحصائيات');

// =====================================================
// DATA ANALYSIS
// =====================================================
exports.getAnalysis = asyncHandler(async (req, res) => {
  const { period, startDate, endDate } = req.query;

  // Build date query for orders
  const dateQuery = { status: { $ne: 'cancelled' } };
  const now = new Date();

  if (startDate || endDate) {
    dateQuery.createdAt = {};
    if (startDate) dateQuery.createdAt.$gte = new Date(startDate);
    if (endDate) dateQuery.createdAt.$lte = new Date(endDate);
  } else if (period === '7d') {
    dateQuery.createdAt = { $gte: new Date(now.setDate(now.getDate() - 7)) };
  } else if (period === '30d') {
    dateQuery.createdAt = { $gte: new Date(now.setDate(now.getDate() - 30)) };
  }

  // Aggregate sales by product category
  const [orders, lowStockProducts] = await Promise.all([
    Order.find(dateQuery).populate({
      path: 'items.product',
      select: 'category name',
      populate: { path: 'category', select: 'name' }
    }),
    Product.find({ isActive: true, stock: { $lte: 5 } })
      .select('name price stock category images')
      .sort({ stock: 1 })
      .limit(10)
  ]);

  let categorySales = {};
  let productSales = {};

  orders.forEach(order => {
    order.items.forEach(item => {
      const product = item.product;
      if (product) {
        // Categories
        if (Array.isArray(product.category)) {
          product.category.forEach(cat => {
            if (cat && cat.name) {
              categorySales[cat.name] = (categorySales[cat.name] || 0) + item.quantity;
            }
          });
        } else if (product.category && product.category.name) {
          const catName = product.category.name;
          categorySales[catName] = (categorySales[catName] || 0) + item.quantity;
        }

        // Products
        const prodName = product.name;
        productSales[prodName] = (productSales[prodName] || 0) + item.quantity;
      }
    });
  });

  const categorySalesChart = Object.keys(categorySales).map(key => ({
    name: key,
    sales: categorySales[key]
  })).sort((a, b) => b.sales - a.sales);

  const productSalesChart = Object.keys(productSales).map(key => ({
    name: key,
    sales: productSales[key]
  })).sort((a, b) => b.sales - a.sales).slice(0, 10); // Top 10

  res.json({
    success: true,
    data: {
      categorySales: categorySalesChart,
      productSales: productSalesChart,
      lowStockProducts
    }
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
      .populate('adminId', 'firstName lastName email'),
    AuditLog.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: logs,
    pagination: buildPaginationMeta({ page: pageNum, limit: limitNum, total })
  });
}, 'حدث خطأ أثناء جلب سجل النشاطات');

// =====================================================
// EXPORT REPORT DATA
// =====================================================
exports.getExportReport = asyncHandler(async (req, res) => {
  const { reportType } = req.query; // 'sales' | 'inventory' | 'orders'

  if (reportType === 'inventory') {
    const products = await Product.find()
      .populate('category', 'name')
      .select('name sku price stock salesCount isActive isFeatured canBeAddedToBox createdAt')
      .lean();

    const formattedData = products.map(p => ({
      'اسم المنتج': p.name,
      'SKU': p.sku || '-',
      'السعر (ج.م)': p.price,
      'المخزون': p.stock,
      'عدد المبيعات': p.salesCount || 0,
      'قابل للإضافة لبوكس': p.canBeAddedToBox ? 'نعم' : 'لا',
      'الحالة': p.isActive ? 'نشط' : 'غير نشط'
    }));

    return res.json({ success: true, reportType: 'inventory', data: formattedData });
  }

  if (reportType === 'orders' || reportType === 'sales') {
    const orders = await Order.find()
      .populate('user', 'firstName lastName email phone')
      .sort({ createdAt: -1 })
      .lean();

    const formattedData = orders.map(o => ({
      'رقم الطلب': o.orderNumber || o._id,
      'تاريخ الطلب': new Date(o.createdAt).toLocaleDateString('ar-EG'),
      'العميل': o.user ? `${o.user.firstName} ${o.user.lastName}` : (o.guestEmail || 'زائر'),
      'الهاتف': o.user?.phone || o.shippingAddress?.phone || '-',
      'إجمالي المبلغ (ج.م)': o.total,
      'طريقة الدفع': o.paymentMethod === 'cod' ? 'الدفع عند الاستلام' : 'إنستا باي',
      'خصم النقاط (ج.م)': o.pointsDiscount || 0,
      'حالة الطلب': o.status
    }));

    return res.json({ success: true, reportType, data: formattedData });
  }

  return res.status(400).json({ success: false, message: 'نوع التقرير غير مدعوم' });
}, 'حدث خطأ أثناء تصدير التقرير');
