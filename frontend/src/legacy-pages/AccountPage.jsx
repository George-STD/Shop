import { useState, useEffect, useRef } from 'react';
import { Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import {
  FiUser,
  FiPackage,
  FiHeart,
  FiMapPin,
  FiSettings,
  FiLogOut,
  FiArrowRight,
  FiMail,
  FiLock,
} from 'react-icons/fi';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { STRINGS } from '../constants';

// Login/Register Component
const AuthForm = () => {
  // Modes: 'login' | 'register' | 'verify-email' | 'forgot-password' | 'verify-reset' | 'reset-password'
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const redirectTo = location.state?.from || null;
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verifyEmail, setVerifyEmail] = useState(''); // email used for verification
  const inputRefs = useRef([]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const resetCodeInputs = () => {
    setVerificationCode(['', '', '', '', '', '']);
    setTimeout(() => inputRefs.current[0]?.focus(), 100);
  };

  const handleCodeChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...verificationCode];
    newCode[index] = value.slice(-1);
    setVerificationCode(newCode);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setVerificationCode(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const getCodeString = () => verificationCode.join('');

  // Login handler
  const handleLogin = async () => {
    try {
      const res = await authAPI.login({ email: formData.email, password: formData.password });
      setAuth(res.data.data.user, res.data.data.token);
      toast.success(STRINGS.AUTH.LOGIN_SUCCESS);
      // Redirect to checkout if came from there
      if (redirectTo) {
        navigate(redirectTo);
      }
    } catch (error) {
      const responseData = error.response?.data;
      if (responseData?.data?.requiresVerification) {
        setVerifyEmail(formData.email);
        resetCodeInputs();
        setMode('verify-email');
        setResendCooldown(60);
        toast(STRINGS.AUTH.ACCOUNT_NOT_VERIFIED, { icon: '📧' });
      } else {
        toast.error(responseData?.message || STRINGS.AUTH.LOGIN_ERROR);
      }
    }
  };

  // Register handler
  const handleRegister = async () => {
    if (formData.password !== formData.confirmPassword) {
      toast.error(STRINGS.AUTH.PASSWORDS_DO_NOT_MATCH);
      return;
    }
    if (formData.password.length < 6) {
      toast.error(STRINGS.AUTH.PASSWORD_LENGTH_ERROR);
      return;
    }
    try {
      await authAPI.register(formData);
      setVerifyEmail(formData.email);
      resetCodeInputs();
      setMode('verify-email');
      setResendCooldown(60);
      toast.success(STRINGS.AUTH.VERIFICATION_SENT);
    } catch (error) {
      toast.error(error.response?.data?.message || STRINGS.AUTH.REGISTER_ERROR);
    }
  };

  // Verify email handler
  const handleVerifyEmail = async () => {
    const code = getCodeString();
    if (code.length !== 6) {
      toast.error(STRINGS.AUTH.ENTER_6_DIGIT_CODE);
      return;
    }
    try {
      const res = await authAPI.verifyEmail({ email: verifyEmail, code });
      setAuth(res.data.data.user, res.data.data.token);
      toast.success(STRINGS.AUTH.VERIFICATION_SUCCESS);
      // Redirect to checkout if came from there
      if (redirectTo) {
        navigate(redirectTo);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || STRINGS.AUTH.INVALID_CODE);
    }
  };

  // Resend code handler
  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    try {
      if (mode === 'verify-reset') {
        await authAPI.forgotPassword({ email: verifyEmail });
      } else {
        await authAPI.resendCode({ email: verifyEmail });
      }
      setResendCooldown(60);
      resetCodeInputs();
      toast.success(STRINGS.AUTH.NEW_CODE_SENT);
    } catch (error) {
      toast.error(error.response?.data?.message || STRINGS.COMMON.ERROR);
    }
  };

  // Forgot password handler
  const handleForgotPassword = async () => {
    if (!formData.email) {
      toast.error(STRINGS.AUTH.ENTER_EMAIL);
      return;
    }
    try {
      await authAPI.forgotPassword({ email: formData.email });
      setVerifyEmail(formData.email);
      resetCodeInputs();
      setMode('verify-reset');
      setResendCooldown(60);
      toast.success(STRINGS.AUTH.RESET_CODE_SENT);
    } catch (error) {
      toast.error(error.response?.data?.message || STRINGS.COMMON.ERROR);
    }
  };

  // Verify reset code handler
  const handleVerifyResetCode = async () => {
    const code = getCodeString();
    if (code.length !== 6) {
      toast.error(STRINGS.AUTH.ENTER_6_DIGIT_CODE);
      return;
    }
    try {
      await authAPI.verifyResetCode({ email: verifyEmail, code });
      setMode('reset-password');
      toast.success(STRINGS.AUTH.CODE_CORRECT_ENTER_PASSWORD);
    } catch (error) {
      toast.error(error.response?.data?.message || STRINGS.AUTH.INVALID_CODE);
    }
  };

  // Reset password handler
  const handleResetPassword = async () => {
    if (newPassword.length < 6) {
      toast.error(STRINGS.AUTH.PASSWORD_LENGTH_ERROR);
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error(STRINGS.AUTH.PASSWORDS_DO_NOT_MATCH);
      return;
    }
    try {
      await authAPI.resetPassword({ email: verifyEmail, code: getCodeString(), newPassword });
      toast.success(STRINGS.AUTH.PASSWORD_CHANGED_SUCCESS);
      setMode('login');
      setFormData((prev) => ({ ...prev, password: '' }));
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error) {
      toast.error(error.response?.data?.message || STRINGS.COMMON.ERROR);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      switch (mode) {
        case 'login':
          await handleLogin();
          break;
        case 'register':
          await handleRegister();
          break;
        case 'verify-email':
          await handleVerifyEmail();
          break;
        case 'forgot-password':
          await handleForgotPassword();
          break;
        case 'verify-reset':
          await handleVerifyResetCode();
          break;
        case 'reset-password':
          await handleResetPassword();
          break;
      }
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (mode === 'verify-email') setMode('login');
    else if (mode === 'forgot-password') setMode('login');
    else if (mode === 'verify-reset') setMode('forgot-password');
    else if (mode === 'reset-password') setMode('verify-reset');
  };

  // Title based on mode
  const titles = {
    login: STRINGS.AUTH.LOGIN,
    register: STRINGS.AUTH.REGISTER,
    'verify-email': STRINGS.AUTH.VERIFY_ACCOUNT,
    'forgot-password': STRINGS.AUTH.FORGOT_PASSWORD,
    'verify-reset': STRINGS.AUTH.ENTER_VERIFICATION_CODE,
    'reset-password': STRINGS.AUTH.NEW_PASSWORD,
  };

  // Code input rendered inline (not as a component to prevent remounting)

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container-custom">
        <div className="max-w-md mx-auto bg-white rounded-2xl p-8 shadow-lg">
          {/* Back button */}
          {mode !== 'login' && mode !== 'register' && (
            <button
              onClick={goBack}
              className="flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-4 text-sm"
            >
              <FiArrowRight className="text-lg" />
              {STRINGS.COMMON.BACK}
            </button>
          )}

          {/* Title & Icon */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
              {mode === 'verify-email' || mode === 'verify-reset' ? (
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
                {STRINGS.AUTH.CODE_SENT_TO}
                <br />
                <span className="text-gray-800 font-medium" dir="ltr">
                  {verifyEmail}
                </span>
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
                    placeholder={STRINGS.AUTH.FIRST_NAME}
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                    className="input-field"
                  />
                  <input
                    type="text"
                    placeholder={STRINGS.AUTH.LAST_NAME}
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                    className="input-field"
                  />
                </div>
                <input
                  type="tel"
                  placeholder={STRINGS.AUTH.PHONE}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                  placeholder={STRINGS.AUTH.EMAIL}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="input-field"
                />
                <input
                  type="password"
                  placeholder={STRINGS.AUTH.PASSWORD}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="input-field"
                />
              </>
            )}

            {/* Register confirm password */}
            {mode === 'register' && (
              <input
                type="password"
                placeholder={STRINGS.AUTH.CONFIRM_PASSWORD}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
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
                  {STRINGS.AUTH.FORGOT_PASSWORD_Q}
                </button>
              </div>
            )}

            {/* Forgot password - email input */}
            {mode === 'forgot-password' && (
              <input
                type="email"
                placeholder={STRINGS.AUTH.ENTER_EMAIL}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                      ref={(el) => (inputRefs.current[i] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleCodeChange(i, e.target.value)}
                      onKeyDown={(e) => handleCodeKeyDown(i, e)}
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
                    {resendCooldown > 0
                      ? `${STRINGS.AUTH.RESEND_AFTER} ${resendCooldown} ${STRINGS.AUTH.SECONDS}`
                      : STRINGS.AUTH.RESEND_CODE}
                  </button>
                </div>
              </>
            )}

            {/* Reset password fields */}
            {mode === 'reset-password' && (
              <>
                <input
                  type="password"
                  placeholder={STRINGS.AUTH.NEW_PASSWORD_PLACEHOLDER}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="input-field"
                />
                <input
                  type="password"
                  placeholder={STRINGS.AUTH.CONFIRM_NEW_PASSWORD}
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
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  {STRINGS.COMMON.PROCESSING || 'جاري...'}
                </span>
              ) : (
                {
                  login: STRINGS.AUTH.LOGIN,
                  register: STRINGS.AUTH.CREATE_ACCOUNT,
                  'verify-email': STRINGS.AUTH.VERIFY_ACCOUNT,
                  'forgot-password': STRINGS.AUTH.SEND_VERIFICATION_CODE,
                  'verify-reset': STRINGS.AUTH.VERIFY,
                  'reset-password': STRINGS.AUTH.CHANGE_PASSWORD,
                }[mode]
              )}
            </button>
          </form>

          {/* Toggle login/register */}
          {(mode === 'login' || mode === 'register') && (
            <p className="text-center mt-6 text-gray-600">
              {mode === 'login' ? STRINGS.AUTH.NO_ACCOUNT : STRINGS.AUTH.HAVE_ACCOUNT}
              <button
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 hover:underline mr-2"
              >
                {mode === 'login' ? STRINGS.AUTH.REGISTER_NOW : STRINGS.AUTH.LOGIN_NOW}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// Dashboard Component
const Dashboard = () => {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const menuItems = [
    { path: '/account', icon: FiUser, label: STRINGS.ACCOUNT.MY_ACCOUNT, exact: true },
    { path: '/account/orders', icon: FiPackage, label: STRINGS.ACCOUNT.MY_ORDERS },
    { path: '/account/wishlist', icon: FiHeart, label: STRINGS.ACCOUNT.WISHLIST },
    { path: '/account/addresses', icon: FiMapPin, label: STRINGS.ACCOUNT.MY_ADDRESSES },
    { path: '/account/settings', icon: FiSettings, label: STRINGS.ACCOUNT.SETTINGS },
  ];

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
                <h2 className="font-bold text-gray-800">
                  {user?.firstName} {user?.lastName}
                </h2>
                <p className="text-gray-500 text-sm">{user?.email}</p>
              </div>

              <nav className="space-y-2">
                {menuItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      (
                        item.exact
                          ? location.pathname === item.path
                          : location.pathname.startsWith(item.path)
                      )
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
                  {STRINGS.ACCOUNT.LOGOUT}
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
  );
};

const ProfileOverview = () => {
  const { user } = useAuthStore();
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{STRINGS.ACCOUNT.WELCOME} {user?.firstName}!</h1>
      <div className="grid md:grid-cols-3 gap-4">
        <Link to="/account/orders" className="p-6 bg-gray-50 rounded-xl hover:bg-gray-100">
          <FiPackage className="text-3xl text-purple-600 mb-2" />
          <h3 className="font-medium">{STRINGS.ACCOUNT.MY_ORDERS}</h3>
          <p className="text-sm text-gray-500">{STRINGS.ACCOUNT.TRACK_ORDERS}</p>
        </Link>
        <Link to="/wishlist" className="p-6 bg-gray-50 rounded-xl hover:bg-gray-100">
          <FiHeart className="text-3xl text-purple-600 mb-2" />
          <h3 className="font-medium">{STRINGS.ACCOUNT.WISHLIST}</h3>
          <p className="text-sm text-gray-500">{STRINGS.ACCOUNT.FAVORITE_PRODUCTS}</p>
        </Link>
        <Link to="/account/settings" className="p-6 bg-gray-50 rounded-xl hover:bg-gray-100">
          <FiSettings className="text-3xl text-purple-600 mb-2" />
          <h3 className="font-medium">{STRINGS.ACCOUNT.SETTINGS}</h3>
          <p className="text-sm text-gray-500">{STRINGS.ACCOUNT.EDIT_PROFILE}</p>
        </Link>
      </div>
    </div>
  );
};

import { useQuery } from '@tanstack/react-query';
import { ordersAPI } from '../services/api';

const OrdersPage = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => ordersAPI.getAll().then((res) => res.data.data),
  });
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{STRINGS.ACCOUNT.MY_ORDERS}</h1>
      {isLoading ? (
        <p>{STRINGS.COMMON.LOADING}</p>
      ) : !data || data.length === 0 ? (
        <p className="text-gray-500">{STRINGS.ACCOUNT.NO_ORDERS_YET}</p>
      ) : (
        <div className="space-y-6">
          {data.map((order) => (
            <div key={order._id} className="border rounded-xl p-4 bg-gray-50">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
                <div className="break-all">
                  <span className="font-bold">{STRINGS.ACCOUNT.ORDER_NUMBER}</span>{' '}
                  <span className="text-sm">{order.orderNumber || order._id}</span>
                </div>
                <div>
                  <span className="font-bold">{STRINGS.ACCOUNT.STATUS}</span>{' '}
                  {order.statusHistory?.[order.statusHistory.length - 1]?.status || '---'}
                </div>
                <div>
                  <span className="font-bold">{STRINGS.ACCOUNT.DATE}</span>{' '}
                  {new Date(order.createdAt).toLocaleString('ar-EG')}
                </div>
                <div>
                  <span className="font-bold">{STRINGS.ACCOUNT.TOTAL}</span> {order.total} {STRINGS.PRODUCT.CURRENCY}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
                {order.items.map((item) => (
                  <div
                    key={item.product}
                    className="flex items-center gap-2 border rounded p-2 bg-white w-full sm:w-auto"
                  >
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{item.name}</div>
                      <div className="text-sm text-gray-500">{STRINGS.CART.QUANTITY} {item.quantity}</div>
                    </div>
                    <Link
                      to={`/product/${item.slug || item.product}?tab=reviews`}
                      className="btn-primary text-sm flex-shrink-0"
                    >
                      {STRINGS.PRODUCT.REVIEW}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const AddressesPage = () => (
  <div>
    <h1 className="text-2xl font-bold mb-6">{STRINGS.ACCOUNT.MY_ADDRESSES}</h1>
    <p className="text-gray-500">{STRINGS.ACCOUNT.NO_SAVED_ADDRESSES}</p>
  </div>
);

const SettingsPage = () => {
  const { user, setAuth } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);

  // Profile form state
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Email change state
  const [emailChangeMode, setEmailChangeMode] = useState('idle'); // 'idle' | 'entering' | 'verifying'
  const [newEmail, setNewEmail] = useState('');
  const [emailCode, setEmailCode] = useState(['', '', '', '', '', '']);
  const emailInputRefs = useRef([]);

  // Update profile data when user changes
  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.updateProfile(profileData);
      // Update local user state
      const updatedUser = { ...user, ...profileData };
      setAuth(updatedUser, localStorage.getItem('token'));
      toast.success(STRINGS.ACCOUNT.PROFILE_UPDATED);
    } catch (error) {
      toast.error(error.response?.data?.message || STRINGS.ACCOUNT.PROFILE_UPDATE_ERROR);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error(STRINGS.AUTH.PASSWORDS_DO_NOT_MATCH);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error(STRINGS.AUTH.PASSWORD_LENGTH_ERROR);
      return;
    }

    setLoading(true);
    try {
      await authAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success(STRINGS.AUTH.PASSWORD_CHANGED_SUCCESS);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || STRINGS.ACCOUNT.WRONG_CURRENT_PASSWORD);
    } finally {
      setLoading(false);
    }
  };

  // Email change handlers
  const handleRequestEmailChange = async (e) => {
    e.preventDefault();
    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      toast.error(STRINGS.ACCOUNT.ENTER_VALID_EMAIL);
      return;
    }

    setLoading(true);
    try {
      await authAPI.requestEmailChange({ newEmail });
      toast.success(STRINGS.ACCOUNT.CONFIRMATION_CODE_SENT);
      setEmailChangeMode('verifying');
      setEmailCode(['', '', '', '', '', '']);
      setTimeout(() => emailInputRefs.current[0]?.focus(), 100);
    } catch (error) {
      toast.error(error.response?.data?.message || STRINGS.COMMON.ERROR);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailCodeChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...emailCode];
    newCode[index] = value.slice(-1);
    setEmailCode(newCode);
    if (value && index < 5) {
      emailInputRefs.current[index + 1]?.focus();
    }
  };

  const handleEmailCodeKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !emailCode[index] && index > 0) {
      emailInputRefs.current[index - 1]?.focus();
    }
  };

  const handleEmailCodePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setEmailCode(pasted.split(''));
      emailInputRefs.current[5]?.focus();
    }
  };

  const handleVerifyEmailChange = async (e) => {
    e.preventDefault();
    const code = emailCode.join('');
    if (code.length !== 6) {
      toast.error(STRINGS.AUTH.ENTER_6_DIGIT_CODE);
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.verifyEmailChange({ code });
      toast.success(STRINGS.ACCOUNT.EMAIL_CHANGED_SUCCESS);
      // Update local user state
      if (res.data?.data?.user) {
        setAuth(res.data.data.user, localStorage.getItem('token'));
      }
      setEmailChangeMode('idle');
      setNewEmail('');
      setEmailCode(['', '', '', '', '', '']);
    } catch (error) {
      toast.error(error.response?.data?.message || STRINGS.AUTH.INVALID_CODE);
    } finally {
      setLoading(false);
    }
  };

  const cancelEmailChange = () => {
    setEmailChangeMode('idle');
    setNewEmail('');
    setEmailCode(['', '', '', '', '', '']);
  };

  const tabs = [
    { id: 'profile', label: STRINGS.ACCOUNT.PROFILE, icon: FiUser },
    { id: 'security', label: STRINGS.ACCOUNT.SECURITY, icon: FiLock },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{STRINGS.ACCOUNT.SETTINGS}</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="text-lg" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-4 mb-8 pb-6 border-b">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white text-2xl font-bold">
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {user?.firstName} {user?.lastName}
              </h2>
              <p className="text-gray-500">{user?.email}</p>
              <span className="inline-block mt-1 px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                {STRINGS.ACCOUNT.ACCOUNT_VERIFIED}
              </span>
            </div>
          </div>

          <form onSubmit={handleProfileUpdate} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{STRINGS.AUTH.FIRST_NAME}</label>
                <input
                  type="text"
                  value={profileData.firstName}
                  onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{STRINGS.AUTH.LAST_NAME}</label>
                <input
                  type="text"
                  value={profileData.lastName}
                  onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {STRINGS.AUTH.EMAIL}
              </label>

              {emailChangeMode === 'idle' && (
                <div className="flex gap-3">
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="flex-1 px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={() => setEmailChangeMode('entering')}
                    className="px-4 py-3 border border-purple-600 text-purple-600 rounded-lg font-medium hover:bg-purple-50 transition"
                  >
                    {STRINGS.ACCOUNT.CHANGE}
                  </button>
                </div>
              )}

              {emailChangeMode === 'entering' && (
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder={STRINGS.ACCOUNT.ENTER_NEW_EMAIL}
                      className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleRequestEmailChange}
                      disabled={loading}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition disabled:opacity-50 flex items-center gap-2"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            />
                          </svg>
                          {STRINGS.COMMON.SENDING}
                        </>
                      ) : (
                        STRINGS.ACCOUNT.SEND_CONFIRMATION_CODE
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEmailChange}
                      className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition"
                    >
                      {STRINGS.COMMON.CANCEL}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    {STRINGS.ACCOUNT.CONFIRMATION_CODE_WILL_BE_SENT} ({user?.email})
                  </p>
                </div>
              )}

              {emailChangeMode === 'verifying' && (
                <div className="space-y-4">
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <p className="text-sm text-purple-700">
                      {STRINGS.ACCOUNT.CONFIRMATION_CODE_SENT_TO} <strong>{user?.email}</strong>
                    </p>
                    <p className="text-xs text-purple-600 mt-1">{STRINGS.ACCOUNT.NEW_EMAIL_LABEL} {newEmail}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {STRINGS.ACCOUNT.ENTER_CONFIRMATION_CODE}
                    </label>
                    <div className="flex justify-center gap-2" dir="ltr">
                      {emailCode.map((digit, i) => (
                        <input
                          key={i}
                          ref={(el) => (emailInputRefs.current[i] = el)}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleEmailCodeChange(i, e.target.value)}
                          onKeyDown={(e) => handleEmailCodeKeyDown(i, e)}
                          onPaste={i === 0 ? handleEmailCodePaste : undefined}
                          className="w-12 h-12 text-center text-xl font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 justify-center">
                    <button
                      type="button"
                      onClick={handleVerifyEmailChange}
                      disabled={loading || emailCode.join('').length !== 6}
                      className="px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition disabled:opacity-50 flex items-center gap-2"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            />
                          </svg>
                          {STRINGS.COMMON.VERIFYING}
                        </>
                      ) : (
                        STRINGS.ACCOUNT.CONFIRM_CHANGE
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEmailChange}
                      className="px-6 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition"
                    >
                      {STRINGS.COMMON.CANCEL}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{STRINGS.AUTH.PHONE}</label>
              <input
                type="tel"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                dir="ltr"
                placeholder="+20 1XX XXX XXXX"
              />
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    {STRINGS.COMMON.SAVING}
                  </>
                ) : (
                  STRINGS.ACCOUNT.SAVE_CHANGES
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Change Password */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <FiLock className="text-purple-600 text-xl" />
              </div>
              <div>
                <h3 className="font-bold">{STRINGS.AUTH.CHANGE_PASSWORD}</h3>
                <p className="text-sm text-gray-500">
                  {STRINGS.ACCOUNT.UPDATE_PASSWORD_DESC}
                </p>
              </div>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {STRINGS.ACCOUNT.CURRENT_PASSWORD}
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, currentPassword: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {STRINGS.AUTH.NEW_PASSWORD_PLACEHOLDER}
                  </label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, newPassword: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {STRINGS.AUTH.CONFIRM_NEW_PASSWORD}
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <p className="text-xs text-gray-400">{STRINGS.AUTH.PASSWORD_LENGTH_ERROR}</p>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      {STRINGS.COMMON.CHANGING}
                    </>
                  ) : (
                    STRINGS.AUTH.CHANGE_PASSWORD
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Account Info */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <FiMail className="text-blue-600 text-xl" />
              </div>
              <div>
                <h3 className="font-bold">{STRINGS.ACCOUNT.ACCOUNT_INFO}</h3>
                <p className="text-sm text-gray-500">{STRINGS.ACCOUNT.LOGIN_INFO_DESC}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b">
                <div>
                  <p className="text-sm text-gray-500">{STRINGS.AUTH.EMAIL}</p>
                  <p className="font-medium">{user?.email}</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                  {STRINGS.ACCOUNT.VERIFIED_BADGE}
                </span>
              </div>

              <div className="flex justify-between items-center py-3 border-b">
                <div>
                  <p className="text-sm text-gray-500">{STRINGS.ACCOUNT.REGISTRATION_DATE}</p>
                  <p className="font-medium">
                    {user?.createdAt
                      ? new Date(user.createdAt).toLocaleDateString('ar-EG', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : STRINGS.COMMON.NOT_AVAILABLE}
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center py-3">
                <div>
                  <p className="text-sm text-gray-500">{STRINGS.ACCOUNT.ACCOUNT_TYPE}</p>
                  <p className="font-medium">{user?.role === 'admin' ? STRINGS.ACCOUNT.ADMIN : STRINGS.ACCOUNT.CUSTOMER}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Main Account Page
const AccountPage = () => {
  const { isAuthenticated } = useAuthStore();

  return <>{isAuthenticated ? <Dashboard /> : <AuthForm />}</>;
};

export default AccountPage;
