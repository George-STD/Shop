import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import Image from 'next/image';
import { useNavigate, Link } from 'react-router-dom';
import { FiCheck, FiCreditCard, FiTruck, FiAward, FiCopy, FiPackage } from 'react-icons/fi';
import { useCartStore, useAuthStore } from '../store';
import { ordersAPI, settingsAPI } from '../services/api';
import { useQuery } from '@tanstack/react-query';
import { BUSINESS_CONFIG, STRINGS } from '../constants';
import toast from 'react-hot-toast';

/**
 * Step 1: Shipping & Delivery Form Sub-Component (Memoized)
 */
const ShippingFormStep = memo(function ShippingFormStep({
  formData,
  errors,
  onChange,
  onNext,
  isAuthenticated,
  governorates,
}) {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100" role="group" aria-label={STRINGS.CHECKOUT.SHIPPING_INFO}>
      <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <FiTruck className="text-purple-600" aria-hidden="true" />
        {STRINGS.CHECKOUT.SHIPPING_INFO}
      </h2>
      <div className="grid md:grid-cols-2 gap-4">
        {/* First Name */}
        <div>
          <label htmlFor="checkout-firstName" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
            {STRINGS.CHECKOUT.FIRST_NAME_LABEL} <span className="text-red-500">*</span>
          </label>
          <input
            id="checkout-firstName"
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={onChange}
            aria-invalid={!!errors.firstName}
            aria-describedby={errors.firstName ? 'error-firstName' : undefined}
            className={`input-field text-sm ${errors.firstName ? 'border-red-500 ring-1 ring-red-500' : ''}`}
            placeholder="الاسم الأول"
            required
          />
          {errors.firstName && (
            <p id="error-firstName" className="text-red-500 text-xs mt-1 font-medium" role="alert">
              {errors.firstName}
            </p>
          )}
        </div>

        {/* Last Name */}
        <div>
          <label htmlFor="checkout-lastName" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
            {STRINGS.CHECKOUT.LAST_NAME_LABEL}
          </label>
          <input
            id="checkout-lastName"
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={onChange}
            className="input-field text-sm"
            placeholder="اسم العائلة"
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="checkout-email" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
            {STRINGS.CHECKOUT.EMAIL_LABEL} <span className="text-red-500">*</span>
          </label>
          <input
            id="checkout-email"
            type="email"
            name="email"
            value={formData.email}
            onChange={onChange}
            disabled={isAuthenticated}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'error-email' : undefined}
            className={`input-field text-sm ${isAuthenticated ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''} ${
              errors.email ? 'border-red-500 ring-1 ring-red-500' : ''
            }`}
            placeholder="example@mail.com"
            required
          />
          {isAuthenticated && (
            <p className="text-[11px] text-gray-400 mt-1">البريد الإلكتروني مرتبط بحسابك المسجّل.</p>
          )}
          {errors.email && (
            <p id="error-email" className="text-red-500 text-xs mt-1 font-medium" role="alert">
              {errors.email}
            </p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="checkout-phone" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
            {STRINGS.CHECKOUT.PHONE_LABEL} <span className="text-red-500">*</span>
          </label>
          <input
            id="checkout-phone"
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={onChange}
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? 'error-phone' : undefined}
            className={`input-field text-sm ${errors.phone ? 'border-red-500 ring-1 ring-red-500' : ''}`}
            placeholder="010XXXXXXXX"
            required
          />
          {errors.phone && (
            <p id="error-phone" className="text-red-500 text-xs mt-1 font-medium" role="alert">
              {errors.phone}
            </p>
          )}
        </div>

        {/* Governorate */}
        <div>
          <label htmlFor="checkout-governorate" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
            {STRINGS.CHECKOUT.GOVERNORATE_LABEL} <span className="text-red-500">*</span>
          </label>
          <select
            id="checkout-governorate"
            name="governorate"
            value={formData.governorate}
            onChange={onChange}
            aria-invalid={!!errors.governorate}
            aria-describedby={errors.governorate ? 'error-governorate' : undefined}
            className={`input-field text-sm ${errors.governorate ? 'border-red-500 ring-1 ring-red-500' : ''}`}
            required
          >
            <option value="">{STRINGS.CHECKOUT.SELECT_GOVERNORATE}</option>
            {governorates.map((gov) => (
              <option key={gov} value={gov}>
                {gov}
              </option>
            ))}
          </select>
          {errors.governorate && (
            <p id="error-governorate" className="text-red-500 text-xs mt-1 font-medium" role="alert">
              {errors.governorate}
            </p>
          )}
        </div>

        {/* City */}
        <div>
          <label htmlFor="checkout-city" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
            {STRINGS.CHECKOUT.CITY_LABEL}
          </label>
          <input
            id="checkout-city"
            type="text"
            name="city"
            value={formData.city}
            onChange={onChange}
            className="input-field text-sm"
            placeholder="المدينة / المركز"
          />
        </div>

        {/* Area */}
        <div className="md:col-span-2">
          <label htmlFor="checkout-area" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
            {STRINGS.CHECKOUT.AREA_LABEL}
          </label>
          <input
            id="checkout-area"
            type="text"
            name="area"
            value={formData.area}
            onChange={onChange}
            className="input-field text-sm"
            placeholder="الحي أو المنطقة"
          />
        </div>

        {/* Street */}
        <div className="md:col-span-2">
          <label htmlFor="checkout-street" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
            {STRINGS.CHECKOUT.STREET_LABEL} <span className="text-red-500">*</span>
          </label>
          <input
            id="checkout-street"
            type="text"
            name="street"
            value={formData.street}
            onChange={onChange}
            aria-invalid={!!errors.street}
            aria-describedby={errors.street ? 'error-street' : undefined}
            className={`input-field text-sm ${errors.street ? 'border-red-500 ring-1 ring-red-500' : ''}`}
            placeholder={STRINGS.CHECKOUT.STREET_PLACEHOLDER}
            required
          />
          {errors.street && (
            <p id="error-street" className="text-red-500 text-xs mt-1 font-medium" role="alert">
              {errors.street}
            </p>
          )}
        </div>

        {/* Floor */}
        <div>
          <label htmlFor="checkout-floor" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
            {STRINGS.CHECKOUT.FLOOR_LABEL}
          </label>
          <input
            id="checkout-floor"
            type="text"
            name="floor"
            value={formData.floor}
            onChange={onChange}
            className="input-field text-sm"
            placeholder="رقم الطابق"
          />
        </div>

        {/* Apartment */}
        <div>
          <label htmlFor="checkout-apartment" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
            {STRINGS.CHECKOUT.APARTMENT_LABEL}
          </label>
          <input
            id="checkout-apartment"
            type="text"
            name="apartment"
            value={formData.apartment}
            onChange={onChange}
            className="input-field text-sm"
            placeholder="رقم الشقة"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={onNext}
        className="btn-primary w-full mt-6 py-3.5 font-bold text-sm shadow-md shadow-purple-500/20"
      >
        {STRINGS.COMMON.NEXT} &larr;
      </button>
    </div>
  );
});

