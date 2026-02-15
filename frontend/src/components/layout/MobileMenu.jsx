import { Link } from 'react-router-dom'
import { FiX, FiUser, FiMapPin, FiPhone, FiSettings } from 'react-icons/fi'
import { useUIStore, useAuthStore } from '../../store'

const MobileMenu = () => {
  const { closeMobileMenu } = useUIStore()
  const { isAuthenticated, user } = useAuthStore()
  const isAdmin = user?.role === 'admin'

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

  const occasions = [
    { name: 'عيد ميلاد', value: 'عيد ميلاد' },
    { name: 'زفاف', value: 'زفاف' },
    { name: 'عيد الحب', value: 'عيد الحب' },
    { name: 'عيد الأم', value: 'عيد الأم' },
    { name: 'تخرج', value: 'تخرج' },
    { name: 'مولود جديد', value: 'ولادة' },
  ]

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={closeMobileMenu}
      />
      
      {/* Menu Panel */}
      <div className="absolute top-0 right-0 h-full w-80 max-w-full bg-white shadow-xl overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <img 
            src="/images/logo.jpeg" 
            alt="For You Gift Shop" 
            className="h-20 w-auto object-contain"
          />
          <button 
            onClick={closeMobileMenu}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Account Section */}
        <div className="p-4 bg-gray-50 border-b">
          <Link 
            to="/account"
            onClick={closeMobileMenu}
            className="flex items-center gap-3 text-gray-700"
          >
            <div className="w-10 h-10 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
              <FiUser className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600" size={20} />
            </div>
            <div>
              {isAuthenticated ? (
                <span className="font-medium">حسابي</span>
              ) : (
                <>
                  <span className="font-medium">تسجيل الدخول</span>
                  <p className="text-sm text-gray-500">أو إنشاء حساب جديد</p>
                </>
              )}
            </div>
          </Link>
        </div>

        {/* Admin Panel Link - Only for admins */}
        {isAdmin && (
          <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-b">
            <Link 
              to="/admin"
              onClick={closeMobileMenu}
              className="flex items-center gap-3 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600"
            >
              <div className="w-10 h-10 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                <FiSettings className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600" size={20} />
              </div>
              <div>
                <span className="font-bold">لوحة التحكم</span>
                <p className="text-sm text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">إدارة الموقع</p>
              </div>
            </Link>
          </div>
        )}

        {/* Gift Finder */}
        <div className="p-4 border-b">
          <Link 
            to="/gift-finder"
            onClick={closeMobileMenu}
            className="flex items-center gap-3 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 text-white p-4 rounded-xl"
          >
            <span className="text-2xl">🎯</span>
            <div>
              <span className="font-bold">اعثر على الهدية المثالية</span>
              <p className="text-sm text-purple-100">دعنا نساعدك في الاختيار</p>
            </div>
          </Link>
        </div>

        {/* Categories */}
        <div className="p-4 border-b">
          <h3 className="font-bold text-gray-800 mb-3">التصنيفات</h3>
          <ul className="space-y-2">
            {categories.map((category) => (
              <li key={category.slug}>
                <Link 
                  to={`/products${category.slug ? `/${category.slug}` : ''}`}
                  onClick={closeMobileMenu}
                  className="block py-2 text-gray-600 hover:text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 transition-colors"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Shop by Occasion */}
        <div className="p-4 border-b">
          <h3 className="font-bold text-gray-800 mb-3">تسوق حسب المناسبة</h3>
          <div className="flex flex-wrap gap-2">
            {occasions.map((occasion) => (
              <Link 
                key={occasion.value}
                to={`/products?occasion=${occasion.value}`}
                onClick={closeMobileMenu}
                className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700 hover:bg-gradient-to-r from-purple-100 to-pink-100 hover:text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 transition-colors"
              >
                {occasion.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="p-4 border-b">
          <h3 className="font-bold text-gray-800 mb-3">روابط سريعة</h3>
          <ul className="space-y-2">
            <li>
              <Link 
                to="/track-order"
                onClick={closeMobileMenu}
                className="block py-2 text-gray-600 hover:text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600"
              >
                تتبع طلبك
              </Link>
            </li>
            <li>
              <Link 
                to="/stores"
                onClick={closeMobileMenu}
                className="block py-2 text-gray-600 hover:text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600"
              >
                فروعنا
              </Link>
            </li>
            <li>
              <Link 
                to="/faq"
                onClick={closeMobileMenu}
                className="block py-2 text-gray-600 hover:text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600"
              >
                الأسئلة الشائعة
              </Link>
            </li>
            <li>
              <Link 
                to="/contact"
                onClick={closeMobileMenu}
                className="block py-2 text-gray-600 hover:text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600"
              >
                اتصل بنا
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact Info */}
        <div className="p-4">
          <h3 className="font-bold text-gray-800 mb-3">تواصل معنا</h3>
          <div className="space-y-3 text-gray-600">
            <a href="tel:+201000000000" className="flex items-center gap-3">
              <FiPhone className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600" />
              <span dir="ltr">+20 100 000 0000</span>
            </a>
            <div className="flex items-start gap-3">
              <FiMapPin className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mt-1" />
              <span>القاهرة، مصر</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MobileMenu
