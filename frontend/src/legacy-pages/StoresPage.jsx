import { FiGlobe, FiTruck, FiShield, FiClock, FiPackage, FiHeart } from 'react-icons/fi'
import { FaWhatsapp, FaInstagram, FaFacebookF, FaTiktok } from 'react-icons/fa'
import Link from 'next/link'

const features = [
  {
    icon: FiGlobe,
    title: 'متجر أونلاين',
    description: 'تسوق من أي مكان في مصر على مدار الساعة',
  },
  {
    icon: FiTruck,
    title: 'توصيل لباب البيت',
    description: 'نوصّل لكل محافظات مصر بسرعة وأمان',
  },
  {
    icon: FiShield,
    title: 'دفع آمن',
    description: 'كاش عند الاستلام وإنستاباي',
  },
  {
    icon: FiClock,
    title: 'متاحين دايمًا',
    description: 'اطلب في أي وقت وفريقنا هيتابع طلبك',
  },
  {
    icon: FiPackage,
    title: 'تغليف مميز',
    description: 'كل هدية بتتغلف بعناية عشان توصل بأحلى شكل',
  },
  {
    icon: FiHeart,
    title: 'هدايا لكل مناسبة',
    description: 'أعياد ميلاد، زواج، تخرج، خطوبة، مواليد وأكتر',
  },
]

const socialLinks = [
  { icon: FaInstagram, name: 'Instagram', href: 'https://instagram.com/foryoegypt' },
  { icon: FaFacebookF, name: 'Facebook', href: 'https://facebook.com/foryoegypt' },
  { icon: FaTiktok, name: 'TikTok', href: 'https://tiktok.com/@foryoegypt' },
]

const StoresPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white py-16">
        <div className="container-custom text-center">
          <FiGlobe className="text-5xl mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-4">متجرنا أونلاين</h1>
          <p className="text-xl opacity-90">فور يو متجر إلكتروني بالكامل — نوصّلك هديتك لحد باب بيتك في أي مكان في مصر</p>
        </div>
      </div>

      <div className="container-custom py-12">
        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature) => (
            <div key={feature.title} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow text-center">
              <feature.icon className="text-4xl mx-auto mb-4 text-purple-600" />
              <h2 className="text-xl font-bold mb-2">{feature.title}</h2>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="bg-white rounded-2xl p-8 mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">إزاي تطلب؟</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: '١', title: 'اختار هديتك', desc: 'تصفح المنتجات واختار الهدية المناسبة' },
              { step: '٢', title: 'اطلب أونلاين', desc: 'أضف للسلة واختار طريقة الدفع المناسبة' },
              { step: '٣', title: 'استلم لحد البيت', desc: 'هنوصّلك الهدية مغلفة وجاهزة' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Social & Contact */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 text-center mb-16">
          <h2 className="text-2xl font-bold mb-2">تابعنا على السوشيال ميديا</h2>
          <p className="text-gray-600 mb-6">تابعنا عشان تشوف أحدث المنتجات والعروض</p>
          <div className="flex justify-center gap-4 mb-6">
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full bg-white shadow-sm hover:shadow-md flex items-center justify-center text-purple-600 hover:text-pink-600 transition-all"
                aria-label={social.name}
              >
                <social.icon className="text-xl" />
              </a>
            ))}
          </div>
          <a
            href="https://wa.me/966501234567"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-full font-medium transition-colors"
          >
            <FaWhatsapp className="text-xl" />
            تواصل معنا على واتساب
          </a>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">جاهز تختار هديتك؟</h2>
          <p className="text-gray-600 mb-6">اكتشف مجموعتنا المميزة من الهدايا لكل المناسبات</p>
          <Link href="/products" className="btn-primary inline-block">تسوق الآن</Link>
        </div>
      </div>
    </div>
  )
}

export default StoresPage
