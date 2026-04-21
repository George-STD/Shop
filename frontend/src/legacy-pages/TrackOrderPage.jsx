import { useState, useEffect } from 'react'
import { FiSearch, FiPackage, FiTruck, FiCheckCircle } from 'react-icons/fi'
import { useSearchParams } from 'react-router-dom'
import { ordersAPI } from '../services/api'

const statusLabels = {
  pending: 'في الانتظار',
  confirmed: 'تم التأكيد',
  processing: 'جاري التجهيز',
  shipped: 'تم الشحن',
  delivered: 'تم التوصيل',
  cancelled: 'ملغي',
}

const statusFlow = ['pending', 'confirmed', 'processing', 'shipped', 'delivered']

const TrackOrderPage = () => {
  const [searchParams] = useSearchParams()
  const [orderNumber, setOrderNumber] = useState('')
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchOrder = async (num) => {
    setLoading(true)
    setError('')
    setOrder(null)
    try {
      const res = await ordersAPI.track(num.trim())
      if (res.data.success) {
        setOrder(res.data.data)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'لم نتمكن من العثور على طلب بهذا الرقم. يرجى التحقق من البيانات المدخلة.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const orderParam = searchParams.get('order')
    if (orderParam) {
      setOrderNumber(orderParam)
      fetchOrder(orderParam)
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    fetchOrder(orderNumber)
  }

  const buildTimeline = (order) => {
    const currentIdx = statusFlow.indexOf(order.status)
    return statusFlow.map((status, idx) => {
      const historyEntry = order.statusHistory?.find(h => h.status === status)
      return {
        status,
        title: statusLabels[status],
        date: historyEntry ? new Date(historyEntry.date || historyEntry.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '',
        completed: idx <= currentIdx,
        current: idx === currentIdx,
      }
    })
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ordered':
      case 'confirmed':
        return <FiPackage />
      case 'preparing':
      case 'shipped':
      case 'in-transit':
        return <FiTruck />
      case 'delivered':
        return <FiCheckCircle />
      default:
        return <FiPackage />
    }
  }

  return (
    <>

      <div className="min-h-screen bg-gray-50">
        {/* Hero */}
        <div className="bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white py-16">
          <div className="container-custom text-center">
            <FiTruck className="text-5xl mx-auto mb-4" />
            <h1 className="text-4xl font-bold mb-4">تتبع طلبك</h1>
            <p className="text-xl opacity-90">اعرف مكان شحنتك الآن</p>
          </div>
        </div>

        <div className="container-custom py-12">
          {/* Search Form */}
          <div className="max-w-2xl mx-auto bg-white rounded-2xl p-8 shadow-sm -mt-20 relative z-10 mb-12">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">رقم الطلب</label>
                <input
                  type="text"
                  required
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="أدخل رقم الطلب"
                  className="input-field"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {loading ? (
                  'جاري البحث...'
                ) : (
                  <>
                    <FiSearch />
                    تتبع الطلب
                  </>
                )}
              </button>
            </form>

            {error && (
              <div className="mt-4 bg-red-50 text-red-600 p-4 rounded-xl">
                {error}
              </div>
            )}
          </div>

          {/* Order Details */}
          {order && (
            <div className="max-w-4xl mx-auto">
              {/* Order Summary */}
              <div className="bg-white rounded-2xl p-6 mb-6">
                <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                  <div>
                    <h2 className="text-xl font-bold">طلب رقم #{order.orderNumber}</h2>
                    <p className="text-gray-500">تاريخ الطلب: {new Date(order.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                  <div className="text-left">
                    <span className={`inline-block px-4 py-2 rounded-full font-medium ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-700'
                        : order.status === 'cancelled' ? 'bg-red-100 text-red-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {statusLabels[order.status] || order.status}
                    </span>
                  </div>
                </div>

                {/* Items */}
                <div className="border-t pt-6">
                  <h3 className="font-bold mb-4">المنتجات</h3>
                  <div className="space-y-3">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-4">
                        {item.image && <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover" />}
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-gray-500 text-sm">الكمية: {item.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Timeline */}
              {order.status !== 'cancelled' && (
                <div className="bg-white rounded-2xl p-6 mb-6">
                  <h3 className="font-bold mb-6">حالة الشحنة</h3>
                  <div className="relative">
                    {buildTimeline(order).map((item, idx, arr) => (
                      <div key={idx} className="flex gap-4 pb-8 last:pb-0">
                        <div className="relative">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            item.current
                              ? 'bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 text-white animate-pulse'
                              : item.completed
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-200 text-gray-400'
                          }`}>
                            {getStatusIcon(item.status)}
                          </div>
                          {idx < arr.length - 1 && (
                            <div className={`absolute top-10 right-1/2 w-0.5 h-full transform translate-x-1/2 ${
                              item.completed ? 'bg-green-500' : 'bg-gray-200'
                            }`} />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className={`font-medium ${item.current ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600' : ''}`}>
                            {item.title}
                          </p>
                          <p className="text-gray-500 text-sm">{item.date || 'قريباً'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Help Section */}
          {!order && (
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-xl font-bold mb-4">أين أجد رقم الطلب؟</h2>
              <p className="text-gray-600 mb-6">
                ستجد رقم الطلب في رسالة التأكيد التي أرسلناها لبريدك الإلكتروني بعد إتمام عملية الشراء.
                يمكنك أيضاً العثور عليه في صفحة "طلباتي" إذا كنت مسجلاً في الموقع.
              </p>
              <div className="flex justify-center gap-4">
                <a href="/account/orders" className="btn-primary">طلباتي</a>
                <a href="/contact" className="btn-secondary">تواصل معنا</a>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default TrackOrderPage
