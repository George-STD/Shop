import { useState } from 'react'
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom'
import { 
  FiHome, FiUsers, FiPackage, FiShoppingCart, FiGrid, 
  FiStar, FiSettings, FiLogOut, FiMenu, FiX, FiChevronLeft
} from 'react-icons/fi'
import { useAuthStore } from '../../store'

const AdminLayout = () => {
  const { user, isAuthenticated, logout } = useAuthStore()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Protect admin routes - redirect if not admin
  if (!isAuthenticated) {
    return <Navigate to="/account" state={{ from: location }} replace />
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  const menuItems = [
    { path: '/admin', icon: FiHome, label: 'لوحة التحكم', exact: true },
    { path: '/admin/users', icon: FiUsers, label: 'المستخدمين' },
    { path: '/admin/products', icon: FiPackage, label: 'المنتجات' },
    { path: '/admin/orders', icon: FiShoppingCart, label: 'الطلبات' },
    { path: '/admin/categories', icon: FiGrid, label: 'الفئات' },
    { path: '/admin/reviews', icon: FiStar, label: 'التقييمات' },
  ]

  const isActive = (path, exact = false) => {
    if (exact) return location.pathname === path
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen bg-gray-100 flex" dir="rtl">
      {/* Sidebar - Desktop */}
      <aside 
        className={`hidden lg:flex flex-col bg-gray-900 text-white transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Logo */}
        <div className="h-14 sm:h-16 flex items-center justify-between px-2 sm:px-4 border-b border-gray-700">
          {sidebarOpen && (
            <Link to="/admin" className="text-xl font-bold text-pink-400">
              لوحة التحكم
            </Link>
          )}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 sm:p-2 hover:bg-gray-700 rounded-lg"
          >
            <FiChevronLeft className={`transform transition-transform ${!sidebarOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-2 sm:py-4">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-2 sm:py-3 mx-1 sm:mx-2 rounded-lg transition-colors ${
                isActive(item.path, item.exact) 
                  ? 'bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 text-white' 
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* User Info */}
        <div className="border-t border-gray-700 p-2 sm:p-4">
          {sidebarOpen ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                {user?.firstName?.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="font-medium text-xs sm:text-base">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs sm:text-sm text-gray-400">مدير</p>
              </div>
            </div>
          ) : null}
          <button
            onClick={logout}
            className={`flex items-center gap-2 sm:gap-3 w-full mt-2 sm:mt-3 px-2 sm:px-3 py-1 sm:py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors ${
              !sidebarOpen ? 'justify-center' : ''
            } text-xs sm:text-base`}
          >
            <FiLogOut className="w-5 h-5" />
            {sidebarOpen && <span>تسجيل الخروج</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside 
        className={`fixed top-0 right-0 h-full w-64 bg-gray-900 text-white z-50 transform transition-transform lg:hidden ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-14 sm:h-16 flex items-center justify-between px-2 sm:px-4 border-b border-gray-700">
          <span className="text-lg sm:text-xl font-bold text-pink-400">لوحة التحكم</span>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-1 sm:p-2 hover:bg-gray-700 rounded-lg"
          >
            <FiX />
          </button>
        </div>

        <nav className="py-2 sm:py-4">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-2 sm:py-3 mx-1 sm:mx-2 rounded-lg transition-colors ${
                isActive(item.path, item.exact) 
                  ? 'bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 text-white' 
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs sm:text-base">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-700 p-2 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              {user?.firstName?.charAt(0)}
            </div>
            <div>
              <p className="font-medium text-xs sm:text-base">{user?.firstName}</p>
              <p className="text-xs sm:text-sm text-gray-400">مدير</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 sm:gap-3 w-full px-2 sm:px-3 py-1 sm:py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg text-xs sm:text-base"
          >
            <FiLogOut className="w-5 h-5" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="h-14 sm:h-16 bg-white shadow-sm flex items-center justify-between px-2 sm:px-4 lg:px-8">
          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-1 sm:p-2 hover:bg-gray-100 rounded-lg"
            >
              <FiMenu className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <h1 className="text-base sm:text-xl font-bold text-gray-800">
              {menuItems.find(item => isActive(item.path, item.exact))?.label || 'لوحة التحكم'}
            </h1>
          </div>
          
          <Link 
            to="/" 
            className="text-xs sm:text-sm text-gray-500 hover:text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 flex items-center gap-1"
          >
            العودة للموقع
            <FiChevronLeft className="transform rotate-180 w-4 h-4 sm:w-5 sm:h-5" />
          </Link>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-2 sm:p-4 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
