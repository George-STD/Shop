import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { FiSearch, FiEye, FiCheck, FiX, FiTruck, FiPackage } from 'react-icons/fi'
import { adminAPI } from '../../services/api'

const AdminOrders = () => {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [selectedOrder, setSelectedOrder] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', { search, status: statusFilter, page }],
    queryFn: () => adminAPI.getOrders({ 
      search: search || undefined, 
      status: statusFilter || undefined,
      page,
      limit: 20 
    }).then(res => res.data)
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => adminAPI.updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-orders'])
      setSelectedOrder(null)
    }
  })

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

  const statusOptions = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const handleStatusChange = (orderId, newStatus) => {
    if (window.confirm(`هل تريد تغيير حالة الطلب إلى "${statusLabels[newStatus]}"؟`)) {
      statusMutation.mutate({ id: orderId, status: newStatus })
    }
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex flex-wrap gap-4">
          {/* Search */}
          <div className="relative min-w-[200px] flex-1">
            <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="بحث برقم الطلب..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
          >
            <option value="">جميع الحالات</option>
            {statusOptions.map(status => (
              <option key={status} value={status}>{statusLabels[status]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-right py-4 px-6 font-medium text-gray-600">رقم الطلب</th>
                    <th className="text-right py-4 px-6 font-medium text-gray-600">العميل</th>
                    <th className="text-right py-4 px-6 font-medium text-gray-600">المبلغ</th>
                    <th className="text-right py-4 px-6 font-medium text-gray-600">الحالة</th>
                    <th className="text-right py-4 px-6 font-medium text-gray-600">التاريخ</th>
                    <th className="text-right py-4 px-6 font-medium text-gray-600">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data?.data?.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="py-4 px-6 font-medium">
                        #{order.orderNumber}
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-medium">{order.user?.firstName} {order.user?.lastName}</p>
                          <p className="text-sm text-gray-500">{order.user?.email}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-medium">
                        {formatCurrency(order.total)}
                      </td>
                      <td className="py-4 px-6">
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order._id, e.target.value)}
                          className={`px-3 py-1 rounded-full text-sm border-0 cursor-pointer ${statusColors[order.status]}`}
                        >
                          {statusOptions.map(status => (
                            <option key={status} value={status}>{statusLabels[status]}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-4 px-6 text-gray-600">
                        {new Date(order.createdAt).toLocaleDateString('ar-EG', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-4 px-6">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="عرض التفاصيل"
                        >
                          <FiEye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data?.pagination && (
              <div className="p-4 border-t flex items-center justify-between">
                <p className="text-gray-600">
                  عرض {data.data.length} من {data.pagination.total} طلب
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border rounded-lg disabled:opacity-50"
                  >
                    السابق
                  </button>
                  <span className="px-4 py-2">
                    صفحة {page} من {data.pagination.pages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(data.pagination.pages, p + 1))}
                    disabled={page >= data.pagination.pages}
                    className="px-4 py-2 border rounded-lg disabled:opacity-50"
                  >
                    التالي
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white flex items-center justify-between">
              <h2 className="text-xl font-bold">تفاصيل الطلب #{selectedOrder.orderNumber}</h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Order Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">الحالة</p>
                  <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm ${statusColors[selectedOrder.status]}`}>
                    {statusLabels[selectedOrder.status]}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">تاريخ الطلب</p>
                  <p className="font-medium mt-1">
                    {new Date(selectedOrder.createdAt).toLocaleDateString('ar-EG')}
                  </p>
                </div>
              </div>

              {/* Customer Info */}
              <div className="border rounded-xl p-4">
                <h3 className="font-bold mb-3">معلومات العميل</h3>
                <p><strong>الاسم:</strong> {selectedOrder.user?.firstName} {selectedOrder.user?.lastName}</p>
                <p><strong>البريد:</strong> {selectedOrder.user?.email}</p>
                <p><strong>الهاتف:</strong> {selectedOrder.user?.phone}</p>
              </div>

              {/* Shipping Address */}
              {selectedOrder.shippingAddress && (
                <div className="border rounded-xl p-4">
                  <h3 className="font-bold mb-3">عنوان التوصيل</h3>
                  <p>{selectedOrder.shippingAddress.firstName} {selectedOrder.shippingAddress.lastName}</p>
                  <p>{selectedOrder.shippingAddress.street}</p>
                  <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.governorate}</p>
                  <p>{selectedOrder.shippingAddress.phone}</p>
                </div>
              )}

              {/* Order Items */}
              <div className="border rounded-xl p-4">
                <h3 className="font-bold mb-3">المنتجات</h3>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      {item.product?.images?.[0] && (
                        <img 
                          src={item.product.images[0].url} 
                          alt={item.product.name}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{item.product?.name || item.name}</p>
                        <p className="text-sm text-gray-500">الكمية: {item.quantity}</p>
                      </div>
                      <p className="font-medium">{formatCurrency(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Total */}
              <div className="border rounded-xl p-4 bg-gray-50">
                <div className="flex justify-between mb-2">
                  <span>المجموع الفرعي</span>
                  <span>{formatCurrency(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>الشحن</span>
                  <span>{formatCurrency(selectedOrder.shippingCost || 0)}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between mb-2 text-green-600">
                    <span>الخصم</span>
                    <span>-{formatCurrency(selectedOrder.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>الإجمالي</span>
                  <span>{formatCurrency(selectedOrder.total)}</span>
                </div>
              </div>

              {/* Quick Status Actions */}
              <div className="flex flex-wrap gap-2">
                {selectedOrder.status === 'pending' && (
                  <button
                    onClick={() => handleStatusChange(selectedOrder._id, 'confirmed')}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <FiCheck /> تأكيد الطلب
                  </button>
                )}
                {selectedOrder.status === 'confirmed' && (
                  <button
                    onClick={() => handleStatusChange(selectedOrder._id, 'processing')}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    <FiPackage /> بدء التجهيز
                  </button>
                )}
                {selectedOrder.status === 'processing' && (
                  <button
                    onClick={() => handleStatusChange(selectedOrder._id, 'shipped')}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    <FiTruck /> تم الشحن
                  </button>
                )}
                {selectedOrder.status === 'shipped' && (
                  <button
                    onClick={() => handleStatusChange(selectedOrder._id, 'delivered')}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <FiCheck /> تم التوصيل
                  </button>
                )}
                {!['cancelled', 'delivered'].includes(selectedOrder.status) && (
                  <button
                    onClick={() => handleStatusChange(selectedOrder._id, 'cancelled')}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    <FiX /> إلغاء الطلب
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminOrders
