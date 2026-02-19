import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { FiChevronDown, FiSearch, FiPackage, FiTruck, FiRefreshCw, FiCreditCard, FiGift, FiShield } from 'react-icons/fi'

const faqs = [
  {
    category: 'الطلبات والشراء',
    icon: FiPackage,
    questions: [
      {
        q: 'كيف يمكنني تقديم طلب؟',
        a: 'يمكنك تقديم طلب بسهولة من خلال إضافة المنتجات إلى سلة التسوق، ثم إكمال عملية الشراء بإدخال معلومات الشحن والدفع. ستتلقى تأكيداً بالبريد الإلكتروني فور إتمام الطلب.'
      },
      {
        q: 'هل يمكنني تعديل أو إلغاء طلبي؟',
        a: 'يمكنك تعديل أو إلغاء طلبك خلال ساعة واحدة من تقديمه. بعد ذلك، يرجى التواصل مع خدمة العملاء وسنبذل قصارى جهدنا لمساعدتك.'
      },
      {
        q: 'كيف يمكنني تتبع طلبي؟',
        a: 'بمجرد شحن طلبك، ستتلقى بريداً إلكترونياً يحتوي على رقم التتبع. يمكنك استخدام هذا الرقم في صفحة "تتبع الطلب" لمتابعة حالة الشحنة.'
      },
    ]
  },
  {
    category: 'الشحن والتوصيل',
    icon: FiTruck,
    questions: [
      {
        q: 'ما هي مناطق التوصيل؟',
        a: 'نقوم بالتوصيل إلى جميع محافظات مصر. التوصيل مجاني للطلبات التي تزيد عن 500 جنيه مصري.'
      },
      {
        q: 'كم تستغرق عملية التوصيل؟',
        a: 'في القاهرة والجيزة: 1-2 يوم عمل. الإسكندرية والمدن الرئيسية: 2-3 أيام عمل. المحافظات الأخرى: 3-5 أيام عمل. التوصيل السريع متاح في نفس اليوم برسوم إضافية.'
      },
      {
        q: 'هل يمكنني تحديد موعد التوصيل؟',
        a: 'نعم، يمكنك اختيار تاريخ التوصيل المفضل أثناء عملية الشراء. يمكنك أيضاً تحديد فترة التوصيل (صباحية أو مسائية).'
      },
      {
        q: 'هل يمكنني التوصيل لعنوان مختلف؟',
        a: 'بالتأكيد! يمكنك إدخال عنوان المستلم مباشرة أثناء الطلب. هذه الخدمة مثالية لإرسال الهدايا لأحبائك.'
      },
    ]
  },
  {
    category: 'الاستبدال والاسترجاع',
    icon: FiRefreshCw,
    questions: [
      {
        q: 'ما هي سياسة الإرجاع؟',
        a: 'يمكنك إرجاع المنتجات خلال 14 يوماً من تاريخ الاستلام بشرط أن تكون بحالتها الأصلية وغير مستخدمة.'
      },
      {
        q: 'كيف يمكنني إرجاع منتج؟',
        a: 'تواصل مع خدمة العملاء لبدء عملية الإرجاع. سنقوم بترتيب استلام المنتج من عنوانك أو يمكنك إرجاعه لأقرب فرع.'
      },
      {
        q: 'متى سأستلم المبلغ المسترد؟',
        a: 'بعد استلام المنتج والتحقق من حالته، سيتم إرجاع المبلغ خلال 5-7 أيام عمل إلى نفس وسيلة الدفع المستخدمة.'
      },
    ]
  },
  {
    category: 'الدفع',
    icon: FiCreditCard,
    questions: [
      {
        q: 'ما هي طرق الدفع المتاحة؟',
        a: 'نقبل بطاقات فيزا وماستركارد ومدى، بالإضافة إلى Apple Pay و STC Pay. يمكنك أيضاً الدفع عند الاستلام.'
      },
      {
        q: 'هل الدفع آمن؟',
        a: 'نعم، جميع المعاملات مشفرة ومؤمنة بأعلى معايير الأمان. نحن لا نحتفظ ببيانات بطاقتك.'
      },
      {
        q: 'هل يمكنني استخدام كود خصم؟',
        a: 'نعم، أدخل كود الخصم في صفحة السلة وسيتم تطبيقه تلقائياً إذا كان صالحاً.'
      },
    ]
  },
  {
    category: 'تغليف الهدايا',
    icon: FiGift,
    questions: [
      {
        q: 'هل تقدمون خدمة تغليف الهدايا؟',
        a: 'نعم، نقدم خدمة تغليف هدايا احترافية. يمكنك اختيار نوع التغليف ولون الشريط أثناء إتمام الطلب.'
      },
      {
        q: 'هل يمكنني إضافة بطاقة معايدة؟',
        a: 'بالتأكيد! يمكنك كتابة رسالة شخصية وسنطبعها على بطاقة أنيقة ونضعها مع الهدية.'
      },
      {
        q: 'هل يظهر السعر على الهدية؟',
        a: 'لا، نحرص على عدم إرفاق أي فاتورة أو إشارة للسعر مع الهدايا. الفاتورة ترسل إلكترونياً فقط.'
      },
    ]
  },
  {
    category: 'الحساب والخصوصية',
    icon: FiShield,
    questions: [
      {
        q: 'هل يجب إنشاء حساب للشراء؟',
        a: 'لا، يمكنك الشراء كزائر. لكن إنشاء حساب يمنحك مزايا مثل تتبع الطلبات وحفظ العناوين والحصول على عروض خاصة.'
      },
      {
        q: 'كيف أحمي حسابي؟',
        a: 'استخدم كلمة مرور قوية ولا تشاركها مع أحد. نوصي بتفعيل التحقق بخطوتين لمزيد من الأمان.'
      },
      {
        q: 'كيف يمكنني تحديث بياناتي؟',
        a: 'سجل الدخول إلى حسابك واذهب إلى "الإعدادات" لتعديل بياناتك الشخصية والعناوين.'
      },
    ]
  },
]

