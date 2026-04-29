import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FiX, FiUser, FiMapPin, FiPhone, FiSettings, FiChevronLeft } from 'react-icons/fi'
import { useUIStore, useAuthStore } from '../../store'
import { occasionsAPI } from '../../services/api'

const MobileMenu = () => {
  const { closeMobileMenu } = useUIStore()
  const { isAuthenticated, user } = useAuthStore()
  const isAdmin = user?.role === 'admin'

  const { data: occasions } = useQuery({
    queryKey: ['occasions'],
    queryFn: () => occasionsAPI.getAll().then(res => res.data.data)
  })

  const categories = [
    { name: 'جميع المنتجات', slug: '' },
    { name: 'هدايا عيد الميلاد', slug: 'birthday-gifts' },
    { name: 'هدايا الزفاف', slug: 'wedding-gifts' },
    { name: 'باقات الورد', slug: 'flower-bouquets' },
    { name: 'الشوكولاتة والحلويات', slug: 'chocolates-sweets' },
    { name: 'العطور', slug: 'perfumes' },
    { name: 'الساعات والإكسسوارات', slug: 'watches-accessories' },
    { name: 'هدايا شخصية', slug: 'personalized-gifts' },
    { name: 'هدايا الأطفال', slug: 'kids-gifts' },
    { name: 'المنزل والديكور', slug: 'home-decor' },
    { name: 'كروت هدايا', slug: 'gift-cards' },
  ]

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm overlay-backdrop"
        onClick={closeMobileMenu}
      />
      
      {/* Menu Panel */}
      <div className="absolute top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl overflow-y-auto panel-slide-right">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-l from-purple-50/50 to-white">
          <img 
            src="/images/logo.jpeg" 
            alt="For You Gift Shop" 
            className="h-16 w-auto object-contain"
          />
          <button 
            onClick={closeMobileMenu}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <FiX size={22} />
          </button>
        </div>

        {/* Account Section */}
        <div className="p-4 border-b border-gray-100">
          <Link 
            to="/account"
            onClick={closeMobileMenu}
            className="flex items-center gap-3 text-gray-700 p-3 rounded-2xl hover:bg-purple-50 transition-colors"
          >
            <div className="w-11 h-11 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
              <FiUser className="text-white" size={18} />
            </div>
            <div className="flex-1">
              {isAuthenticated ? (
                <>
                  <span className="font-bold text-gray-800">حسابي</span>
                  <p className="text-xs text-gray-400">إدارة الحساب والطلبات</p>
                </>
              ) : (
                <>
                  <span className="font-bold text-gray-800">تسجيل الدخول</span>
                  <p className="text-xs text-gray-400">أو إنشاء حساب جديد</p>
                </>
              )}
            </div>
            <FiChevronLeft size={16} className="text-gray-400" />
          </Link>
        </div>

        {/* Admin Panel Link - Only for admins */}
        {isAdmin && (
          <div className="px-4 pt-4">
            <Link 
              to="/admin"
              onClick={closeMobileMenu}
              className="flex items-center gap-3 bg-gradient-to-l from-purple-50 to-pink-50 p-4 rounded-2xl border border-purple-100"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-fuchsia-500 rounded-xl flex items-center justify-center shadow-md shadow-purple-500/20">
                <FiSettings className="text-white" size={16} />
              </div>
              <div>
                <span className="font-bold text-purple-700">لوحة التحكم</span>
                <p className="text-xs text-purple-400">إدارة الموقع</p>
              </div>
            </Link>
          </div>
        )}

        {/* Gift Finder */}
        <div className="p-4">
          <Link 
            to="/gift-finder"
            onClick={closeMobileMenu}
            className="flex items-center gap-3 bg-gradient-to-l from-purple-500 via-fuchsia-500 to-pink-500 text-white p-4 rounded-2xl shadow-lg shadow-purple-500/20 hover:shadow-xl transition-all"
          >
            <span className="text-2xl">🎯</span>
            <div>
              <span className="font-bold">اعثر على الهدية المثالية</span>
              <p className="text-sm text-white/70">دعنا نساعدك في الاختيار</p>
            </div>
          </Link>
        </div>

        {/* Categories */}
        <div className="px-4 pb-4">
          <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wider text-gray-400">التصنيفات</h3>
          <ul className="space-y-0.5">
            {categories.map((category) => (
              <li key={category.slug}>
                <Link 
                  to={`/products?category=${category.slug}`}
                  onClick={closeMobileMenu}
                  className="flex items-center justify-between py-2.5 px-3 text-gray-600 hover:text-purple-700 hover:bg-purple-50 rounded-xl transition-all group"
                >
                  <span className="text-sm">{category.name}</span>
                  <FiChevronLeft size={14} className="text-gray-300 group-hover:text-purple-400 transition-colors" />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Shop by Occasion */}
        {occasions?.length > 0 && (
          <div className="px-4 pb-4 border-t border-gray-100 pt-4">
            <h3 className="font-bold text-sm uppercase tracking-wider text-gray-400 mb-3">تسوق حسب المناسبة</h3>
            <div className="flex flex-wrap gap-2">
              {occasions?.map((occasion) => (
                <Link 
                  key={occasion._id}
                  to={`/products?occasion=${encodeURIComponent(occasion.name)}`}
                  onClick={closeMobileMenu}
                  className="px-3 py-1.5 bg-purple-50 rounded-full text-sm text-purple-600 hover:bg-purple-100 hover:text-purple-700 transition-colors"
                >
                  {occasion.icon} {occasion.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="px-4 pb-4 border-t border-gray-100 pt-4">
          <h3 className="font-bold text-sm uppercase tracking-wider text-gray-400 mb-3">روابط سريعة</h3>
          <ul className="space-y-0.5">
            {[
              { to: '/track-order', label: 'تتبع طلبك', icon: '📦' },
              { to: '/stores', label: 'متجرنا', icon: '🏪' },
              { to: '/faq', label: 'الأسئلة الشائعة', icon: '❓' },
              { to: '/contact', label: 'اتصل بنا', icon: '💬' },
            ].map((link) => (
              <li key={link.to}>
                <Link 
                  to={link.to}
                  onClick={closeMobileMenu}
                  className="flex items-center gap-3 py-2.5 px-3 text-gray-600 hover:text-purple-700 hover:bg-purple-50 rounded-xl transition-all text-sm"
                >
                  <span>{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact Info */}
        <div className="p-4 bg-gray-50 border-t border-gray-100">
          <div className="space-y-3 text-gray-500 text-sm">
            <a href="tel:+201286153004" className="flex items-center gap-3 hover:text-purple-600 transition-colors">
              <FiPhone className="text-purple-400" size={16} />
              <span dir="ltr">+20 12 86153004</span>
            </a>
            <div className="flex items-start gap-3">
              <FiMapPin className="text-purple-400 mt-0.5" size={16} />
              <span>القاهرة، مصر</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MobileMenu
