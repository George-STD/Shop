const User = require('../../models/User');
const Product = require('../../models/Product');
const Order = require('../../models/Order');
const AuditLog = require('../../models/AuditLog');
const asyncHandler = require('../../utils/asyncHandler');

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
  // Aggregate sales by product category
  const orders = await Order.find({ status: { $ne: 'cancelled' } })
    .populate({
      path: 'items.product',
      select: 'category name',
      populate: { path: 'category', select: 'name' }
    });

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
      productSales: productSalesChart
    }
  });
}, 'حدث خطأ أثناء جلب بيانات التحليل');

// =====================================================
// AUDIT LOGS
// =====================================================
exports.getLogs = asyncHandler(async (req, res) => {
  const { entityType, action, limit = 50 } = req.query;
  const query = {};
  
  if (entityType) query.entityType = entityType;
  if (action) query.action = action;

  const logs = await AuditLog.find(query)
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .populate('adminId', 'firstName lastName email');

  res.json({
    success: true,
    data: logs
  });
}, 'حدث خطأ أثناء جلب سجل النشاطات');
