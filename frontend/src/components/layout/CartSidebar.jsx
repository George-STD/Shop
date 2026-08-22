import React, { useEffect, useRef, useMemo, useCallback, memo } from 'react';
import Image from 'next/image';
import { Link } from 'react-router-dom';
import { FiX, FiTrash2, FiPlus, FiMinus, FiShoppingBag } from 'react-icons/fi';
import { useUIStore, useCartStore } from '../../store';
import { BUSINESS_CONFIG, STRINGS } from '../../constants';
import toast from 'react-hot-toast';

/**
 * Hardware-Accelerated, Memoized, and Accessible Real-Time Cart Drawer
 */
const CartSidebar = () => {
  const panelRef = useRef(null);
  const closeButtonRef = useRef(null);

  // 1. Atomic Zustand Selectors
  const closeCart = useUIStore((state) => state.closeCart);
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);

  // 2. Pure Memoized Calculations for Aggregated Subtotal & Bundle Discounts
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
  const grandTotal = useMemo(() => subtotal + shippingCost, [subtotal, shippingCost]);

  const totalItemsCount = useMemo(() => {
    return items.reduce((acc, item) => acc + (item.quantity || 1), 0);
  }, [items]);

  const formatPrice = useCallback(
    (price) => new Intl.NumberFormat('ar-EG').format(price),
    []
  );

  // 3. Stable Handlers
  const handleIncreaseQuantity = useCallback(
    (item) => {
      const result = updateQuantity(
        item.id,
        item.quantity + 1,
        item.selectedSize,
        item.selectedColor,
        item.selectedShape,
        item._variantsKey,
        item.boxId
      );

      if (result?.capped && result.maxStock !== null) {
        toast.error(`${STRINGS.CART.MAX_STOCK_REACHED}${result.maxStock}`);
      }
    },
    [updateQuantity]
  );

  const handleDecreaseQuantity = useCallback(
    (item) => {
      if (item.quantity > 1) {
        updateQuantity(
          item.id,
          item.quantity - 1,
          item.selectedSize,
          item.selectedColor,
          item.selectedShape,
          item._variantsKey,
          item.boxId
        );
      }
    },
    [updateQuantity]
  );

  const handleRemoveItem = useCallback(
    (item) => {
      removeItem(
        item.id,
        item.selectedSize,
        item.selectedColor,
        item.selectedShape,
        item._variantsKey,
        item.boxId
      );
      toast.success(STRINGS.PRODUCT.REMOVED_FROM_CART || 'تم الحذف من السلة');
    },
    [removeItem]
  );

  // 4. Keyboard Accessibility: Focus Trap & Escape Key Listener
  useEffect(() => {
    closeButtonRef.current?.focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeCart();
        return;
      }

      if (e.key === 'Tab' && panelRef.current) {
        const focusableElements = panelRef.current.querySelectorAll(
          'a[href], button:not([disabled]), textarea, input, select'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeCart]);

  return (
    <div
      id="cart-sidebar"
      className="fixed inset-0 z-[60]"
      role="dialog"
      aria-modal="true"
      aria-label={STRINGS.CART.TITLE || 'سلة المشتريات'}
    >
      {/* Semi-transparent Backdrop Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm overlay-backdrop"
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Hardware-Accelerated Cart Panel (GPU Compositing with translate3d) */}
      <div
        ref={panelRef}
        className="absolute top-0 left-0 h-full w-[85vw] sm:w-96 max-w-full bg-white shadow-2xl flex flex-col panel-slide-left transform-gpu will-change-transform"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 bg-gradient-to-r from-purple-50/40 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center shadow-sm">
              <FiShoppingBag size={18} className="text-purple-600" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-800">{STRINGS.CART.TITLE}</h2>
              {items.length > 0 && (
                <p className="text-xs text-gray-400 font-medium">
                  {totalItemsCount} {STRINGS.CART.ITEM}
                </p>
              )}
            </div>
          </div>
          <button
            ref={closeButtonRef}
            onClick={closeCart}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            aria-label={STRINGS.ACCESSIBILITY.CLOSE_CART || 'إغلاق السلة'}
          >
            <FiX size={22} aria-hidden="true" />
          </button>
        </div>

        {/* Scrollable Items Container */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 divide-y divide-gray-50">
          {items.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-50 to-pink-50 rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm">
                <span className="text-4xl" aria-hidden="true">🛒</span>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">{STRINGS.CART.EMPTY}</h3>
              <p className="text-gray-400 mb-8 text-sm">{STRINGS.CART.EMPTY_MESSAGE}</p>
              <Link
                to="/products"
                onClick={closeCart}
                className="btn-primary inline-block text-sm py-2.5 px-6"
              >
                {STRINGS.CART.START_SHOPPING} &larr;
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item, index) => {
                const itemEffectivePrice = item.boxId
                  ? item.price * (1 - (item.boxDiscount ?? BUSINESS_CONFIG.BOX_DISCOUNT_PERCENTAGE) / 100)
                  : item.price;

                return (
                  <div
                    key={`${item.id}-${item.selectedSize}-${item.selectedColor}-${item.selectedShape}-${item._variantsKey}-${item.boxId}-${index}`}
                    className="flex gap-3 bg-gray-50/70 p-3 rounded-2xl border border-gray-100 hover:border-purple-200 transition-colors"
                  >
                    {/* Zero-CLS Next.js Image Container */}
                    <Link
                      to={`/product/${item.slug}`}
                      onClick={closeCart}
                      className="w-20 h-20 flex-shrink-0 relative overflow-hidden rounded-xl bg-gray-100 border border-gray-200/60"
                      aria-label={item.name}
                    >
                      <Image
                        src={item.image || '/placeholder-gift.png'}
                        alt={item.name}
                        fill
                        sizes="80px"
                        className="object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </Link>

                    {/* Item Details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <Link
                          to={`/product/${item.slug}`}
                          onClick={closeCart}
                          className="font-semibold text-gray-800 hover:text-purple-700 line-clamp-2 text-xs sm:text-sm transition-colors leading-snug"
                        >
                          {item.name}
                        </Link>

                        {item.boxId && (
                          <span className="inline-block bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full mt-1">
                            {STRINGS.CART.IN_BOX}
                          </span>
                        )}

                        {/* Variants Meta */}
                        {(item.selectedSize || item.selectedColor || item.selectedShape) && (
                          <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                            {item.selectedSize && `${STRINGS.PRODUCT.SIZE} ${item.selectedSize}`}
                            {item.selectedSize && item.selectedColor && ' | '}
                            {item.selectedColor && `${STRINGS.PRODUCT.COLOR} ${item.selectedColor}`}
                            {(item.selectedSize || item.selectedColor) && item.selectedShape && ' | '}
                            {item.selectedShape && `${STRINGS.PRODUCT.SHAPE} ${item.selectedShape}`}
                          </p>
                        )}
                      </div>

                      {/* Price Row */}
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="font-bold text-gray-900 text-xs sm:text-sm whitespace-nowrap">
                          <bdi>{formatPrice(itemEffectivePrice)}</bdi> {STRINGS.PRODUCT.CURRENCY}
                        </span>
                        {item.boxId ? (
                          <span className="text-[11px] text-gray-400 line-through whitespace-nowrap">
                            <bdi>{formatPrice(item.price)}</bdi> {STRINGS.PRODUCT.CURRENCY}
                          </span>
                        ) : (
                          item.oldPrice && (
                            <span className="text-[11px] text-gray-400 line-through whitespace-nowrap">
                              <bdi>{formatPrice(item.oldPrice)}</bdi>
                            </span>
                          )
                        )}
                      </div>

                      {/* Quantity Actions & Delete Button */}
                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-gray-100/60">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleDecreaseQuantity(item)}
                            className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:border-purple-300 hover:bg-purple-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            disabled={item.quantity <= 1}
                            aria-label="تقليل الكمية"
                          >
                            <FiMinus size={12} aria-hidden="true" />
                          </button>
                          <span className="w-8 text-center font-bold text-xs sm:text-sm text-gray-800">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleIncreaseQuantity(item)}
                            className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:border-purple-300 hover:bg-purple-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            disabled={
                              Number.isFinite(Number(item.stock)) &&
                              item.quantity >= Number(item.stock)
                            }
                            aria-label="زيادة الكمية"
                          >
                            <FiPlus size={12} aria-hidden="true" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
                          aria-label={`حذف ${item.name} من السلة`}
                        >
                          <FiTrash2 size={14} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Checkout Summary */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 p-4 sm:p-5 space-y-4 bg-gray-50/80">
            {/* Subtotal Breakdown */}
            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between text-gray-500">
                <span>{STRINGS.CART.SUBTOTAL}</span>
                <span className="font-semibold text-gray-800">
                  <bdi>{formatPrice(subtotal)}</bdi> {STRINGS.PRODUCT.CURRENCY}
                </span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>{STRINGS.CART.SHIPPING}</span>
                <span className="font-semibold text-gray-800">
                  <bdi>{formatPrice(shippingCost)}</bdi> {STRINGS.PRODUCT.CURRENCY}
                </span>
              </div>

              <div className="flex justify-between text-base font-extrabold pt-2.5 border-t border-gray-200 text-gray-900">
                <span>{STRINGS.CART.TOTAL}</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                  <bdi>{formatPrice(grandTotal)}</bdi> {STRINGS.PRODUCT.CURRENCY}
                </span>
              </div>
            </div>

            {/* CTAs */}
            <div className="space-y-2">
              <Link
                to="/checkout"
                onClick={closeCart}
                className="btn-primary w-full text-center block text-sm py-3 font-bold shadow-md shadow-purple-500/20"
              >
                {STRINGS.CART.CHECKOUT} &larr;
              </Link>
              <Link
                to="/cart"
                onClick={closeCart}
                className="btn-secondary w-full text-center block text-sm py-2.5 font-medium"
              >
                {STRINGS.CART.VIEW_CART}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(CartSidebar);
