import { useState, useEffect, useRef } from 'react'
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom'
import { FiUser, FiPackage, FiHeart, FiMapPin, FiSettings, FiLogOut, FiArrowRight, FiMail, FiLock } from 'react-icons/fi'
import { useAuthStore } from '../store'
import { authAPI } from '../services/api'
import toast from 'react-hot-toast'

// Login/Register Component
const AuthForm = () => {
  // Modes: 'login' | 'register' | 'verify-email' | 'forgot-password' | 'verify-reset' | 'reset-password'
  const [mode, setMode] = useState('login')
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: ''
  })
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', ''])
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const [verifyEmail, setVerifyEmail] = useState('') // email used for verification
  const inputRefs = useRef([])

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  const resetCodeInputs = () => {
    setVerificationCode(['', '', '', '', '', ''])
    setTimeout(() => inputRefs.current[0]?.focus(), 100)
  }

  const handleCodeChange = (index, value) => {
    if (!/^\d*$/.test(value)) return
    const newCode = [...verificationCode]
    newCode[index] = value.slice(-1)
    setVerificationCode(newCode)
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleCodeKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleCodePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setVerificationCode(pasted.split(''))
      inputRefs.current[5]?.focus()
    }
  }

  const getCodeString = () => verificationCode.join('')

  // Login handler
  const handleLogin = async () => {
    try {
      const res = await authAPI.login({ email: formData.email, password: formData.password })
      setAuth(res.data.data.user, res.data.data.token)
      toast.success('تم تسجيل الدخول بنجاح')
    } catch (error) {
      const responseData = error.response?.data
      if (responseData?.data?.requiresVerification) {
        setVerifyEmail(formData.email)
        resetCodeInputs()
        setMode('verify-email')
        setResendCooldown(60)
        toast('حسابك غير مُفعّل. تم إرسال كود التفعيل', { icon: '📧' })
      } else {
        toast.error(responseData?.message || 'حدث خطأ في تسجيل الدخول')
      }
    }
  }

  // Register handler
  const handleRegister = async () => {
    if (formData.password !== formData.confirmPassword) {
      toast.error('كلمتا المرور غير متطابقتين')
      return
    }
    if (formData.password.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
      return
    }
    try {
      await authAPI.register(formData)
      setVerifyEmail(formData.email)
      resetCodeInputs()
      setMode('verify-email')
      setResendCooldown(60)
      toast.success('تم إرسال كود التفعيل إلى بريدك الإلكتروني')
    } catch (error) {
      toast.error(error.response?.data?.message || 'حدث خطأ في التسجيل')
    }
  }

  // Verify email handler
  const handleVerifyEmail = async () => {
    const code = getCodeString()
    if (code.length !== 6) {
      toast.error('أدخل الكود المكوّن من 6 أرقام')
      return
    }
    try {
      const res = await authAPI.verifyEmail({ email: verifyEmail, code })
      setAuth(res.data.data.user, res.data.data.token)
      toast.success('تم تفعيل حسابك بنجاح!')
    } catch (error) {
      toast.error(error.response?.data?.message || 'الكود غير صحيح')
    }
  }

  // Resend code handler
  const handleResendCode = async () => {
    if (resendCooldown > 0) return
    try {
      if (mode === 'verify-reset') {
        await authAPI.forgotPassword({ email: verifyEmail })
      } else {
        await authAPI.resendCode({ email: verifyEmail })
      }
      setResendCooldown(60)
      resetCodeInputs()
      toast.success('تم إرسال كود جديد')
    } catch (error) {
      toast.error(error.response?.data?.message || 'حدث خطأ')
    }
  }

  // Forgot password handler
  const handleForgotPassword = async () => {
    if (!formData.email) {
      toast.error('أدخل بريدك الإلكتروني')
      return
    }
    try {
      await authAPI.forgotPassword({ email: formData.email })
      setVerifyEmail(formData.email)
      resetCodeInputs()
      setMode('verify-reset')
      setResendCooldown(60)
      toast.success('تم إرسال كود إعادة التعيين إلى بريدك الإلكتروني')
    } catch (error) {
      toast.error(error.response?.data?.message || 'حدث خطأ')
    }
  }

  // Verify reset code handler
  const handleVerifyResetCode = async () => {
    const code = getCodeString()
    if (code.length !== 6) {
      toast.error('أدخل الكود المكوّن من 6 أرقام')
      return
    }
    try {
      await authAPI.verifyResetCode({ email: verifyEmail, code })
      setMode('reset-password')
      toast.success('الكود صحيح. أدخل كلمة المرور الجديدة')
    } catch (error) {
      toast.error(error.response?.data?.message || 'الكود غير صحيح')
    }
  }

  // Reset password handler
  const handleResetPassword = async () => {
    if (newPassword.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
      return
    }
    if (newPassword !== confirmNewPassword) {
      toast.error('كلمتا المرور غير متطابقتين')
      return
    }
    try {
      await authAPI.resetPassword({ email: verifyEmail, code: getCodeString(), newPassword })
      toast.success('تم تغيير كلمة المرور بنجاح!')
      setMode('login')
      setFormData(prev => ({ ...prev, password: '' }))
      setNewPassword('')
      setConfirmNewPassword('')
    } catch (error) {
      toast.error(error.response?.data?.message || 'حدث خطأ')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      switch (mode) {
        case 'login': await handleLogin(); break
        case 'register': await handleRegister(); break
        case 'verify-email': await handleVerifyEmail(); break
        case 'forgot-password': await handleForgotPassword(); break
        case 'verify-reset': await handleVerifyResetCode(); break
        case 'reset-password': await handleResetPassword(); break
      }
    } finally {
      setLoading(false)
    }
  }

  const goBack = () => {
    if (mode === 'verify-email') setMode('login')
    else if (mode === 'forgot-password') setMode('login')
    else if (mode === 'verify-reset') setMode('forgot-password')
    else if (mode === 'reset-password') setMode('verify-reset')
  }

  // Title based on mode
  const titles = {
    'login': 'تسجيل الدخول',
    'register': 'إنشاء حساب جديد',
    'verify-email': 'تفعيل الحساب',
    'forgot-password': 'نسيت كلمة المرور',
    'verify-reset': 'إدخال كود التحقق',
    'reset-password': 'كلمة مرور جديدة',
  }

  // Code input rendered inline (not as a component to prevent remounting)

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container-custom">
        <div className="max-w-md mx-auto bg-white rounded-2xl p-8 shadow-lg">
          {/* Back button */}
          {mode !== 'login' && mode !== 'register' && (
            <button onClick={goBack} className="flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-4 text-sm">
              <FiArrowRight className="text-lg" />
              رجوع
            </button>
          )}

          {/* Title & Icon */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
              {(mode === 'verify-email' || mode === 'verify-reset') ? (
                <FiMail className="text-2xl text-purple-600" />
              ) : mode === 'reset-password' ? (
                <FiLock className="text-2xl text-purple-600" />
              ) : (
                <FiUser className="text-2xl text-purple-600" />
              )}
            </div>
            <h1 className="text-2xl font-bold">{titles[mode]}</h1>
            {(mode === 'verify-email' || mode === 'verify-reset') && (
              <p className="text-gray-500 text-sm mt-2">
                تم إرسال كود مكوّن من 6 أرقام إلى<br />
                <span className="text-gray-800 font-medium" dir="ltr">{verifyEmail}</span>
              </p>
            )}
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Register fields */}
            {mode === 'register' && (
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

            {/* Login/Register common fields */}
            {(mode === 'login' || mode === 'register') && (
              <>
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
              </>
            )}

            {/* Register confirm password */}
            {mode === 'register' && (
              <input
                type="password"
                placeholder="تأكيد كلمة المرور"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                required
                className="input-field"
              />
            )}

            {/* Forgot password link (on login page) */}
            {mode === 'login' && (
              <div className="text-left">
                <button
                  type="button"
                  onClick={() => setMode('forgot-password')}
                  className="text-sm text-purple-600 hover:text-purple-800 hover:underline"
                >
                  نسيت كلمة المرور؟
                </button>
              </div>
            )}

            {/* Forgot password - email input */}
            {mode === 'forgot-password' && (
              <input
                type="email"
                placeholder="أدخل بريدك الإلكتروني"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
                className="input-field"
              />
            )}

            {/* Verification code inputs */}
            {(mode === 'verify-email' || mode === 'verify-reset') && (
              <>
                <div className="flex justify-center gap-2 my-6" dir="ltr">
                  {verificationCode.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => inputRefs.current[i] = el}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleCodeChange(i, e.target.value)}
                      onKeyDown={e => handleCodeKeyDown(i, e)}
                      onPaste={i === 0 ? handleCodePaste : undefined}
                      autoFocus={i === 0}
                      className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                    />
                  ))}
                </div>
                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={resendCooldown > 0}
                    className={`text-sm ${resendCooldown > 0 ? 'text-gray-400' : 'text-purple-600 hover:text-purple-800 hover:underline'}`}
                  >
                    {resendCooldown > 0 ? `إعادة الإرسال بعد ${resendCooldown} ثانية` : 'إعادة إرسال الكود'}
                  </button>
                </div>
              </>
            )}

            {/* Reset password fields */}
            {mode === 'reset-password' && (
              <>
                <input
                  type="password"
                  placeholder="كلمة المرور الجديدة"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="input-field"
                />
                <input
                  type="password"
                  placeholder="تأكيد كلمة المرور الجديدة"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="input-field"
                />
              </>
            )}

            {/* Submit button */}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  جاري...
                </span>
              ) : {
                'login': 'تسجيل الدخول',
                'register': 'إنشاء حساب',
                'verify-email': 'تفعيل الحساب',
                'forgot-password': 'إرسال كود التحقق',
                'verify-reset': 'تحقق',
                'reset-password': 'تغيير كلمة المرور',
              }[mode]}
            </button>
          </form>
          
          {/* Toggle login/register */}
          {(mode === 'login' || mode === 'register') && (
            <p className="text-center mt-6 text-gray-600">
              {mode === 'login' ? 'ليس لديك حساب؟' : 'لديك حساب بالفعل؟'}
              <button 
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 hover:underline mr-2"
              >
                {mode === 'login' ? 'سجل الآن' : 'سجل دخولك'}
              </button>
            </p>
          )}
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
                  <FiUser className="text-purple-600 text-3xl" />
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
          <FiPackage className="text-3xl text-purple-600 mb-2" />
          <h3 className="font-medium">طلباتي</h3>
          <p className="text-sm text-gray-500">تتبع وإدارة طلباتك</p>
        </Link>
        <Link to="/wishlist" className="p-6 bg-gray-50 rounded-xl hover:bg-gray-100">
          <FiHeart className="text-3xl text-purple-600 mb-2" />
          <h3 className="font-medium">قائمة الأمنيات</h3>
          <p className="text-sm text-gray-500">منتجاتك المفضلة</p>
        </Link>
        <Link to="/account/settings" className="p-6 bg-gray-50 rounded-xl hover:bg-gray-100">
          <FiSettings className="text-3xl text-purple-600 mb-2" />
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
                <div className="break-all">
                  <span className="font-bold">رقم الطلب:</span> <span className="text-sm">{order.orderNumber || order._id}</span>
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
              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
                {order.items.map(item => (
                  <div key={item.product} className="flex items-center gap-2 border rounded p-2 bg-white w-full sm:w-auto">
                    {item.image && <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{item.name}</div>
                      <div className="text-sm text-gray-500">الكمية: {item.quantity}</div>
                    </div>
                    <Link
                      to={`/product/${item.slug || item.product}?tab=reviews`}
                      className="btn-primary text-sm flex-shrink-0"
                    >
                      تقييم
                    </Link>
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
      {isAuthenticated ? <Dashboard /> : <AuthForm />}
    </>
  )
}

export default AccountPage