const FAQPage = () => {
  const [activeCategory, setActiveCategory] = useState(0)
  const [openQuestions, setOpenQuestions] = useState({})
  const [searchQuery, setSearchQuery] = useState('')

  const toggleQuestion = (catIdx, qIdx) => {
    const key = `${catIdx}-${qIdx}`
    setOpenQuestions(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const filteredFaqs = searchQuery
    ? faqs.map(cat => ({
        ...cat,
        questions: cat.questions.filter(
          q => q.q.includes(searchQuery) || q.a.includes(searchQuery)
        )
      })).filter(cat => cat.questions.length > 0)
    : faqs

  return (
    <>
      <Helmet>
        <title>الأسئلة الشائعة | For You - إجابات لجميع استفساراتك</title>
        <meta name="description" content="اعثر على إجابات لجميع أسئلتك حول الطلبات، الشحن، الدفع، الإرجاع وغيرها. فريق خدمة العملاء متاح لمساعدتك." />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Hero */}
        <div className="bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white py-16">
          <div className="container-custom text-center">
            <h1 className="text-4xl font-bold mb-4">الأسئلة الشائعة</h1>
            <p className="text-xl opacity-90 mb-8">كيف يمكننا مساعدتك؟</p>
            
            {/* Search */}
            <div className="max-w-xl mx-auto relative">
              <FiSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
              <input
                type="text"
                placeholder="ابحث عن سؤالك..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-12 pl-4 py-4 rounded-xl text-gray-800 placeholder-gray-400"
              />
            </div>
          </div>
        </div>

        <div className="container-custom py-12">
          {searchQuery ? (
            // Search Results
            <div className="max-w-3xl mx-auto">
              <h2 className="text-xl font-bold mb-6">نتائج البحث</h2>
              {filteredFaqs.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">لم نجد نتائج لـ "{searchQuery}"</p>
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 hover:underline"
                  >
                    عرض جميع الأسئلة
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredFaqs.map((cat, catIdx) => (
                    cat.questions.map((item, qIdx) => (
                      <div key={`${catIdx}-${qIdx}`} className="bg-white rounded-xl overflow-hidden">
                        <button
                          onClick={() => toggleQuestion(catIdx, qIdx)}
                          className="w-full flex items-center justify-between p-5 text-right"
                        >
                          <span className="font-medium">{item.q}</span>
                          <FiChevronDown className={`transition-transform ${openQuestions[`${catIdx}-${qIdx}`] ? 'rotate-180' : ''}`} />
                        </button>
                        {openQuestions[`${catIdx}-${qIdx}`] && (
                          <div className="px-5 pb-5 text-gray-600">
                            {item.a}
                          </div>
                        )}
                      </div>
                    ))
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Categories View
            <div className="grid lg:grid-cols-4 gap-8">
              {/* Categories Sidebar */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl p-4 sticky top-4">
                  <h2 className="font-bold text-lg mb-4 px-2">التصنيفات</h2>
                  <nav className="space-y-1">
                    {faqs.map((cat, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveCategory(idx)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                          activeCategory === idx
                            ? 'bg-gradient-to-r from-purple-50 to-pink-50 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <cat.icon />
                        {cat.category}
                      </button>
                    ))}
                  </nav>
                </div>
              </div>

              {/* Questions */}
              <div className="lg:col-span-3">
                <div className="bg-white rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    {(() => {
                      const Icon = faqs[activeCategory].icon
                      return <Icon className="text-2xl text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600" />
                    })()}
                    <h2 className="text-2xl font-bold">{faqs[activeCategory].category}</h2>
                  </div>

                  <div className="space-y-4">
                    {faqs[activeCategory].questions.map((item, idx) => (
                      <div key={idx} className="border border-gray-100 rounded-xl overflow-hidden">
                        <button
                          onClick={() => toggleQuestion(activeCategory, idx)}
                          className="w-full flex items-center justify-between p-5 text-right hover:bg-gray-50"
                        >
                          <span className="font-medium">{item.q}</span>
                          <FiChevronDown 
                            className={`transition-transform flex-shrink-0 mr-4 ${
                              openQuestions[`${activeCategory}-${idx}`] ? 'rotate-180' : ''
                            }`} 
                          />
                        </button>
                        {openQuestions[`${activeCategory}-${idx}`] && (
                          <div className="px-5 pb-5 text-gray-600 border-t border-gray-100 pt-4">
                            {item.a}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Contact CTA */}
          <div className="mt-12 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">لم تجد إجابة لسؤالك؟</h2>
            <p className="text-gray-600 mb-6">فريق خدمة العملاء جاهز لمساعدتك</p>
            <a href="/contact" className="btn-primary inline-block">تواصل معنا</a>
          </div>
        </div>
      </div>
    </>
  )
}

export default FAQPage
