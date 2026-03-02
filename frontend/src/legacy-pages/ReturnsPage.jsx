import { Helmet } from 'react-helmet-async'
import { FiRefreshCw, FiCheckCircle, FiXCircle, FiAlertCircle } from 'react-icons/fi'
import { Link } from 'react-router-dom'

const ReturnsPage = () => {
  const steps = [
    { step: 1, title: 'تواصل معنا', desc: 'اتصل بخدمة العملاء أو أرسل طلب إرجاع من حسابك' },
    { step: 2, title: 'احصل على موافقة', desc: 'سنراجع طلبك ونرسل لك تأكيد القبول' },
    { step: 3, title: 'أعد المنتج', desc: 'غلف المنتج بشكل آمن وأرسله لنا أو سنستلمه منك' },
    { step: 4, title: 'استرد أموالك', desc: 'بعد الفحص، سيتم إرجاع المبلغ خلال 5-7 أيام عمل' },
  ]

  const eligibleProducts = [
    'المنتجات غير المستخدمة وفي حالتها الأصلية',
    'المنتجات مع جميع الملحقات والتغليف الأصلي',
    'المنتجات المرجعة خلال 14 يوماً من الاستلام',
    'المنتجات غير المشمولة بالاستثناءات',
  ]

  const nonEligibleProducts = [
    'المنتجات القابلة للتلف (الشوكولاتة، الأطعمة، الورود)',
    'المنتجات المخصصة أو المحفورة بأسماء',
    'منتجات العناية الشخصية والعطور المفتوحة',
    'المنتجات التي تم استخدامها أو تلفها',
    'بطاقات الهدايا والقسائم',
  ]

  return (
    <>
      <Helmet>
        <title>الاستبدال والاسترجاع | For You - سياسة إرجاع مرنة</title>
        <meta name="description" content="سياسة الاستبدال والاسترجاع في هدايا. إرجاع سهل خلال 14 يوماً واسترداد كامل المبلغ. تعرف على الشروط والاستثناءات." />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Hero */}
        <div className="bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white py-16">
          <div className="container-custom text-center">
            <FiRefreshCw className="text-5xl mx-auto mb-4" />
            <h1 className="text-4xl font-bold mb-4">الاستبدال والاسترجاع</h1>
            <p className="text-xl opacity-90">نضمن رضاك التام عن مشترياتك</p>
          </div>
        </div>

        <div className="container-custom py-12">
          {/* Return Policy Overview */}
          <section className="bg-white rounded-2xl p-8 mb-12">
            <h2 className="text-2xl font-bold mb-6">سياسة الإرجاع</h2>
            <p className="text-gray-600 text-lg leading-relaxed mb-6">
              نحن في For You نهتم برضاك التام. إذا لم تكن راضياً عن منتجك لأي سبب، 
              يمكنك إرجاعه خلال <strong>14 يوماً</strong> من تاريخ الاستلام واسترداد كامل المبلغ.
            </p>
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 flex items-center gap-3">
              <FiAlertCircle className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 text-2xl flex-shrink-0" />
              <p className="text-purple-800">
                الإرجاع مجاني تماماً - سنتحمل تكاليف الشحن عنك
              </p>
            </div>
          </section>

          {/* Steps */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-8 text-center">خطوات الإرجاع</h2>
            <div className="grid md:grid-cols-4 gap-6">
              {steps.map((item) => (
                <div key={item.step} className="bg-white rounded-2xl p-6 text-center relative">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="font-bold mb-2">{item.title}</h3>
                  <p className="text-gray-500 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Eligible vs Non-Eligible */}
          <section className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <FiCheckCircle className="text-green-600 text-xl" />
                </div>
                <h2 className="text-xl font-bold">منتجات قابلة للإرجاع</h2>
              </div>
              <ul className="space-y-3">
                {eligibleProducts.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-gray-600">
                    <FiCheckCircle className="text-green-500 flex-shrink-0 mt-1" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <FiXCircle className="text-red-600 text-xl" />
                </div>
                <h2 className="text-xl font-bold">منتجات غير قابلة للإرجاع</h2>
              </div>
              <ul className="space-y-3">
                {nonEligibleProducts.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-gray-600">
                    <FiXCircle className="text-red-500 flex-shrink-0 mt-1" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Refund Info */}
          <section className="bg-white rounded-2xl p-8 mb-12">
            <h2 className="text-2xl font-bold mb-6">معلومات الاسترداد</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-bold mb-3">طريقة الاسترداد</h3>
                <p className="text-gray-600">
                  سيتم إرجاع المبلغ إلى نفس وسيلة الدفع المستخدمة عند الشراء. 
                  إذا كان الدفع عند الاستلام، سيتم التحويل لحسابك البنكي.
                </p>
              </div>
              <div>
                <h3 className="font-bold mb-3">مدة الاسترداد</h3>
                <p className="text-gray-600">
                  بعد استلام المنتج والتحقق من حالته، سيتم معالجة الاسترداد 
                  خلال 5-7 أيام عمل. قد يستغرق ظهور المبلغ في حسابك وقتاً إضافياً.
                </p>
              </div>
            </div>
          </section>

          {/* Exchange */}
          <section className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 mb-12">
            <h2 className="text-2xl font-bold mb-4">الاستبدال</h2>
            <p className="text-gray-700 mb-4">
              إذا كنت ترغب في استبدال المنتج بمنتج آخر أو بحجم/لون مختلف، 
              يرجى التواصل مع خدمة العملاء. سنقوم بترتيب عملية الاستبدال بأسرع وقت.
            </p>
            <p className="text-gray-600">
              <strong>ملاحظة:</strong> في حال كان المنتج البديل بسعر أعلى، ستحتاج لدفع الفرق.
              وإذا كان بسعر أقل، سنقوم بإرجاع الفرق لك.
            </p>
          </section>

          {/* Contact CTA */}
          <section className="text-center">
            <h2 className="text-2xl font-bold mb-4">هل تحتاج مساعدة؟</h2>
            <p className="text-gray-600 mb-6">فريق خدمة العملاء جاهز لمساعدتك في عملية الإرجاع</p>
            <Link to="/contact" className="btn-primary inline-block">تواصل معنا</Link>
          </section>
        </div>
      </div>
    </>
  )
}

export default ReturnsPage
