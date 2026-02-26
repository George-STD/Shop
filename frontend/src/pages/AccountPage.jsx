import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom'
import { FiUser, FiPackage, FiHeart, FiMapPin, FiSettings, FiLogOut } from 'react-icons/fi'
import { useAuthStore } from '../store'
import { authAPI } from '../services/api'
import toast from 'react-hot-toast'

// Login/Register Component
const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (isLogin) {
        const res = await authAPI.login({ email: formData.email, password: formData.password })
        setAuth(res.data.data.user, res.data.data.token)
        toast.success('تم تسجيل الدخول بنجاح')
      } else {
        if (formData.password !== formData.confirmPassword) {
          toast.error('كلمتا المرور غير متطابقتين')
          return
        }
        const res = await authAPI.register(formData)
        setAuth(res.data.data.user, res.data.data.token)
        toast.success('تم إنشاء الحساب بنجاح')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'حدث خطأ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container-custom">
        <div className="max-w-md mx-auto bg-white rounded-2xl p-8 shadow-lg">
          <h1 className="text-2xl font-bold text-center mb-8">
            {isLogin ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
          </h1>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="الاسم الأول"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    required
                    className="input-field"
                  />
                  <input
                    type="text"
                    placeholder="الاسم الأخير"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    required
                    className="input-field"
                  />
                </div>
                <input
                  type="tel"
                  placeholder="رقم الهاتف"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  required
                  className="input-field"
                />
              </>
            )}
            <input
              type="email"
              placeholder="البريد الإلكتروني"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
              className="input-field"
            />
            <input
              type="password"
              placeholder="كلمة المرور"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
              className="input-field"
            />
            {!isLogin && (
              <input
                type="password"
                placeholder="تأكيد كلمة المرور"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                required
                className="input-field"
              />
            )}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'جاري...' : isLogin ? 'تسجيل الدخول' : 'إنشاء حساب'}
            </button>
          </form>
          
          <p className="text-center mt-6 text-gray-600">
            {isLogin ? 'ليس لديك حساب؟' : 'لديك حساب بالفعل؟'}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 hover:underline mr-2"
            >
              {isLogin ? 'سجل الآن' : 'سجل دخولك'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

// Dashboard Component
const Dashboard = () => {
  const { user, logout } = useAuthStore()
  const location = useLocation()

  const menuItems = [
    { path: '/account', icon: FiUser, label: 'حسابي', exact: true },
    { path: '/account/orders', icon: FiPackage, label: 'طلباتي' },
    { path: '/account/wishlist', icon: FiHeart, label: 'قائمة الأمنيات' },
    { path: '/account/addresses', icon: FiMapPin, label: 'عناويني' },
    { path: '/account/settings', icon: FiSettings, label: 'الإعدادات' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiUser className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 text-3xl" />
                </div>
                <h2 className="font-bold text-gray-800">{user?.firstName} {user?.lastName}</h2>
                <p className="text-gray-500 text-sm">{user?.email}</p>
              </div>
              
              <nav className="space-y-2">
                {menuItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      (item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path))
                        ? 'bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 text-transparent'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon />
                    {item.label}
                  </Link>
                ))}
                <button
                  onClick={logout}
                  className="flex items-center gap-3 p-3 rounded-lg text-red-500 hover:bg-red-50 w-full"
                >
                  <FiLogOut />
                  تسجيل الخروج
                </button>
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl p-6">
              <Routes>
                <Route index element={<ProfileOverview />} />
                <Route path="orders" element={<OrdersPage />} />
                <Route path="wishlist" element={<Navigate to="/wishlist" />} />
                <Route path="addresses" element={<AddressesPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Routes>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const ProfileOverview = () => {
  const { user } = useAuthStore()
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">مرحباً {user?.firstName}!</h1>
      <div className="grid md:grid-cols-3 gap-4">
        <Link to="/account/orders" className="p-6 bg-gray-50 rounded-xl hover:bg-gray-100">
          <FiPackage className="text-3xl text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-2" />
          <h3 className="font-medium">طلباتي</h3>
          <p className="text-sm text-gray-500">تتبع وإدارة طلباتك</p>
        </Link>
        <Link to="/wishlist" className="p-6 bg-gray-50 rounded-xl hover:bg-gray-100">
          <FiHeart className="text-3xl text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-2" />
          <h3 className="font-medium">قائمة الأمنيات</h3>
          <p className="text-sm text-gray-500">منتجاتك المفضلة</p>
        </Link>
        <Link to="/account/settings" className="p-6 bg-gray-50 rounded-xl hover:bg-gray-100">
          <FiSettings className="text-3xl text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-2" />
          <h3 className="font-medium">الإعدادات</h3>
          <p className="text-sm text-gray-500">تعديل بياناتك</p>
        </Link>
      </div>
    </div>
  )
}

import { useQuery } from '@tanstack/react-query'
import { ordersAPI } from '../services/api'

const OrdersPage = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => ordersAPI.getAll().then(res => res.data.data)
  });
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">طلباتي</h1>
      {isLoading ? (
        <p>جاري التحميل...</p>
      ) : !data || data.length === 0 ? (
        <p className="text-gray-500">لا توجد طلبات بعد</p>
      ) : (
        <div className="space-y-6">
          {data.map(order => (
            <div key={order._id} className="border rounded-xl p-4 bg-gray-50">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
                <div>
                  <span className="font-bold">رقم الطلب:</span> {order._id}
                </div>
                <div>
                  <span className="font-bold">الحالة:</span> {order.statusHistory?.[order.statusHistory.length-1]?.status || '---'}
                </div>
                <div>
                  <span className="font-bold">التاريخ:</span> {new Date(order.createdAt).toLocaleString('ar-EG')}
                </div>
                <div>
                  <span className="font-bold">الإجمالي:</span> {order.total} ج.م
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {order.items.map(item => (
                  <div key={item.product} className="flex items-center gap-2 border rounded p-2 bg-white">
                    {item.image && <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded" />}
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-gray-500">الكمية: {item.quantity}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const AddressesPage = () => (
  <div>
    <h1 className="text-2xl font-bold mb-6">عناويني</h1>
    <p className="text-gray-500">لا توجد عناوين محفوظة</p>
  </div>
)

const SettingsPage = () => (
  <div>
    <h1 className="text-2xl font-bold mb-6">الإعدادات</h1>
    <p className="text-gray-500">إعدادات الحساب</p>
  </div>
)

// Main Account Page
const AccountPage = () => {
  const { isAuthenticated } = useAuthStore()

  return (
    <>
      <Helmet>
        <title>حسابي | For You</title>
      </Helmet>
      {isAuthenticated ? <Dashboard /> : <AuthForm />}
    </>
  )
}

export default AccountPage
