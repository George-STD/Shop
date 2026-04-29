import { Link } from 'react-router-dom'
import { FiFacebook, FiInstagram, FiYoutube, FiMail, FiPhone, FiMapPin, FiHeart } from 'react-icons/fi'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Newsletter Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600"></div>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-[10%] text-6xl">💌</div>
          <div className="absolute bottom-4 left-[15%] text-5xl">✉️</div>
        </div>
        <div className="container-custom py-14 relative z-10">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm text-white/90 font-medium mb-4 border border-white/20">
              <span>📬</span>
              <span>نشرة For You البريدية</span>
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
              كن أول من يعرف عروضنا
            </h3>
            <p className="text-purple-100 mb-8 text-sm sm:text-base">
              احصل على أحدث العروض والخصومات الحصرية مباشرة في بريدك الإلكتروني
            </p>
            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="البريد الإلكتروني"
                className="flex-1 px-5 py-3 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-white/50 bg-white/95 backdrop-blur-sm text-sm"
              />
              <button 
                type="submit"
                className="bg-white text-purple-700 px-6 py-3 rounded-xl font-bold hover:bg-purple-50 transition-all hover:shadow-lg hover:shadow-white/20 hover:-translate-y-0.5 active:translate-y-0 text-sm whitespace-nowrap"
              >
                اشترك الآن ←
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container-custom py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* About */}
          <div>
            <img 
              src="/images/logo.jpeg" 
              alt="For You Gift Shop" 
              className="h-20 sm:h-24 w-auto mb-5 bg-white rounded-2xl p-2.5 sm:p-3 object-contain"
            />
            <p className="text-gray-400 mb-6 leading-relaxed text-sm">
              متجرك الأول للهدايا في مصر. نقدم لك أفضل تشكيلة من الهدايا لجميع المناسبات مع توصيل سريع لباب بيتك.
            </p>
            <div className="flex gap-3">
              <a href="https://www.facebook.com/share/1BzYfakvLp/?mibextid=wwXIfr" className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center hover:bg-gradient-to-br hover:from-purple-500 hover:to-pink-500 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 hover:-translate-y-0.5" target='_blank'>
                <FiFacebook size={16} />
              </a>
              <a href="https://www.instagram.com/foryou._.21?igsh=d3llMHFjdmE3Z25w&utm_source=qr" className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center hover:bg-gradient-to-br hover:from-purple-500 hover:to-pink-500 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 hover:-translate-y-0.5" target='_blank'>
                <FiInstagram size={16} />
              </a>
              <a href="https://youtube.com/@foryou-l1k?si=wL0zO2sHLypUtE-p" className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center hover:bg-gradient-to-br hover:from-purple-500 hover:to-pink-500 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 hover:-translate-y-0.5" target='_blank'>
                <FiYoutube size={16} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold text-white mb-5 uppercase tracking-wider">روابط سريعة</h4>
            <ul className="space-y-3">
              {[
                { to: '/about', label: 'من نحن' },
                { to: '/products', label: 'جميع المنتجات' },
                { to: '/gift-finder', label: 'اعثر على الهدية المثالية' },
                { to: '/stores', label: 'متجرنا' },
                { to: '/contact', label: 'اتصل بنا' },
              ].map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2 group">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help & Support */}
          <div>
            <h4 className="text-sm font-bold text-white mb-5 uppercase tracking-wider">المساعدة والدعم</h4>
            <ul className="space-y-3">
              {[
                { to: '/faq', label: 'الأسئلة الشائعة' },
                { to: '/shipping', label: 'الشحن والتوصيل' },
                { to: '/returns', label: 'سياسة الإرجاع' },
                { to: '/track-order', label: 'تتبع طلبك' },
                { to: '/privacy', label: 'سياسة الخصوصية' },
                { to: '/terms', label: 'الشروط والأحكام' },
              ].map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2 group">
                    <span className="w-1.5 h-1.5 bg-pink-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-sm font-bold text-white mb-5 uppercase tracking-wider">تواصل معنا</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FiMapPin className="text-pink-400" size={14} />
                </div>
                <span className="text-sm">القاهرة، المقطم<br />شارع 9</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FiPhone className="text-pink-400" size={14} />
                </div>
                <span dir="ltr" className="text-sm">+20 12 86153004</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                  <img src="/images/payments/instapay.svg" alt="InstaPay" className="h-4 w-4" />
                </div>
                <span dir="ltr" className="text-sm">Instapay: 01286153004</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                  <img src="/images/whatsapp.png" alt="WhatsApp" className="h-4 w-4" />
                </div>
                <a href="https://wa.me/201286153004" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors text-sm">تواصل واتساب</a>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FiMail className="text-pink-400" size={14} />
                </div>
                <span className="text-sm">support@foryo.me</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="border-t border-gray-800">
        <div className="container-custom py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-xs uppercase tracking-wider">طرق الدفع المتاحة:</p>
            <div className="flex items-center gap-4">
              <img src="/images/payments/cash.svg" alt="Cash on Delivery" className="h-7 opacity-60 hover:opacity-100 transition-opacity" />
              <img src="/images/payments/instapay.svg" alt="InstaPay" className="h-7 opacity-60 hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-gray-800/50">
        <div className="container-custom py-5">
          <p className="text-center text-gray-500 text-xs flex items-center justify-center gap-1">
            © {currentYear} For You Gift Shop. صُنع بـ <FiHeart className="text-pink-500 fill-pink-500" size={12} /> جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
