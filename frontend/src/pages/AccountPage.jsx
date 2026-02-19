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
        toast.success('?? ????? ?????? ?????')
      } else {
        if (formData.password !== formData.confirmPassword) {
          toast.error('????? ?????? ??? ?????????')
          return
        }
        const res = await authAPI.register(formData)
        setAuth(res.data.data.user, res.data.data.token)
        toast.success('?? ????? ?????? ?????')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || '??? ???')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container-custom">
        <div className="max-w-md mx-auto bg-white rounded-2xl p-8 shadow-lg">
          <h1 className="text-2xl font-bold text-center mb-8">
            {isLogin ? '????? ??????' : '????? ???? ????'}
          </h1>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="????? ?????"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    required
                    className="input-field"
                  />
                  <input
                    type="text"
                    placeholder="????? ??????"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    required
                    className="input-field"
                  />
                </div>
                <input
                  type="tel"
                  placeholder="??? ??????"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  required
                  className="input-field"
                />
              </>
            )}
            <input
              type="email"
              placeholder="?????? ??????????"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
              className="input-field"
            />
            <input
              type="password"
              placeholder="???? ??????"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
              className="input-field"
            />
            {!isLogin && (
              <input
                type="password"
                placeholder="????? ???? ??????"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                required
                className="input-field"
              />
            )}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? '????...' : isLogin ? '????? ??????' : '????? ????'}
            </button>
          </form>
          
          <p className="text-center mt-6 text-gray-600">
            {isLogin ? '??? ???? ?????' : '???? ???? ???????'}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 hover:underline mr-2"
            >
              {isLogin ? '??? ????' : '??? ?????'}
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
    { path: '/account', icon: FiUser, label: '?????', exact: true },
    { path: '/account/orders', icon: FiPackage, label: '??????' },
    { path: '/account/wishlist', icon: FiHeart, label: '????? ????????' },
    { path: '/account/addresses', icon: FiMapPin, label: '???????' },
    { path: '/account/settings', icon: FiSettings, label: '?????????' },
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
                        ? 'bg-gradient-to-r from-purple-50 to-pink-50 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600'
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
                  ????? ??????
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
      <h1 className="text-2xl font-bold mb-6">?????? {user?.firstName}!</h1>
      <div className="grid md:grid-cols-3 gap-4">
        <Link to="/account/orders" className="p-6 bg-gray-50 rounded-xl hover:bg-gray-100">
          <FiPackage className="text-3xl text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-2" />
          <h3 className="font-medium">??????</h3>
          <p className="text-sm text-gray-500">???? ?????? ??????</p>
        </Link>
        <Link to="/wishlist" className="p-6 bg-gray-50 rounded-xl hover:bg-gray-100">
          <FiHeart className="text-3xl text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-2" />
          <h3 className="font-medium">????? ????????</h3>
          <p className="text-sm text-gray-500">??????? ???????</p>
        </Link>
        <Link to="/account/settings" className="p-6 bg-gray-50 rounded-xl hover:bg-gray-100">
          <FiSettings className="text-3xl text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-2" />
          <h3 className="font-medium">?????????</h3>
          <p className="text-sm text-gray-500">????? ???????</p>
        </Link>
      </div>
    </div>
  )
}

const OrdersPage = () => (
  <div>
    <h1 className="text-2xl font-bold mb-6">??????</h1>
    <p className="text-gray-500">?? ???? ????? ???</p>
  </div>
)

const AddressesPage = () => (
  <div>
    <h1 className="text-2xl font-bold mb-6">???????</h1>
    <p className="text-gray-500">?? ???? ?????? ??????</p>
  </div>
)

const SettingsPage = () => (
  <div>
    <h1 className="text-2xl font-bold mb-6">?????????</h1>
    <p className="text-gray-500">??????? ??????</p>
  </div>
)

// Main Account Page
const AccountPage = () => {
  const { isAuthenticated } = useAuthStore()

  return (
    <>
      <Helmet>
        <title>????? | For You</title>
      </Helmet>
      {isAuthenticated ? <Dashboard /> : <AuthForm />}
    </>
  )
}

export default AccountPage