/**
 * Step 2: Payment Method Sub-Component (Memoized)
 */
const PaymentMethodStep = memo(function PaymentMethodStep({
  formData,
  onChange,
  onBack,
  onNext,
}) {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100" role="group" aria-label={STRINGS.CHECKOUT.PAYMENT_METHOD}>
      <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <FiCreditCard className="text-purple-600" aria-hidden="true" />
        {STRINGS.CHECKOUT.PAYMENT_METHOD}
      </h2>

      <div className="space-y-3" role="radiogroup" aria-label={STRINGS.CHECKOUT.PAYMENT_METHOD}>
        {[
          { value: 'cod', label: STRINGS.CHECKOUT.COD, icon: '💵' },
          { value: 'instapay', label: STRINGS.CHECKOUT.INSTAPAY, icon: '📱' },
        ].map((method) => (
          <label
            key={method.value}
            className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
              formData.paymentMethod === method.value
                ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-pink-50 ring-2 ring-purple-200'
                : 'border-gray-200 hover:border-purple-200'
            }`}
          >
            <input
              type="radio"
              name="paymentMethod"
              value={method.value}
              checked={formData.paymentMethod === method.value}
              onChange={onChange}
              className="text-purple-600 focus:ring-purple-500"
            />
            <span className="text-2xl" aria-hidden="true">{method.icon}</span>
            <span className="font-bold text-gray-800 text-sm">{method.label}</span>
          </label>
        ))}
      </div>

      {formData.paymentMethod === 'instapay' && (
        <div className="mt-6 p-4 bg-purple-50/80 border border-purple-200 rounded-2xl flex flex-col gap-3 animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="text-xl" aria-hidden="true">⚡</span>
            <span className="font-bold text-purple-950 text-sm sm:text-base">
              الدفع عبر تطبيق إنستاباي (InstaPay)
            </span>
          </div>
          <div className="p-3 bg-white rounded-xl border border-purple-200/80 flex items-center justify-between shadow-sm">
            <span className="text-gray-700 text-xs sm:text-sm font-semibold">رقم تحويل إنستاباي:</span>
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-bold text-purple-700 font-mono tracking-wider dir-ltr select-all">
                {BUSINESS_CONFIG.INSTAPAY_NUMBER}
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(BUSINESS_CONFIG.INSTAPAY_NUMBER);
                  toast.success('تم نسخ رقم إنستاباي بنجاح!');
                }}
                className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-800 px-2.5 py-1 rounded-lg transition-colors font-semibold flex items-center gap-1"
                aria-label="نسخ رقم إنستاباي"
              >
                <FiCopy size={12} aria-hidden="true" />
                <span>نسخ</span>
              </button>
            </div>
          </div>
          <p className="text-xs text-purple-800 leading-relaxed font-medium">
            يرجى تحويل المبلغ الإجمالي إلى الرقم أعلاه عبر InstaPay. بعد تأكيد الطلب، سيرسل لك بريد إلكتروني بتفاصيل التحويل.
          </p>
        </div>
      )}

      {/* Customer Notes */}
      <div className="mt-6">
        <label htmlFor="checkout-customerNote" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
          {STRINGS.CHECKOUT.NOTES_LABEL}
        </label>
        <textarea
          id="checkout-customerNote"
          name="customerNote"
          value={formData.customerNote}
          onChange={onChange}
          className="input-field text-sm"
          rows="3"
          placeholder="أي تعليمات خاصة بالتوصيل أو التغليف..."
        />
      </div>

      <div className="flex gap-4 mt-6">
        <button
          type="button"
          onClick={onBack}
          className="btn-outline flex-1 py-3 text-sm font-semibold"
        >
          {STRINGS.COMMON.PREVIOUS}
        </button>
        <button
          type="button"
          onClick={onNext}
          className="btn-primary flex-1 py-3 text-sm font-bold shadow-md shadow-purple-500/20"
        >
          {STRINGS.COMMON.NEXT} &larr;
        </button>
      </div>
    </div>
  );
});

/**
 * Step 3: Order Review & Confirmation Sub-Component (Memoized)
 */
const OrderReviewStep = memo(function OrderReviewStep({
  formData,
  items,
  loading,
  onBack,
}) {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100" role="group" aria-label={STRINGS.CHECKOUT.PLACE_ORDER}>
      <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <FiCheck className="text-green-600" aria-hidden="true" />
        {STRINGS.CHECKOUT.PLACE_ORDER}
      </h2>

      {/* Shipping Summary */}
      <div className="mb-6 pb-6 border-b border-gray-100">
        <h3 className="font-bold text-gray-800 mb-2.5 flex items-center gap-2 text-sm">
          <FiTruck className="text-purple-600" aria-hidden="true" />
          {STRINGS.CHECKOUT.SHIPPING_ADDRESS}
        </h3>
        <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
          <strong>{formData.firstName} {formData.lastName}</strong>
          <br />
          {formData.street} {formData.building && `، عمارة ${formData.building}`} {formData.floor && `، طابق ${formData.floor}`} {formData.apartment && `، شقة ${formData.apartment}`}
          <br />
          {formData.area && `${formData.area}، `}{formData.city && `${formData.city}، `}{formData.governorate}
          <br />
          {formData.phone}
        </p>
      </div>

      {/* Payment Summary */}
      <div className="mb-6 pb-6 border-b border-gray-100">
        <h3 className="font-bold text-gray-800 mb-2.5 flex items-center gap-2 text-sm">
          <FiCreditCard className="text-purple-600" aria-hidden="true" />
          {STRINGS.CHECKOUT.PAYMENT_METHOD}
        </h3>
        <div className="text-gray-600 text-xs sm:text-sm">
          {formData.paymentMethod === 'cod' && (
            <span className="font-semibold text-gray-800 flex items-center gap-1.5">
              💵 {STRINGS.CHECKOUT.COD}
            </span>
          )}
          {formData.paymentMethod === 'instapay' && (
            <div className="flex flex-col gap-1.5">
              <span className="text-purple-700 font-bold flex items-center gap-1.5">
                📱 {STRINGS.CHECKOUT.INSTAPAY}
              </span>
              <span className="text-xs text-gray-500">
                رقم التحويل: <strong className="font-mono text-purple-700 dir-ltr">{BUSINESS_CONFIG.INSTAPAY_NUMBER}</strong>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Items Summary with Zero-CLS Next.js Image */}
      <div className="space-y-4 mb-6">
        <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
          <FiPackage className="text-purple-600" aria-hidden="true" />
          {STRINGS.CART.ITEMS} ({items.length})
        </h3>
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={`${item.id}-${index}`} className="flex gap-3 bg-gray-50/70 p-2.5 rounded-xl border border-gray-100">
              <div className="relative w-14 h-14 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                <Image
                  src={item.image || '/placeholder-gift.png'}
                  alt={item.name}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <p className="font-semibold text-gray-800 text-xs sm:text-sm truncate">{item.name}</p>
                <p className="text-[11px] text-gray-500">
                  {STRINGS.CART.QUANTITY} {item.quantity} × {item.price} {STRINGS.PRODUCT.CURRENCY}
                </p>
              </div>
              <div className="flex items-center font-bold text-xs sm:text-sm text-gray-900">
                <bdi>{item.price * item.quantity}</bdi> {STRINGS.PRODUCT.CURRENCY}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mt-6">
        <button
          type="button"
          onClick={onBack}
          className="btn-outline flex-1 py-3 text-sm font-semibold"
          disabled={loading}
        >
          {STRINGS.COMMON.PREVIOUS}
        </button>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary flex-1 py-3 text-sm font-bold shadow-md shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-busy={loading}
        >
          {loading ? STRINGS.CHECKOUT.PLACING_ORDER : STRINGS.CHECKOUT.PLACE_ORDER}
        </button>
      </div>
    </div>
  );
});

/**
 * Highly Optimized Multi-Step Checkout Funnel
 */
const CheckoutPage = () => {
  const navigate = useNavigate();
  const submitLockRef = useRef(false);

  // 1. Atomic Zustand Selectors
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const cartHydrated = useCartStore((state) => state._hasHydrated);

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const authHydrated = useAuthStore((state) => state._hasHydrated);

  const isHydrated = cartHydrated && authHydrated;

  // 2. Authentication and Empty Cart Redirection
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

  // 3. React Query Loyalty Settings
  const { data: loyaltySettings } = useQuery({
    queryKey: ['public-loyalty-settings'],
    queryFn: () => settingsAPI.getLoyaltySettings().then((res) => res.data?.data),
    staleTime: 1000 * 60 * 10,
  });

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [idempotencyKey] = useState(
    () => `chk_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  );

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

  // 4. Stable Subtotal & Discount Calculations
  const subtotal = useMemo(() => {
    const boxGroups = new Set();
    const itemsTotal = items.reduce((total, item) => {
      let priceToUse = item.price;
      if (item.boxId) {
        boxGroups.add(item.boxId);
        const discountPercent = item.boxDiscount ?? BUSINESS_CONFIG.BOX_DISCOUNT_PERCENTAGE;
        priceToUse = item.price * (1 - discountPercent / 100);
      }
      let unitPrice = priceToUse;
      if (item.addons) {
        unitPrice += item.addons.reduce((sum, addon) => sum + (addon.price || 0), 0);
      }
      return total + unitPrice * (item.quantity || 1);
    }, 0);

    const boxesTotal = boxGroups.size * BUSINESS_CONFIG.BOX_BASE_PRICE_EGP;
    return itemsTotal + boxesTotal;
  }, [items]);

  const shippingCost = BUSINESS_CONFIG.SHIPPING_COST;
  const egpPerPoint = loyaltySettings?.egpPerPointRedeemed || 0.1;
  const pointsDiscount = useMemo(() => pointsToRedeem * egpPerPoint, [pointsToRedeem, egpPerPoint]);
  const total = useMemo(
    () => Math.max(0, subtotal + shippingCost - pointsDiscount),
    [subtotal, shippingCost, pointsDiscount]
  );

  const governorates = STRINGS.EGYPT_GOVERNORATES;

  // 5. Change handler with automatic error clearing
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setErrors((prev) => (prev[name] ? { ...prev, [name]: '' } : prev));
  }, []);

  const validateStep1 = useCallback(() => {
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
  }, [formData]);

  const handleNextStep1 = useCallback(() => {
    if (validateStep1()) {
      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [validateStep1]);

  // 6. Network Idempotent Order Submission with Hardware Lock
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submitLockRef.current) return;
    submitLockRef.current = true;
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
        idempotencyKey,
        pointsToRedeem: pointsToRedeem > 0 ? pointsToRedeem : undefined,
      };

      const response = await ordersAPI.create(orderData);

      if (response.data.success) {
        const finalOrder = response.data.data;
        clearCart();
        if (typeof finalOrder?.total === 'number' && Math.abs(finalOrder.total - total) > 0.01) {
          toast(
            `تم تأكيد طلبك بنجاح بإجمالي ${finalOrder.total} ج.م (تحديث تلقائي وفق أحدث الأسعار)`,
            { icon: 'ℹ️', duration: 5000 }
          );
        } else {
          toast.success(STRINGS.CHECKOUT.ORDER_SUCCESS);
        }
        navigate(`/account/orders?success=true&order=${finalOrder.orderNumber}`);
      }
    } catch (error) {
      submitLockRef.current = false;
      toast.error(error.response?.data?.message || STRINGS.CHECKOUT.ORDER_ERROR);
    } finally {
      setLoading(false);
    }
  };

  if (!isHydrated) {
    return (
      <div className="container-custom py-16 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto" />
      </div>
    );
  }

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
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container-custom">
        {/* Step Progress Indicators */}
        <nav aria-label="مراحل إتمام الطلب" className="flex items-center justify-center mb-8">
          {[
            STRINGS.CHECKOUT.SHIPPING_INFO,
            STRINGS.CHECKOUT.PAYMENT_METHOD,
            STRINGS.CHECKOUT.PLACE_ORDER,
          ].map((label, index) => (
            <div key={index} className="flex items-center">
              <div
                className={`w-9 sm:w-10 h-9 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                  step > index + 1
                    ? 'bg-green-500 text-white'
                    : step === index + 1
                      ? 'bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 text-white shadow-md shadow-purple-500/20'
                      : 'bg-gray-200 text-gray-500'
                }`}
                aria-current={step === index + 1 ? 'step' : undefined}
              >
                {step > index + 1 ? <FiCheck size={18} /> : index + 1}
              </div>
              <span
                className={`mx-2 hidden sm:inline text-sm ${
                  step === index + 1 ? 'font-bold text-gray-800' : 'text-gray-400 font-medium'
                }`}
              >
                {label}
              </span>
              {index < 2 && (
                <div
                  className={`w-8 sm:w-12 h-1 mx-2 rounded-full transition-colors ${
                    step > index + 1 ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </nav>

        <form onSubmit={handleSubmit} noValidate>
          <div className="grid lg:grid-cols-3 gap-8 items-start">
            {/* Step Form Column */}
            <div className="lg:col-span-2">
              {step === 1 && (
                <ShippingFormStep
                  formData={formData}
                  errors={errors}
                  onChange={handleChange}
                  onNext={handleNextStep1}
                  isAuthenticated={isAuthenticated}
                  governorates={governorates}
                />
              )}

              {step === 2 && (
                <PaymentMethodStep
                  formData={formData}
                  onChange={handleChange}
                  onBack={() => setStep(1)}
                  onNext={() => {
                    setStep(3);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              )}

              {step === 3 && (
                <OrderReviewStep
                  formData={formData}
                  items={items}
                  loading={loading}
                  onBack={() => setStep(2)}
                />
              )}
            </div>

            {/* Order Summary Sticky Sidebar */}
            <aside className="lg:col-span-1" aria-label={STRINGS.CHECKOUT.ORDER_SUMMARY}>
              <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100 sticky top-24 space-y-5">
                <h2 className="text-lg font-bold text-gray-800 pb-3 border-b border-gray-100">
                  {STRINGS.CHECKOUT.ORDER_SUMMARY}
                </h2>

                {/* Items Mini List with Next.js Image */}
                <div className="space-y-3.5 max-h-80 overflow-y-auto pr-1">
                  {items.map((item, index) => (
                    <div key={`${item.id}-${index}`} className="flex gap-3 items-center">
                      <div className="relative w-14 h-14 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100 border border-gray-200/60">
                        <Image
                          src={item.image || '/placeholder-gift.png'}
                          alt={item.name}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-purple-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-gray-800 truncate">{item.name}</p>
                        {item.boxId && (
                          <span className="inline-block bg-purple-100 text-purple-700 text-[9px] font-bold px-1.5 py-0.2 rounded-full mt-0.5">
                            {STRINGS.CART.IN_BOX}
                          </span>
                        )}
                        <p className="text-xs text-gray-500 font-medium">
                          <bdi>{item.price}</bdi> {STRINGS.PRODUCT.CURRENCY}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Loyalty Points Redemption Widget */}
                {loyaltySettings?.enabled !== false &&
                  user?.loyaltyPoints >= (loyaltySettings?.minPointsToRedeem || 100) && (
                    <div className="p-3.5 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 rounded-xl space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                          <FiAward className="text-purple-600" aria-hidden="true" />
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
                            setPointsToRedeem(e.target.checked ? user.loyaltyPoints : 0);
                          }}
                          className="w-4 h-4 mt-0.5 flex-shrink-0 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
                        />
                        <label
                          htmlFor="redeemPoints"
                          className="text-xs text-gray-700 font-medium cursor-pointer leading-relaxed"
                        >
                          خصم نقاط الرصيد ({user.loyaltyPoints} نقطة = -
                          {(user.loyaltyPoints * egpPerPoint).toFixed(2)} {STRINGS.PRODUCT.CURRENCY})
                        </label>
                      </div>
                    </div>
                  )}

                {/* Totals Breakdown */}
                <div className="space-y-2.5 pt-3 border-t border-gray-100 text-xs sm:text-sm">
                  <div className="flex justify-between text-gray-500">
                    <span>{STRINGS.CART.SUBTOTAL}</span>
                    <span className="font-semibold text-gray-800">
                      <bdi>{subtotal}</bdi> {STRINGS.PRODUCT.CURRENCY}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>{STRINGS.CART.SHIPPING}</span>
                    <span className="font-semibold text-gray-800">
                      <bdi>{shippingCost}</bdi> {STRINGS.PRODUCT.CURRENCY}
                    </span>
                  </div>
                  {pointsDiscount > 0 && (
                    <div className="flex justify-between text-green-600 font-bold">
                      <span>خصم نقاط الولاء</span>
                      <span>-{pointsDiscount.toFixed(2)} {STRINGS.PRODUCT.CURRENCY}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-baseline text-base sm:text-lg font-extrabold pt-3 border-t border-gray-200">
                  <span className="text-gray-900">{STRINGS.CART.TOTAL}</span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                    <bdi>{total}</bdi> {STRINGS.PRODUCT.CURRENCY}
                  </span>
                </div>
              </div>
            </aside>
          </div>
        </form>
      </div>
    </div>
  );
};

export default memo(CheckoutPage);
