import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { FiSearch, FiPackage, FiTruck, FiCheckCircle, FiMapPin } from 'react-icons/fi'

const TrackOrderPage = () => {
  const [orderNumber, setOrderNumber] = useState('')
  const [email, setEmail] = useState('')
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Demo order data
    if (orderNumber === '123456' || orderNumber.length >= 5) {
      setOrder({
        number: orderNumber,
        date: '15 فبراير 2024',
        status: 'in-transit',
        estimatedDelivery: '18 فبراير 2024',
        items: [
          { name: 'باقة ورد فاخرة', quantity: 1, image: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=100' },
          { name: 'علبة شوكولاتة', quantity: 1, image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=100' },
        ],
        timeline: [
          { status: 'ordered', title: 'تم استلام الطلب', date: '15 فبراير 2024 - 10:30 ص', completed: true },
          { status: 'confirmed', title: 'تم تأكيد الطلب', date: '15 فبراير 2024 - 11:00 ص', completed: true },
          { status: 'preparing', title: 'جاري تجهيز الطلب', date: '15 فبراير 2024 - 2:00 م', completed: true },
          { status: 'shipped', title: 'تم الشحن', date: '16 فبراير 2024 - 9:00 ص', completed: true },
          { status: 'in-transit', title: 'الطلب في الطريق', date: '17 فبراير 2024', completed: true, current: true },
          { status: 'delivered', title: 'تم التوصيل', date: '', completed: false },
        ],
        address: {
          name: 'محمد أحمد',
          street: '١٢ شارع الثورة، مصر الجديدة',
          city: 'القاهرة',
          phone: '+20 10 123 4567'
        }
      })
    } else {
      setError('لم يتم العثور على الطلب. يرجى التأكد من رقم الطلب والمحاولة مرة أخرى.')
    }
    
    setLoading(false)
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
      <Helmet>
        <title>تتبع الطلب | For You - هدايا أونلاين في مصر</title>
        <meta name="description" content="تتبع حالة طلبك بسهولة من خلال إدخال رقم الطلب والبريد الإلكتروني. تعرف على حالة الشحن والتوصيل مباشرة." />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Hero */}
        <div className="bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white py-16">
          <div className="container-custom text-center">
            <FiTruck className="text-5xl mx-auto mb-4" />
            <h1 className="text-4xl font-bold mb-4">تتبع الطلب</h1>
            <p className="text-xl opacity-90">تحقق من حالة طلبك</p>
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
                  placeholder="أدخل رقم الطلب (مثال: 123456)"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">البريد الإلكتروني (اختياري)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="أدخل بريدك الإلكتروني المستخدم في الطلب"
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
                    <h2 className="text-xl font-bold">طلب رقم #{order.number}</h2>
                    <p className="text-gray-500">تاريخ الطلب: {order.date}</p>
                  </div>
                  <div className="text-left">
                    <span className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full font-medium">
                      الطلب في الطريق
                    </span>
                    <p className="text-gray-500 mt-1">موعد التوصيل المتوقع: {order.estimatedDelivery}</p>
                  </div>
                </div>

                {/* Items */}
                <div className="border-t pt-6">
                  <h3 className="font-bold mb-4">المنتجات</h3>
                  <div className="space-y-3">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-4">
                        <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover" />
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
              <div className="bg-white rounded-2xl p-6 mb-6">
                <h3 className="font-bold mb-6">حالة الطلب</h3>
                <div className="relative">
                  {order.timeline.map((item, idx) => (
                    <div key={idx} className="flex gap-4 pb-8 last:pb-0">
                      {/* Icon */}
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
                        {idx < order.timeline.length - 1 && (
                          <div className={`absolute top-10 right-1/2 w-0.5 h-full transform translate-x-1/2 ${
                            item.completed ? 'bg-green-500' : 'bg-gray-200'
                          }`} />
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1">
                        <p className={`font-medium ${item.current ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600' : ''}`}>
                          {item.title}
                        </p>
                        <p className="text-gray-500 text-sm">{item.date || 'غير متوفر'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Address */}
              <div className="bg-white rounded-2xl p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <FiMapPin className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600" />
                  عنوان التوصيل
                </h3>
                <div className="text-gray-600">
                  <p className="font-medium text-gray-800">{order.address.name}</p>
                  <p>{order.address.street}</p>
                  <p>{order.address.city}</p>
                  <p>{order.address.phone}</p>
                </div>
              </div>
            </div>
          )}

          {/* Help Section */}
          {!order && (
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-xl font-bold mb-4">هل تحتاج للمساعدة؟</h2>
              <p className="text-gray-600 mb-6">
                إذا لم تتمكن من تتبع طلبك، تأكد من إدخال رقم الطلب بشكل صحيح أو تواصل مع خدمة العملاء.
                يمكنك أيضًا مراجعة صفحة الطلبات من حسابك.
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

