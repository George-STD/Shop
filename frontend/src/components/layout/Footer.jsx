import { Link } from 'react-router-dom'
import { FiFacebook, FiInstagram, FiTwitter, FiYoutube, FiMail, FiPhone, FiMapPin } from 'react-icons/fi'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Newsletter Section */}
      <div className="bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 py-12">
        <div className="container-custom text-center">
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
            اشترك في نشرتنا البريدية
          </h3>
          <p className="text-purple-100 mb-6">
            احصل على أحدث العروض والخصومات مباشرة في بريدك الإلكتروني
          </p>
          <form className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
            <input
              type="email"
              placeholder="البريد الإلكتروني"
              className="flex-1 px-6 py-3 rounded-full text-gray-800 focus:outline-none focus:ring-2 focus:ring-white"
            />
            <button 
              type="submit"
              className="bg-white text-purple-600 px-8 py-3 rounded-full font-medium hover:bg-gray-100 transition-colors"
            >
              اشترك الآن
            </button>
          </form>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <img 
              src="/images/logo.jpeg" 
              alt="For You Gift Shop" 
              className="h-32 w-auto mb-4 bg-white rounded-xl p-3 object-contain"
            />
            <p className="text-gray-400 mb-4 leading-relaxed">
              متجرك الأول للهدايا في مصر. نقدم لك أفضل تشكيلة من الهدايا لجميع المناسبات مع توصيل سريع لباب بيتك.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 transition-colors">
                <FiFacebook size={18} />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 transition-colors">
                <FiInstagram size={18} />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 transition-colors">
                <FiTwitter size={18} />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 transition-colors">
                <FiYoutube size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-bold text-white mb-4">روابط سريعة</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/about" className="hover:text-pink-400 transition-colors">من نحن</Link>
              </li>
              <li>
                <Link to="/products" className="hover:text-pink-400 transition-colors">جميع المنتجات</Link>
              </li>
              <li>
                <Link to="/gift-finder" className="hover:text-pink-400 transition-colors">اعثر على الهدية المثالية</Link>
              </li>
              <li>
                <Link to="/stores" className="hover:text-pink-400 transition-colors">فروعنا</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-pink-400 transition-colors">اتصل بنا</Link>
              </li>
            </ul>
          </div>

          {/* Help & Support */}
          <div>
            <h4 className="text-lg font-bold text-white mb-4">المساعدة والدعم</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/faq" className="hover:text-pink-400 transition-colors">الأسئلة الشائعة</Link>
              </li>
              <li>
                <Link to="/shipping" className="hover:text-pink-400 transition-colors">الشحن والتوصيل</Link>
              </li>
              <li>
                <Link to="/returns" className="hover:text-pink-400 transition-colors">سياسة الإرجاع</Link>
              </li>
              <li>
                <Link to="/track-order" className="hover:text-pink-400 transition-colors">تتبع طلبك</Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-pink-400 transition-colors">سياسة الخصوصية</Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-pink-400 transition-colors">الشروط والأحكام</Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-bold text-white mb-4">تواصل معنا</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <FiMapPin className="mt-1 flex-shrink-0 text-pink-400" size={18} />
                <span>القاهرة، مصر<br />شارع النصر، المعادي</span>
              </li>
              <li className="flex items-center gap-3">
                <FiPhone className="flex-shrink-0 text-pink-400" size={18} />
                <span dir="ltr">+20 100 000 0000</span>
              </li>
              <li className="flex items-center gap-3">
                <FiMail className="flex-shrink-0 text-pink-400" size={18} />
                <span>info@hadaya.com</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="border-t border-gray-800">
        <div className="container-custom py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-400 text-sm">طرق الدفع المتاحة:</p>
            <div className="flex items-center gap-4">
              <img src="/images/payments/visa.svg" alt="Visa" className="h-8" />
              <img src="/images/payments/mastercard.svg" alt="Mastercard" className="h-8" />
              <img src="/images/payments/cash.svg" alt="Cash on Delivery" className="h-8" />
              <img src="/images/payments/instapay.svg" alt="InstaPay" className="h-8" />
              <img src="/images/payments/vodafone-cash.svg" alt="Vodafone Cash" className="h-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-gray-800">
        <div className="container-custom py-4">
          <p className="text-center text-gray-500 text-sm">
            © {currentYear} For You Gift Shop. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
