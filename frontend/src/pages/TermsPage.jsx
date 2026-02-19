import { Helmet } from 'react-helmet-async'

const TermsPage = () => {
  return (
    <>
      <Helmet>
        <title>الشروط والأحكام | For You</title>
        <meta name="description" content="الشروط والأحكام الخاصة باستخدام متجر For You. يرجى قراءة الشروط بعناية قبل استخدام الموقع." />
      </Helmet>

      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto bg-white rounded-2xl p-8 md:p-12 shadow-sm">
            <h1 className="text-3xl font-bold mb-8">الشروط والأحكام</h1>
            <p className="text-gray-500 mb-8">آخر تحديث: 1 مارس 2024</p>

            <div className="prose prose-lg max-w-none text-gray-600">
              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">1. القبول</h2>
                <p>
                  باستخدامك لهذا الموقع، فإنك توافق على الشروط والأحكام المذكورة هنا بالكامل. إذا لم توافق على أي جزء من هذه الشروط، يرجى عدم استخدام الموقع.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">2. التعريفات</h2>
                <ul className="list-disc list-inside space-y-2">
                  <li><strong>"نحن" أو "الموقع" أو "المتجر":</strong> تشير إلى متجر For You الإلكتروني</li>
                  <li><strong>"أنت" أو "المستخدم" أو "العميل":</strong> تشير إلى أي شخص يستخدم الموقع أو يشتري من خلاله</li>
                  <li><strong>"المنتجات":</strong> تعني جميع السلع المعروضة للبيع على الموقع</li>
                  <li><strong>"الخدمات":</strong> تعني جميع الخدمات المقدمة عبر الموقع</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">3. الأهلية</h2>
                <p>
                  يجب أن يكون عمرك 18 عامًا أو أكثر لاستخدام هذا الموقع أو الشراء منه. إذا كنت أقل من 18 عامًا يجب أن يكون لديك إذن من ولي أمرك.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">4. سياسة الخصوصية</h2>
                <ul className="list-disc list-inside space-y-2">
                  <li>نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية</li>
                  <li>لن نشارك معلوماتك مع أي طرف ثالث إلا بموافقتك أو حسب القانون</li>
                  <li>يرجى مراجعة صفحة سياسة الخصوصية لمزيد من التفاصيل</li>
                  <li>قد نقوم بتحديث هذه السياسة من وقت لآخر</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">5. شروط الاستخدام</h2>
                <ul className="list-disc list-inside space-y-2">
                  <li>يجب استخدام الموقع بشكل قانوني فقط</li>
                  <li>يمنع استخدام الموقع لأي أغراض غير مشروعة</li>
                  <li>يحق لنا إيقاف أو حظر أي مستخدم يخالف الشروط</li>
                  <li>يجب احترام حقوق الملكية الفكرية للموقع</li>
                  <li>أي إساءة استخدام تعرضك للمساءلة القانونية</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">6. سياسة الدفع</h2>
                <ul className="list-disc list-inside space-y-2">
                  <li>نوفر عدة طرق دفع آمنة وسهلة لراحتك</li>
                  <li>يجب دفع قيمة الطلب كاملة قبل الشحن</li>
                  <li>جميع بيانات الدفع مشفرة وآمنة</li>
                  <li>لا نحتفظ بمعلومات بطاقتك بعد إتمام العملية</li>
                  <li>للاستفسار عن الدفع تواصل معنا</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">7. سياسة الشحن</h2>
                <ul className="list-disc list-inside space-y-2">
                  <li>نقوم بتوصيل الطلبات لجميع أنحاء مصر</li>
                  <li>تختلف مدة الشحن حسب المدينة وطريقة التوصيل</li>
                  <li>يرجى التأكد من صحة عنوانك لتفادي التأخير</li>
                  <li>للاستفسار عن الشحن تواصل مع خدمة العملاء</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">8. سياسة الاسترجاع</h2>
                <p className="mb-4">
                  يمكنك استرجاع المنتجات خلال 14 يومًا من الاستلام في الحالات التالية:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li>وجود عيب في المنتج أو تلف أثناء الشحن</li>
                  <li>استلام منتج مختلف عن الطلب</li>
                  <li>عدم مطابقة المنتج للمواصفات المذكورة</li>
                  <li>المنتج غير مستخدم وفي عبوته الأصلية</li>
                </ul>
                <p className="mt-4">
                  لمزيد من التفاصيل راجع <a href="/returns" className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 hover:underline">سياسة الاسترجاع</a>.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">9. سياسة إلغاء الطلبات</h2>
                <p>
                  يمكنك إلغاء الطلب قبل الشحن فقط (يرجى التواصل مع خدمة العملاء). بعد الشحن لا يمكن الإلغاء إلا في حالات خاصة.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">10. الضمان والصيانة</h2>
                <p className="mb-4">يشمل الضمان:</p>
                <ul className="list-disc list-inside space-y-2">
                  <li>المنتجات التي بها عيوب مصنعية</li>
                  <li>المنتجات التي لا تعمل كما هو متوقع</li>
                  <li>لا يشمل الضمان سوء الاستخدام</li>
                  <li>يرجى مراجعة شروط الضمان لكل منتج</li>
                  <li>للاستفسار عن الضمان تواصل معنا</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">11. حقوق الملكية</h2>
                <p>
                  جميع محتويات الموقع (النصوص، الصور، الشعارات) محمية بحقوق الملكية الفكرية ولا يجوز استخدامها بدون إذن كتابي.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">12. التعديلات على الشروط</h2>
                <p>
                  يحق لنا تعديل الشروط والأحكام في أي وقت. سيتم نشر التعديلات على هذه الصفحة.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">13. التواصل</h2>
                <p>
                  إذا كان لديك أي استفسار أو شكوى يمكنك التواصل معنا عبر البريد الإلكتروني أو الهاتف.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-800 mb-4">14. بيانات التواصل</h2>
                <p>
                  يمكنك التواصل معنا عبر:
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

