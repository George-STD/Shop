import React, { useState } from 'react';
import Image from 'next/image';
import { Link } from 'react-router-dom';
import { FiTrash2, FiPlus, FiMinus, FiShoppingBag, FiGift, FiStar } from 'react-icons/fi';
import { useCartStore } from '../store';
import { BUSINESS_CONFIG, STRINGS, SITE_CONFIG } from '../constants';
import { ConfirmModal } from '../components/common';
import toast from 'react-hot-toast';

const CartPage = () => {
  const { items, removeItem, updateQuantity, getTotal, clearCart, _hasHydrated } = useCartStore();
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  if (!_hasHydrated) {
    return (
      <div className="min-h-[60vh] min-h-[60dvh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const increaseQuantity = (item) => {
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
  };

  const subtotal = getTotal();
  const shippingCost = BUSINESS_CONFIG.SHIPPING_COST;
  const total = subtotal + shippingCost;

  if (items.length === 0) {
    return (
      <div className="min-h-screen min-h-dvh bg-gray-50 flex items-center py-12 px-4">
        <div className="container-custom max-w-xl text-center">
          <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-purple-100/80 relative overflow-hidden">
            <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 rounded-full bg-gradient-to-tr from-purple-100 to-pink-100 flex items-center justify-center text-purple-600 shadow-inner">
              <FiShoppingBag className="w-10 h-10 sm:w-12 sm:h-12" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-3">{STRINGS.CART.EMPTY}</h1>
            <p className="text-gray-500 text-sm sm:text-base mb-8 leading-relaxed max-w-md mx-auto">
              {STRINGS.CART.EMPTY_MESSAGE}، استكشف تشكيلة هدايا فور يو المميزة أو صمم بوكس هديتك بنفسك!
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              <Link
                to="/build-box"
                className="flex items-center justify-center gap-2 p-3.5 rounded-xl border border-purple-200 bg-purple-50/50 hover:bg-purple-100/70 text-purple-700 font-bold text-xs sm:text-sm transition-all"
              >
                <FiGift className="text-purple-600" />
                <span>صمم بوكس هديتك</span>
              </Link>
              <Link
                to="/products?sort=bestselling"
                className="flex items-center justify-center gap-2 p-3.5 rounded-xl border border-pink-200 bg-pink-50/50 hover:bg-pink-100/70 text-pink-700 font-bold text-xs sm:text-sm transition-all"
              >
                <FiStar className="text-pink-600" />
                <span>الأكثر مبيعاً</span>
              </Link>
            </div>

            <Link
              to="/products"
              className="btn-primary w-full py-3.5 text-sm sm:text-base font-bold shadow-lg shadow-purple-500/20 inline-flex items-center justify-center gap-2"
            >
              <FiShoppingBag />
              <span>{STRINGS.CART.START_SHOPPING}</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gray-50 min-h-screen min-h-dvh py-8">
        <div className="container-custom">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">{STRINGS.CART.TITLE}</h1>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item, index) => (
                <div key={`${item.id}-${index}`} className="bg-white rounded-2xl p-6 flex gap-6">
                  <Link to={`/product/${item.slug}`} className="relative w-24 h-24 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 block">
                    <Image
                      fill
                      sizes="96px"
                      src={item.image || SITE_CONFIG.PLACEHOLDER_IMAGE}
                      alt={item.name}
                      className="object-cover"
                    />
                  </Link>

                  <div className="flex-1">
                    <div className="flex justify-between">
                      <div>
                        <Link
                          to={`/product/${item.slug}`}
                          className="font-medium text-gray-800 hover:text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600"
                        >
                          {item.name}
                        </Link>
                        {item.boxId && (
                          <div className="mt-1">
                            <span className="inline-block bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full">
                              {STRINGS.CART.IN_BOX}
                            </span>
                          </div>
                        )}
                        {(item.selectedSize || item.selectedColor) && (
                          <p className="text-sm text-gray-500 mt-1">
                            {item.selectedSize && `${STRINGS.PRODUCT.SIZE} ${item.selectedSize}`}
                            {item.selectedSize && item.selectedColor && ' | '}
                            {item.selectedColor && `${STRINGS.PRODUCT.COLOR} ${item.selectedColor}`}
                          </p>
                        )}
                        {item.selectedShape && (
                          <p className="text-sm text-gray-500 mt-1">{STRINGS.PRODUCT.SHAPE} {item.selectedShape}</p>
                        )}
                        {item.selectedVariants && Object.keys(item.selectedVariants).length > 0 && (
                          <div className="text-sm text-gray-500 mt-1 space-y-0.5">
                            {Object.entries(item.selectedVariants).map(([group, value]) => (
                              <p key={group}>
                                {group}: {value}
                              </p>
                            ))}
                          </div>
                        )}
                        {item.boxSelections?.length > 0 && (
                          <div className="text-sm text-gray-500 mt-1 space-y-0.5">
                            {item.boxSelections.map((sel, i) => (
                              <p key={i}>
                                {sel.slotLabel}: {sel.chosenOption}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() =>
                          removeItem(
                            item.id,
                            item.selectedSize,
                            item.selectedColor,
                            item.selectedShape,
                            item._variantsKey,
                            item.boxId
                          )
                        }
                        aria-label={`حذف ${item.name} من السلة`}
                        className="text-red-500 hover:bg-red-50 p-2 rounded-lg"
                      >
                        <FiTrash2 />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center border border-gray-300 rounded-lg">
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.id,
                              item.quantity - 1,
                              item.selectedSize,
                              item.selectedColor,
                              item.selectedShape,
                              item._variantsKey,
                              item.boxId
                            )
                          }
                          aria-label={`تقليل كمية ${item.name}`}
                          className="p-2 hover:bg-gray-100"
                          disabled={item.quantity <= 1}
                        >
                          <FiMinus size={16} />
                        </button>
                        <span className="px-4 font-medium">{item.quantity}</span>
                        <button
                          onClick={() => increaseQuantity(item)}
                          aria-label={`زيادة كمية ${item.name}`}
                          className="p-2 hover:bg-gray-100"
                          disabled={
                            Number.isFinite(Number(item.stock)) &&
                            item.quantity >= Number(item.stock)
                          }
                        >
                          <FiPlus size={16} />
                        </button>
                      </div>

                      <div className="text-left dir-ltr" dir="ltr">
                        <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                          {(item.boxId
                            ? item.price * (1 - (item.boxDiscount ?? BUSINESS_CONFIG.BOX_DISCOUNT_PERCENTAGE) / 100)
                            : item.price) * item.quantity}{' '}
                          {STRINGS.PRODUCT.CURRENCY}
                        </span>
                        {item.boxId ? (
                          <span className="text-sm text-gray-400 line-through mr-2">
                            {item.price * item.quantity} {STRINGS.PRODUCT.CURRENCY}
                          </span>
                        ) : (
                          item.oldPrice && (
                            <span className="text-sm text-gray-400 line-through mr-2">
                              {item.oldPrice * item.quantity} {STRINGS.PRODUCT.CURRENCY}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => setIsClearModalOpen(true)}
                className="text-red-500 hover:text-red-600 font-medium hover:underline inline-flex items-center gap-2 p-1"
              >
                <FiTrash2 className="w-4 h-4" />
                <span>{STRINGS.CART.CLEAR_CART}</span>
              </button>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl p-6 sticky sticky-header-offset transition-all duration-300">
                <h2 className="text-xl font-bold text-gray-800 mb-6">{STRINGS.CART.ORDER_SUMMARY}</h2>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{STRINGS.CART.SUBTOTAL}</span>
                    <span>{subtotal} {STRINGS.PRODUCT.CURRENCY}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">{STRINGS.CART.SHIPPING}</span>
                    <span className="font-semibold text-gray-800">
                      يبدأ من {BUSINESS_CONFIG.SHIPPING_COST_CAIRO} {STRINGS.PRODUCT.CURRENCY}
                    </span>
                  </div>
                  <p className="text-[11px] text-purple-700 bg-purple-50/70 p-2 rounded-lg font-medium leading-relaxed">
                    🚚 95 ج.م داخل القاهرة | 125 ج.م للمحافظات الأخرى
                  </p>
                  <div className="border-t pt-4 flex justify-between text-lg font-bold">
                    <span>{STRINGS.CART.TOTAL}</span>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                      {total} {STRINGS.PRODUCT.CURRENCY}
                    </span>
                  </div>
                </div>

                <Link to="/checkout" className="btn-primary w-full text-center block mb-4">
                  {STRINGS.CART.CHECKOUT}
                </Link>

                <Link to="/products" className="btn-outline w-full text-center block">
                  {STRINGS.CART.CONTINUE_SHOPPING}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={() => {
          clearCart();
          setIsClearModalOpen(false);
          toast.success(STRINGS.CART.CLEARED_SUCCESS || 'تم إفراغ سلة المشتريات');
        }}
        title="تفريغ سلة المشتريات"
        message="هل أنت متأكد من رغبتك في حذف جميع المنتجات من سلة المشتريات؟"
        confirmText="تفريغ السلة"
        cancelText="تراجع"
        type="danger"
      />
    </>
  );
};

export default CartPage;
