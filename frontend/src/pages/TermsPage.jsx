import { Helmet } from 'react-helmet-async'

const TermsPage = () => {
  return (
    <>
      <Helmet>
        <title>الشروط والأحكام | For You</title>
        <meta name="description" content="الشروط والأحكام لاستخدام متجر هدايا. تعرف على حقوقك والتزاماتك عند التسوق معنا." />
      </Helmet>

      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto bg-white rounded-2xl p-8 md:p-12 shadow-sm">
            <h1 className="text-3xl font-bold mb-8">الشروط والأحكام</h1>
            <p className="text-gray-500 mb-8">آخر تحديث: 1 يناير 2024</p>

            <div className="prose prose-lg max-w-none text-gray-600">
              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">1. مقدمة</h2>
                <p>
                  مرحباً بك في هدايا. باستخدامك لموقعنا الإلكتروني وخدماتنا، فإنك توافق على الالتزام 
                  بهذه الشروط والأحكام. يرجى قراءتها بعناية قبل استخدام الموقع أو إجراء أي عملية شراء.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">2. التعريفات</h2>
                <ul className="list-disc list-inside space-y-2">
                  <li><strong>"نحن"، "لنا"، "الموقع":</strong> يشير إلى متجر هدايا الإلكتروني</li>
                  <li><strong>"أنت"، "المستخدم"، "العميل":</strong> يشير إلى أي شخص يستخدم موقعنا</li>
                  <li><strong>"المنتجات":</strong> البضائع والخدمات المعروضة للبيع</li>
                  <li><strong>"الطلب":</strong> عملية شراء المنتجات عبر الموقع</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">3. الأهلية</h2>
                <p>
                  يجب أن يكون عمرك 18 عاماً أو أكثر لإجراء عمليات الشراء. باستخدام الموقع، 
                  فإنك تقر بأنك تبلغ من العمر 18 عاماً على الأقل.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">4. حساب المستخدم</h2>
                <ul className="list-disc list-inside space-y-2">
                  <li>أنت مسؤول عن الحفاظ على سرية بيانات حسابك</li>
                  <li>يجب تقديم معلومات دقيقة وحديثة</li>
                  <li>نحتفظ بحق تعليق أو إنهاء الحسابات المخالفة</li>
                  <li>يجب إخطارنا فوراً بأي استخدام غير مصرح به</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">5. المنتجات والأسعار</h2>
                <ul className="list-disc list-inside space-y-2">
                  <li>نسعى لعرض المنتجات بدقة، لكن الألوان قد تختلف قليلاً</li>
                  <li>الأسعار بالجنيه المصري وتشمل ضريبة القيمة المضافة</li>
                  <li>نحتفظ بحق تعديل الأسعار دون إشعار مسبق</li>
                  <li>المنتجات متاحة حسب التوفر</li>
                  <li>في حال وجود خطأ في السعر، سنتواصل معك قبل إتمام الطلب</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">6. الطلبات والدفع</h2>
                <ul className="list-disc list-inside space-y-2">
                  <li>تقديم الطلب يعتبر عرضاً للشراء وليس عقداً ملزماً</li>
                  <li>نحتفظ بحق رفض أو إلغاء أي طلب</li>
                  <li>سيتم تأكيد الطلب عبر البريد الإلكتروني</li>
                  <li>يجب أن تكون وسيلة الدفع صالحة وباسمك</li>
                  <li>جميع المعاملات آمنة ومشفرة</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">7. الشحن والتوصيل</h2>
                <ul className="list-disc list-inside space-y-2">
                  <li>نوصل إلى جميع محافظات مصر</li>
                  <li>أوقات التوصيل تقديرية وقد تتأثر بعوامل خارجية</li>
                  <li>أنت مسؤول عن صحة عنوان التوصيل</li>
                  <li>ملكية المنتجات تنتقل إليك عند الاستلام</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">8. الإرجاع والاستبدال</h2>
                <p className="mb-4">
                  يمكنك إرجاع المنتجات خلال 14 يوماً من الاستلام وفقاً للشروط التالية:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li>المنتج في حالته الأصلية وغير مستخدم</li>
                  <li>التغليف الأصلي سليم</li>
                  <li>المنتجات القابلة للتلف غير قابلة للإرجاع</li>
                  <li>المنتجات المخصصة غير قابلة للإرجاع</li>
                </ul>
                <p className="mt-4">
                  لمزيد من التفاصيل، راجع <a href="/returns" className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 hover:underline">سياسة الإرجاع</a>.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">9. حقوق الملكية الفكرية</h2>
                <p>
                  جميع المحتويات على الموقع (النصوص، الصور، الشعارات، التصاميم) محمية بحقوق الملكية الفكرية 
                  ولا يجوز نسخها أو استخدامها دون إذن كتابي مسبق.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">10. الاستخدام المحظور</h2>
                <p className="mb-4">يُحظر عليك:</p>
                <ul className="list-disc list-inside space-y-2">
                  <li>استخدام الموقع لأي غرض غير قانوني</li>
                  <li>محاولة الوصول غير المصرح به للأنظمة</li>
                  <li>نشر محتوى ضار أو مسيء</li>
                  <li>انتحال شخصية الآخرين</li>
                  <li>التدخل في عمل الموقع</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">11. حدود المسؤولية</h2>
                <p>
                  لا نتحمل المسؤولية عن أي أضرار غير مباشرة أو عرضية ناتجة عن استخدام الموقع 
                  أو المنتجات، في حدود ما يسمح به القانون.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">12. القانون المعمول به</h2>
                <p>
                  تخضع هذه الشروط والأحكام للقانون المصري، وتختص المحاكم المصرية 
                  بالنظر في أي نزاعات تنشأ عنها.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">13. التعديلات</h2>
                <p>
                  نحتفظ بحق تعديل هذه الشروط في أي وقت. سيتم نشر التعديلات على هذه الصفحة 
                  وتاريخ آخر تحديث. استمرار استخدامك للموقع يعني موافقتك على الشروط المعدلة.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-800 mb-4">14. تواصل معنا</h2>
                <p>
                  إذا كانت لديك أي أسئلة حول الشروط والأحكام، يرجى التواصل معنا:
                </p>
                <div className="mt-4 bg-gray-50 rounded-xl p-4">
                  <p><strong>البريد الإلكتروني:</strong> legal@hadaya.sa</p>
                  <p><strong>الهاتف:</strong> +966 50 123 4567</p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default TermsPage
