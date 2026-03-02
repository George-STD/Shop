import { Helmet } from 'react-helmet-async'
import { FiTruck, FiClock, FiMapPin, FiPackage, FiGift, FiCheckCircle } from 'react-icons/fi'

const ShippingPage = () => {
  const shippingOptions = [
    {
      title: 'التوصيل العادي',
      price: '25 ج.م',
      time: '2-5 أيام عمل',
      description: 'توصيل إلى جميع محافظات مصر',
      free: 'مجاني للطلبات فوق 500 ج.م'
    },
    {
      title: 'التوصيل السريع',
      price: '45 ج.م',
      time: '1-2 يوم عمل',
      description: 'للقاهرة والجيزة والإسكندرية'
    },
    {
      title: 'توصيل نفس اليوم',
      price: '75 ج.م',
      time: 'نفس اليوم',
      description: 'القاهرة والجيزة - للطلبات قبل 2 ظهراً'
    },
  ]

  const deliveryTimes = [
    { city: 'القاهرة', time: '1-2 يوم عمل' },
    { city: 'الجيزة', time: '1-2 يوم عمل' },
    { city: 'الإسكندرية', time: '2-3 أيام عمل' },
    { city: 'المنصورة', time: '2-3 أيام عمل' },
    { city: 'طنطا', time: '2-3 أيام عمل' },
    { city: 'المحافظات الأخرى', time: '3-5 أيام عمل' },
  ]

  return (
    <>
      <Helmet>
        <title>الشحن والتوصيل | For You - توصيل سريع لجميع أنحاء مصر</title>
        <meta name="description" content="تعرف على خيارات الشحن والتوصيل المتاحة. توصيل مجاني للطلبات فوق 500 جنيه. توصيل سريع في نفس اليوم للقاهرة والجيزة." />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Hero */}
        <div className="bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white py-16">
          <div className="container-custom text-center">
            <FiTruck className="text-5xl mx-auto mb-4" />
            <h1 className="text-4xl font-bold mb-4">الشحن والتوصيل</h1>
            <p className="text-xl opacity-90">نوصل هداياك بأمان وسرعة إلى أي مكان</p>
          </div>
        </div>

        <div className="container-custom py-12">
          {/* Shipping Options */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-8 text-center">خيارات التوصيل</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {shippingOptions.map((option, idx) => (
                <div key={idx} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold">{option.title}</h3>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 font-bold">{option.price}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <FiClock />
                    <span>{option.time}</span>
                  </div>
                  <p className="text-gray-500 text-sm">{option.description}</p>
                  {option.free && (
                    <div className="mt-4 bg-green-50 text-green-700 px-3 py-2 rounded-lg text-sm">
                      ✓ {option.free}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Delivery Times */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-8 text-center">أوقات التوصيل حسب المنطقة</h2>
            <div className="bg-white rounded-2xl p-6 max-w-2xl mx-auto">
              <div className="divide-y">
                {deliveryTimes.map((item, idx) => (
                  <div key={idx} className="flex justify-between py-4">
                    <span className="flex items-center gap-2">
                      <FiMapPin className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600" />
                      {item.city}
                    </span>
                    <span className="text-gray-600">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Features */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-8 text-center">مميزات خدمة التوصيل</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: FiPackage, title: 'تغليف آمن', desc: 'نغلف منتجاتك بعناية فائقة' },
                { icon: FiGift, title: 'تغليف هدايا', desc: 'خدمة تغليف هدايا احترافية' },
                { icon: FiClock, title: 'تحديد الموعد', desc: 'اختر تاريخ ووقت التوصيل' },
                { icon: FiCheckCircle, title: 'تتبع مباشر', desc: 'تتبع شحنتك لحظة بلحظة' },
              ].map((item, idx) => (
                <div key={idx} className="bg-white rounded-2xl p-6 text-center">
                  <div className="w-14 h-14 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <item.icon className="text-2xl text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600" />
                  </div>
                  <h3 className="font-bold mb-2">{item.title}</h3>
                  <p className="text-gray-500 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Important Notes */}
          <section className="bg-white rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-6">ملاحظات هامة</h2>
            <ul className="space-y-4 text-gray-600">
              <li className="flex gap-3">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 flex-shrink-0">•</span>
                أوقات التوصيل المذكورة هي أيام عمل (من السبت إلى الخميس)
              </li>
              <li className="flex gap-3">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 flex-shrink-0">•</span>
                قد تتأخر الشحنات في أوقات الذروة والمناسبات
              </li>
              <li className="flex gap-3">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 flex-shrink-0">•</span>
                سيتم التواصل معك قبل التوصيل للتأكيد
              </li>
              <li className="flex gap-3">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 flex-shrink-0">•</span>
                في حال عدم تواجدك، سيتم محاولة التوصيل مرة أخرى
              </li>
              <li className="flex gap-3">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 flex-shrink-0">•</span>
                للمناطق النائية قد يتطلب التوصيل وقتاً إضافياً
              </li>
            </ul>
          </section>
        </div>
      </div>
    </>
  )
}

export default ShippingPage
