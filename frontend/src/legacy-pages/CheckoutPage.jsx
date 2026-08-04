import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiCheck, FiCreditCard, FiTruck, FiAward } from 'react-icons/fi';
import { useCartStore, useAuthStore } from '../store';
import { ordersAPI, settingsAPI } from '../services/api';
import { useQuery } from '@tanstack/react-query';
import { BUSINESS_CONFIG, STRINGS } from '../constants';
import toast from 'react-hot-toast';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { items, getTotal, clearCart, _hasHydrated: _cartHasHydrated } = useCartStore();
  const { isAuthenticated, user, _hasHydrated: _authHasHydrated } = useAuthStore();

  const isHydrated = _cartHasHydrated && _authHasHydrated;

  // Redirect to login if not authenticated or to cart if empty
  useEffect(() => {
    if (isHydrated) {
      if (!isAuthenticated) {
        toast(STRINGS.CHECKOUT.LOGIN_REQUIRED, { icon: '🔐' });
        navigate('/account', { state: { from: '/checkout' } });
      } else if (items.length === 0) {
        navigate('/cart');
      }
    }
  }, [isHydrated, isAuthenticated, items.length, navigate]);

  const { data: loyaltySettings } = useQuery({
    queryKey: ['public-loyalty-settings'],
    queryFn: () => settingsAPI.getLoyaltySettings().then((res) => res.data?.data),
  });

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [pointsToRedeem, setPointsToRedeem] = useState(0);

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    governorate: '',
    city: '',
    area: '',
    street: '',
    building: '',
    floor: '',
    apartment: '',
    paymentMethod: 'cod',
    deliveryType: 'standard',
    customerNote: '',
  });

  const subtotal = getTotal();
  const shippingCost = BUSINESS_CONFIG.SHIPPING_COST;

  const egpPerPoint = loyaltySettings?.egpPerPointRedeemed || 0.1;
  const pointsDiscount = pointsToRedeem * egpPerPoint;
  const total = Math.max(0, subtotal + shippingCost - pointsDiscount);

  const governorates = STRINGS.EGYPT_GOVERNORATES;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear error for this field when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateStep1 = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = STRINGS.CHECKOUT.ERRORS.FIRST_NAME_REQUIRED;
    }
    if (!formData.email.trim()) {
      newErrors.email = STRINGS.CHECKOUT.ERRORS.EMAIL_REQUIRED;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = STRINGS.CHECKOUT.ERRORS.EMAIL_INVALID;
    }
    if (!formData.phone.trim()) {
      newErrors.phone = STRINGS.CHECKOUT.ERRORS.PHONE_REQUIRED;
    }
    if (!formData.governorate) {
      newErrors.governorate = STRINGS.CHECKOUT.ERRORS.GOVERNORATE_REQUIRED;
    }
    if (!formData.street.trim()) {
      newErrors.street = STRINGS.CHECKOUT.ERRORS.STREET_REQUIRED;
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error(STRINGS.CHECKOUT.ERRORS.FILL_REQUIRED);
      return false;
    }
    return true;
  };

  const handleNextStep1 = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const orderData = {
        items: items.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          selectedSize: item.selectedSize,
          selectedColor: item.selectedColor,
          selectedShape: item.selectedShape,
          selectedVariants: item.selectedVariants,
          addons: item.addons,
          boxSelections: item.boxSelections,
          boxId: item.boxId,
        })),
        shippingAddress: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          governorate: formData.governorate,
          city: formData.city,
          area: formData.area,
          street: formData.street,
          building: formData.building,
          floor: formData.floor,
          apartment: formData.apartment,
        },
        paymentMethod: formData.paymentMethod,
        deliveryType: formData.deliveryType,
        customerNote: formData.customerNote,
        guestEmail: formData.email,
        pointsToRedeem: pointsToRedeem > 0 ? pointsToRedeem : undefined,
      };

      const response = await ordersAPI.create(orderData);

      if (response.data.success) {
        clearCart();
        toast.success(STRINGS.CHECKOUT.ORDER_SUCCESS);
        navigate(`/account/orders?success=true&order=${response.data.data.orderNumber}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || STRINGS.CHECKOUT.ORDER_ERROR);
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking authentication
  if (!isHydrated) {
    return (
      <div className="container-custom py-16 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  if (items.length === 0) {
    return (
      <div className="container-custom py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">{STRINGS.CART.EMPTY}</h1>
        <Link to="/products" className="btn-primary">
          {STRINGS.CART.START_SHOPPING}
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="container-custom">
          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            {[STRINGS.CHECKOUT.SHIPPING_INFO, STRINGS.CHECKOUT.PAYMENT_METHOD, STRINGS.CHECKOUT.PLACE_ORDER].map((label, index) => (
              <div key={index} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    step > index + 1
                      ? 'bg-green-500 text-white'
                      : step === index + 1
                        ? 'bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step > index + 1 ? <FiCheck /> : index + 1}
                </div>
                <span
                  className={`mx-2 hidden sm:inline ${step === index + 1 ? 'font-medium' : 'text-gray-500'}`}
                >
                  {label}
                </span>
                {index < 2 && (
                  <div
                    className={`w-12 h-1 mx-2 ${step > index + 1 ? 'bg-green-500' : 'bg-gray-200'}`}
                  />
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Form */}
              <div className="lg:col-span-2">
                {/* Step 1: Shipping Info */}
                {step === 1 && (
                  <div className="bg-white rounded-2xl p-6">
                    <h2 className="text-xl font-bold mb-6">{STRINGS.CHECKOUT.SHIPPING_INFO}</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-700 mb-2">{STRINGS.CHECKOUT.FIRST_NAME_LABEL}</label>
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          className={`input-field ${errors.firstName ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                        />
                        {errors.firstName && (
                          <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-gray-700 mb-2">{STRINGS.CHECKOUT.LAST_NAME_LABEL}</label>
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 mb-2">{STRINGS.CHECKOUT.EMAIL_LABEL}</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className={`input-field ${errors.email ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                        />
                        {errors.email && (
                          <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-gray-700 mb-2">{STRINGS.CHECKOUT.PHONE_LABEL}</label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className={`input-field ${errors.phone ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                        />
                        {errors.phone && (
                          <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-gray-700 mb-2">{STRINGS.CHECKOUT.GOVERNORATE_LABEL}</label>
                        <select
                          name="governorate"
                          value={formData.governorate}
                          onChange={handleChange}
                          className={`input-field ${errors.governorate ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                        >
                          <option value="">{STRINGS.CHECKOUT.SELECT_GOVERNORATE}</option>
                          {governorates.map((gov) => (
                            <option key={gov} value={gov}>
                              {gov}
                            </option>
                          ))}
                        </select>
                        {errors.governorate && (
                          <p className="text-red-500 text-sm mt-1">{errors.governorate}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-gray-700 mb-2">{STRINGS.CHECKOUT.CITY_LABEL}</label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          className="input-field"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-gray-700 mb-2">{STRINGS.CHECKOUT.AREA_LABEL}</label>
                        <input
                          type="text"
                          name="area"
                          value={formData.area}
                          onChange={handleChange}
                          className="input-field"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-gray-700 mb-2">{STRINGS.CHECKOUT.STREET_LABEL}</label>
                        <input
                          type="text"
                          name="street"
                          value={formData.street}
                          onChange={handleChange}
                          className={`input-field ${errors.street ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                          placeholder={STRINGS.CHECKOUT.STREET_PLACEHOLDER}
                        />
                        {errors.street && (
                          <p className="text-red-500 text-sm mt-1">{errors.street}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-gray-700 mb-2">{STRINGS.CHECKOUT.FLOOR_LABEL}</label>
                        <input
                          type="text"
                          name="floor"
                          value={formData.floor}
                          onChange={handleChange}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 mb-2">{STRINGS.CHECKOUT.APARTMENT_LABEL}</label>
                        <input
                          type="text"
                          name="apartment"
                          value={formData.apartment}
                          onChange={handleChange}
                          className="input-field"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleNextStep1}
                      className="btn-primary w-full mt-6"
                    >
                      {STRINGS.COMMON.NEXT}
                    </button>
                  </div>
                )}

                {/* Step 2: Payment */}
                {step === 2 && (
                  <div className="bg-white rounded-2xl p-6">
                    <h2 className="text-xl font-bold mb-6">{STRINGS.CHECKOUT.PAYMENT_METHOD}</h2>
                    <div className="space-y-3">
                      {[
                        { value: 'cod', label: STRINGS.CHECKOUT.COD, icon: '💵' },
                        { value: 'instapay', label: STRINGS.CHECKOUT.INSTAPAY, icon: '📱' },
                      ].map((method) => (
                        <label
                          key={method.value}
                          className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer ${formData.paymentMethod === method.value ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-pink-50' : 'border-gray-300'}`}
                        >
                          <input
                            type="radio"
                            name="paymentMethod"
                            value={method.value}
                            checked={formData.paymentMethod === method.value}
                            onChange={handleChange}
                          />
                          <span className="text-2xl">{method.icon}</span>
                          <span className="font-medium">{method.label}</span>
                        </label>
                      ))}
                    </div>
                    {formData.paymentMethod === 'instapay' && (
                      <div className="mt-6 p-4 bg-purple-50/80 border border-purple-200 rounded-2xl flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                          <img
                            src="/images/payments/instapay.svg"
                            alt="InstaPay"
                            className="h-6 w-6"
                          />
                          <span className="font-bold text-purple-950 text-base">
                            الدفع عبر تطبيق إنستاباي (InstaPay)
                          </span>
                        </div>
                        <div className="p-3.5 bg-white rounded-xl border border-purple-200/80 flex items-center justify-between shadow-sm">
                          <span className="text-gray-700 text-xs sm:text-sm font-semibold">رقم تحويل إنستاباي:</span>
                          <div className="flex items-center gap-2">
                            <span className="text-base sm:text-lg font-bold text-purple-700 font-mono tracking-wider dir-ltr select-all">+201286153004</span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText('+201286153004');
                                toast.success('تم نسخ رقم إنستاباي بنجاح!');
                              }}
                              className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-800 px-2.5 py-1 rounded-lg transition-colors font-semibold"
                            >
                              نسخ
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-purple-800 leading-relaxed font-medium">
                          يرجى تحويل المبلغ الإجمالي إلى الرقم أعلاه عبر InstaPay. بعد تأكيد الطلب، سيرسل لك إيميل يحتوي أيضاً على تفاصيل التحويل.
                        </p>
                      </div>
                    )}
                    {/* Notes */}
                    <div className="mt-6">
                      <label className="block text-gray-700 mb-2">
                        {STRINGS.CHECKOUT.NOTES_LABEL}
                      </label>
                      <textarea
                        name="customerNote"
                        value={formData.customerNote}
                        onChange={handleChange}
                        className="input-field"
                        rows="3"
                      />
                    </div>
                    <div className="flex gap-4 mt-6">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="btn-outline flex-1"
                      >
                        {STRINGS.COMMON.PREVIOUS}
                      </button>
                      <button
                        type="button"
                        onClick={() => setStep(3)}
                        className="btn-primary flex-1"
                      >
                        {STRINGS.COMMON.NEXT}
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Confirmation */}
                {step === 3 && (
                  <div className="bg-white rounded-2xl p-6">
                    <h2 className="text-xl font-bold mb-6">{STRINGS.CHECKOUT.PLACE_ORDER}</h2>
                    {/* Shipping Summary */}
                    <div className="mb-6 pb-6 border-b">
                      <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                        <FiTruck />
                        {STRINGS.CHECKOUT.SHIPPING_ADDRESS}
                      </h3>
                      <p className="text-gray-600">
                        {formData.firstName} {formData.lastName}
                        <br />
                        {formData.street}, {formData.area}
                        <br />
                        {formData.city}, {formData.governorate}
                        <br />
                        {formData.phone}
                      </p>
                    </div>
                    {/* Payment Summary */}
                    <div className="mb-6 pb-6 border-b">
                      <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                        <FiCreditCard />
                        {STRINGS.CHECKOUT.PAYMENT_METHOD}
                      </h3>
                      <div className="text-gray-600">
                        {formData.paymentMethod === 'cod' && <span className="font-medium">{STRINGS.CHECKOUT.COD}</span>}
                        {formData.paymentMethod === 'instapay' && (
                          <div className="flex flex-col gap-2">
                            <span className="text-purple-700 font-bold">{STRINGS.CHECKOUT.INSTAPAY}</span>
                            <div className="inline-flex items-center gap-2 text-sm bg-purple-50 border border-purple-200 text-purple-900 px-3.5 py-2 rounded-xl w-fit">
                              📱 رقم التحويل: <strong className="dir-ltr text-purple-700 font-mono text-base">+201286153004</strong>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Items Summary */}
                    <div className="space-y-4">
                      <h3 className="font-medium text-gray-800">{STRINGS.CART.ITEMS}</h3>
                      {items.map((item, index) => (
                        <div key={index} className="flex gap-4">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                          <div className="flex-1">
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-gray-500">{STRINGS.CART.QUANTITY} {item.quantity}</p>
                          </div>
                          <span className="font-medium">{item.price * item.quantity} {STRINGS.PRODUCT.CURRENCY}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-4 mt-6">
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="btn-outline flex-1"
                      >
                        {STRINGS.COMMON.PREVIOUS}
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary flex-1 disabled:opacity-50"
                      >
                        {loading ? STRINGS.CHECKOUT.PLACING_ORDER : STRINGS.CHECKOUT.PLACE_ORDER}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Order Summary Sidebar */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl p-6 sticky sticky-header-offset transition-all duration-300">
                  <h2 className="text-xl font-bold mb-6">{STRINGS.CHECKOUT.ORDER_SUMMARY}</h2>
                  <div className="space-y-4 mb-6">
                    {items.map((item, index) => (
                      <div key={index} className="flex gap-3">
                        <div className="relative">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                          <span className="absolute -top-2 -right-2 w-5 h-5 bg-gray-500 text-white text-xs rounded-full flex items-center justify-center">
                            {item.quantity}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium line-clamp-2">{item.name}</p>
                          {item.boxId && (
                            <span className="inline-block bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0.5 rounded-full mt-0.5 mb-1">
                              {STRINGS.CART.IN_BOX}
                            </span>
                          )}
                          <p className="text-sm text-gray-500">{item.price} {STRINGS.PRODUCT.CURRENCY}</p>
                          {item.selectedVariants &&
                            Object.keys(item.selectedVariants).length > 0 && (
                              <div className="text-xs text-gray-400 mt-0.5">
                                {Object.entries(item.selectedVariants).map(([group, value]) => (
                                  <p key={group}>
                                    {group}: {value}
                                  </p>
                                ))}
                              </div>
                            )}
                          {item.boxSelections?.length > 0 && (
                            <div className="text-xs text-gray-400 mt-1">
                              {item.boxSelections.map((sel, i) => (
                                <p key={i}>
                                  {sel.slotLabel}: {sel.chosenOption}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Loyalty Points Redemption Widget */}
                  {loyaltySettings?.enabled !== false && user?.loyaltyPoints >= (loyaltySettings?.minPointsToRedeem || 100) && (
                    <div className="mb-6 p-3.5 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 rounded-xl space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                          <FiAward className="text-purple-600" />
                          استبدال نقاط الولاء
                        </span>
                        <span className="text-[11px] font-semibold text-purple-700 bg-white px-2 py-0.5 rounded-full border border-purple-200">
                          رصيدك: {user.loyaltyPoints} نقطة
                        </span>
                      </div>

                      <div className="flex items-start gap-2 pt-1">
                        <input
                          type="checkbox"
                          id="redeemPoints"
                          checked={pointsToRedeem > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setPointsToRedeem(user.loyaltyPoints);
                            } else {
                              setPointsToRedeem(0);
                            }
                          }}
                          className="w-4 h-4 mt-0.5 flex-shrink-0 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
                        />
                        <label htmlFor="redeemPoints" className="text-xs text-gray-700 font-medium cursor-pointer leading-relaxed">
                          خصم نقاط الرصيد ({user.loyaltyPoints} نقطة = -{(user.loyaltyPoints * egpPerPoint).toFixed(2)} ج.م)
                        </label>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3 py-4 border-t border-b">
                    <div className="flex justify-between text-gray-600">
                      <span>{STRINGS.CART.SUBTOTAL}</span>
                      <span>{subtotal} {STRINGS.PRODUCT.CURRENCY}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>{STRINGS.CART.SHIPPING}</span>
                      <span>{`${shippingCost} ${STRINGS.PRODUCT.CURRENCY}`}</span>
                    </div>
                    {pointsDiscount > 0 && (
                      <div className="flex justify-between text-green-600 font-bold">
                        <span>خصم نقاط الولاء</span>
                        <span>-{pointsDiscount.toFixed(2)} {STRINGS.PRODUCT.CURRENCY}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between text-lg font-bold mt-4">
                    <span>{STRINGS.CART.TOTAL}</span>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                      {total} {STRINGS.PRODUCT.CURRENCY}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default CheckoutPage;
