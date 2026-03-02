import { Helmet } from 'react-helmet-async'

const PrivacyPage = () => {
  return (
    <>
      <Helmet>
        <title>سياسة الخصوصية | For You</title>
        <meta name="description" content="سياسة الخصوصية لمتجر هدايا. تعرف على كيفية جمع واستخدام وحماية بياناتك الشخصية." />
      </Helmet>

      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto bg-white rounded-2xl p-8 md:p-12 shadow-sm">
            <h1 className="text-3xl font-bold mb-8">سياسة الخصوصية</h1>
            <p className="text-gray-500 mb-8">آخر تحديث: 1 يناير 2024</p>

            <div className="prose prose-lg max-w-none text-gray-600">
              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">مقدمة</h2>
                <p>
                  نحن في For You نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية. توضح سياسة الخصوصية هذه 
                  كيفية جمع واستخدام ومشاركة وحماية معلوماتك عند استخدام موقعنا الإلكتروني وخدماتنا.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">المعلومات التي نجمعها</h2>
                <h3 className="font-bold text-gray-700 mb-2">المعلومات التي تقدمها لنا:</h3>
                <ul className="list-disc list-inside mb-4 space-y-2">
                  <li>الاسم ومعلومات الاتصال (البريد الإلكتروني، رقم الهاتف)</li>
                  <li>عنوان الشحن والفواتير</li>
                  <li>معلومات الدفع (لا نحتفظ ببيانات البطاقات)</li>
                  <li>سجل المشتريات والطلبات</li>
                  <li>التفضيلات وقوائم الأمنيات</li>
                  <li>المراسلات معنا</li>
                </ul>

                <h3 className="font-bold text-gray-700 mb-2">المعلومات التي نجمعها تلقائياً:</h3>
                <ul className="list-disc list-inside space-y-2">
                  <li>عنوان IP ونوع المتصفح</li>
                  <li>معلومات الجهاز ونظام التشغيل</li>
                  <li>سلوك التصفح على موقعنا</li>
                  <li>ملفات تعريف الارتباط (Cookies)</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">كيف نستخدم معلوماتك</h2>
                <ul className="list-disc list-inside space-y-2">
                  <li>معالجة وتنفيذ طلباتك</li>
                  <li>التواصل معك بشأن طلباتك والخدمات</li>
                  <li>إرسال العروض والتحديثات (بموافقتك)</li>
                  <li>تحسين موقعنا وخدماتنا</li>
                  <li>منع الاحتيال وضمان الأمان</li>
                  <li>الامتثال للمتطلبات القانونية</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">مشاركة المعلومات</h2>
                <p className="mb-4">نشارك معلوماتك فقط مع:</p>
                <ul className="list-disc list-inside space-y-2">
                  <li><strong>شركات الشحن:</strong> لتوصيل طلباتك</li>
                  <li><strong>معالجي الدفع:</strong> لإتمام المعاملات المالية</li>
                  <li><strong>مزودي الخدمات:</strong> الذين يساعدوننا في تشغيل الموقع</li>
                  <li><strong>الجهات القانونية:</strong> عند الاقتضاء بموجب القانون</li>
                </ul>
                <p className="mt-4">
                  <strong>لا نبيع أو نؤجر معلوماتك الشخصية لأطراف ثالثة.</strong>
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">ملفات تعريف الارتباط (Cookies)</h2>
                <p className="mb-4">نستخدم ملفات تعريف الارتباط لـ:</p>
                <ul className="list-disc list-inside space-y-2">
                  <li>تذكر تفضيلاتك وسلة التسوق</li>
                  <li>تحليل استخدام الموقع</li>
                  <li>تخصيص تجربتك</li>
                  <li>عرض إعلانات مخصصة</li>
                </ul>
                <p className="mt-4">
                  يمكنك إدارة ملفات تعريف الارتباط من إعدادات متصفحك.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">أمان البيانات</h2>
                <p>
                  نتخذ إجراءات أمنية مناسبة لحماية معلوماتك من الوصول غير المصرح به أو التغيير 
                  أو الإفشاء أو الإتلاف. نستخدم تشفير SSL لحماية نقل البيانات ونخزن المعلومات 
                  في خوادم آمنة.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">حقوقك</h2>
                <p className="mb-4">لديك الحق في:</p>
                <ul className="list-disc list-inside space-y-2">
                  <li>الوصول إلى بياناتك الشخصية</li>
                  <li>تصحيح البيانات غير الدقيقة</li>
                  <li>طلب حذف بياناتك</li>
                  <li>الاعتراض على معالجة بياناتك</li>
                  <li>سحب موافقتك في أي وقت</li>
                  <li>تقديم شكوى للجهات المختصة</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">الاحتفاظ بالبيانات</h2>
                <p>
                  نحتفظ ببياناتك الشخصية طالما كان ذلك ضرورياً للأغراض المذكورة في هذه السياسة، 
                  أو وفقاً لما يقتضيه القانون. سجلات المعاملات قد نحتفظ بها لفترات أطول للامتثال 
                  للمتطلبات المحاسبية والضريبية.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">التغييرات على السياسة</h2>
                <p>
                  قد نقوم بتحديث سياسة الخصوصية من وقت لآخر. سنخطرك بأي تغييرات جوهرية 
                  عبر البريد الإلكتروني أو إشعار على موقعنا.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-800 mb-4">تواصل معنا</h2>
                <p>
                  إذا كانت لديك أي أسئلة حول سياسة الخصوصية، يرجى التواصل معنا:
                </p>
                <div className="mt-4 bg-gray-50 rounded-xl p-4">
                  <p><strong>البريد الإلكتروني:</strong> privacy@hadaya.com</p>
                  <p><strong>الهاتف:</strong> +20 10 123 4567</p>
                  <p><strong>العنوان:</strong> القاهرة، مصر</p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default PrivacyPage
