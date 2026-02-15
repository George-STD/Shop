import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { 
  FiUsers, FiPackage, FiShoppingCart, FiDollarSign,
  FiTrendingUp, FiArrowUpRight, FiArrowDownRight
} from 'react-icons/fi'
import { adminAPI } from '../../services/api'

const AdminDashboard = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminAPI.getStats().then(res => res.data.data),
    refetchInterval: 60000 // Refresh every minute
  })

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const statusLabels = {
    pending: 'قيد الانتظار',
    confirmed: 'مؤكد',
    processing: 'قيد التجهيز',
    shipped: 'تم الشحن',
    delivered: 'تم التوصيل',
    cancelled: 'ملغي'
  }

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    processing: 'bg-purple-100 text-purple-800',
    shipped: 'bg-indigo-100 text-indigo-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
              <div className="h-8 bg-gray-200 rounded w-3/4" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const overviewCards = [
    {
      title: 'إجمالي المستخدمين',
      value: stats?.overview?.totalUsers || 0,
      icon: FiUsers,
      color: 'bg-blue-500',
      link: '/admin/users'
    },
    {
      title: 'المنتجات',
      value: stats?.overview?.totalProducts || 0,
      icon: FiPackage,
      color: 'bg-green-500',
      link: '/admin/products'
    },
    {
      title: 'الطلبات',
      value: stats?.overview?.totalOrders || 0,
      icon: FiShoppingCart,
      color: 'bg-purple-500',
      link: '/admin/orders'
    },
    {
      title: 'إجمالي الإيرادات',
      value: formatCurrency(stats?.overview?.totalRevenue || 0),
      icon: FiDollarSign,
      color: 'bg-gradient-to-r from-purple-50 to-pink-500',
      isRevenue: true
    }
  ]

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {overviewCards.map((card, index) => (
          <div 
            key={index}
            className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">{card.title}</p>
                <p className="text-2xl font-bold mt-1">{card.value}</p>
              </div>
              <div className={`w-12 h-12 ${card.color} rounded-xl flex items-center justify-center text-white`}>
                <card.icon className="w-6 h-6" />
              </div>
            </div>
            {card.link && (
              <Link 
                to={card.link}
                className="inline-flex items-center gap-1 text-sm text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mt-4 hover:underline"
              >
                عرض الكل
                <FiArrowUpRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders by Status */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-4">الطلبات حسب الحالة</h2>
          <div className="space-y-3">
            {Object.entries(stats?.ordersByStatus || {}).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className={`px-3 py-1 rounded-full text-sm ${statusColors[status]}`}>
                  {statusLabels[status]}
                </span>
                <span className="font-medium">{count}</span>
              </div>
            ))}
            {Object.keys(stats?.ordersByStatus || {}).length === 0 && (
              <p className="text-gray-500 text-center py-4">لا توجد طلبات</p>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-4">المنتجات الأكثر مبيعاً</h2>
          <div className="space-y-4">
            {stats?.topProducts?.map((product, index) => (
              <div key={product._id} className="flex items-center gap-3">
                <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </span>
                {product.images?.[0] && (
                  <img 
                    src={product.images[0].url} 
                    alt={product.name}
                    className="w-10 h-10 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{product.name}</p>
                  <p className="text-sm text-gray-500">{formatCurrency(product.price)}</p>
                </div>
                <span className="text-sm text-gray-500">{product.salesCount} مبيعات</span>
              </div>
            ))}
            {stats?.topProducts?.length === 0 && (
              <p className="text-gray-500 text-center py-4">لا توجد مبيعات</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">أحدث الطلبات</h2>
          <Link to="/admin/orders" className="text-sm text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 hover:underline">
            عرض الكل
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-right py-3 px-2 text-gray-500 font-medium">رقم الطلب</th>
                <th className="text-right py-3 px-2 text-gray-500 font-medium">العميل</th>
                <th className="text-right py-3 px-2 text-gray-500 font-medium">المبلغ</th>
                <th className="text-right py-3 px-2 text-gray-500 font-medium">الحالة</th>
                <th className="text-right py-3 px-2 text-gray-500 font-medium">التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentOrders?.map((order) => (
                <tr key={order._id} className="border-b last:border-0">
                  <td className="py-3 px-2">
                    <Link 
                      to={`/admin/orders/${order._id}`}
                      className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 hover:underline"
                    >
                      #{order.orderNumber}
                    </Link>
                  </td>
                  <td className="py-3 px-2">
                    {order.user?.firstName} {order.user?.lastName}
                  </td>
                  <td className="py-3 px-2">{formatCurrency(order.total)}</td>
                  <td className="py-3 px-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${statusColors[order.status]}`}>
                      {statusLabels[order.status]}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString('ar-EG')}
                  </td>
                </tr>
              ))}
              {stats?.recentOrders?.length === 0 && (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-gray-500">
                    لا توجد طلبات حتى الآن
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
