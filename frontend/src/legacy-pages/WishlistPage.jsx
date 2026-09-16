import React, { useState } from 'react';
import Image from 'next/image';
import { Link, Navigate } from 'react-router-dom';
import { FiHeart, FiTrash2, FiShoppingCart, FiShoppingBag } from 'react-icons/fi';
import { useWishlistStore, useCartStore, useAuthStore } from '../store';
import { STRINGS, SITE_CONFIG } from '../constants';
import { ConfirmModal } from '../components/common';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const WishlistPage = () => {
  const { items, removeItem, clearWishlist } = useWishlistStore();
  const { addItem } = useCartStore();
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  const handleRemove = (id) => {
    removeItem(id);
    authAPI.removeFromWishlist(id).catch(() => {});
  };

  if (!_hasHydrated) {
    return (
      <div className="min-h-[60vh] min-h-[60dvh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/account" replace />;
  }

  const handleAddToCart = (product) => {
    const cartProduct = {
      _id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      oldPrice: product.oldPrice,
      stock: product.stock,
      images: [{ url: product.image }],
    };
    const result = addItem(cartProduct);

    if (!result?.success) {
      toast.error(STRINGS.PRODUCT.OUT_OF_STOCK_QTY);
      return;
    }

    if (result.capped && result.maxStock !== null) {
      toast.success(`${STRINGS.PRODUCT.ADDED_MAX_STOCK}${result.maxStock})`);
    } else {
      toast.success(STRINGS.PRODUCT.ADDED_TO_CART);
    }

    removeItem(product.id);
  };

  return (
    <>
      <div className="min-h-screen min-h-dvh bg-gray-50 py-8">
        <div className="container-custom">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{STRINGS.WISHLIST.TITLE}</h1>
            </div>
            {items.length > 0 && (
              <button
                type="button"
                onClick={() => setIsClearModalOpen(true)}
                className="text-red-500 hover:text-red-600 flex items-center gap-2 font-medium"
              >
                <FiTrash2 />
                {STRINGS.COMMON.CLEAR_ALL}
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="max-w-xl mx-auto text-center py-10 px-4">
              <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-pink-100/80 relative overflow-hidden">
                <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 rounded-full bg-gradient-to-tr from-pink-100 to-purple-100 flex items-center justify-center text-pink-500 shadow-inner">
                  <FiHeart className="w-10 h-10 sm:w-12 sm:h-12" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-3">{STRINGS.WISHLIST.EMPTY}</h2>
                <p className="text-gray-500 text-sm sm:text-base mb-8 leading-relaxed max-w-md mx-auto">
                  {STRINGS.WISHLIST.EMPTY_DESC || STRINGS.WISHLIST.EMPTY_MESSAGE}، تصفح أجمل تشكيلات الهدايا واحفظ ما يعجبك بضغطة زر!
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                  <Link
                    to="/gift-finder"
                    className="flex items-center justify-center gap-2 p-3.5 rounded-xl border border-purple-200 bg-purple-50/50 hover:bg-purple-100/70 text-purple-700 font-bold text-xs sm:text-sm transition-all"
                  >
                    <span>🎯 باحث الهدايا الذكي</span>
                  </Link>
                  <Link
                    to="/products"
                    className="flex items-center justify-center gap-2 p-3.5 rounded-xl border border-pink-200 bg-pink-50/50 hover:bg-pink-100/70 text-pink-700 font-bold text-xs sm:text-sm transition-all"
                  >
                    <span>🛍️ جميع المنتجات</span>
                  </Link>
                </div>

                <Link
                  to="/products"
                  className="btn-primary w-full py-3.5 text-sm sm:text-base font-bold shadow-lg shadow-purple-500/20 inline-flex items-center justify-center gap-2"
                >
                  <FiShoppingBag />
                  <span>{STRINGS.PRODUCT.BROWSE_PRODUCTS}</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {items.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm group"
                >
                  <div className="relative aspect-square overflow-hidden bg-gray-50">
                    <Image
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      src={product.image || SITE_CONFIG.PLACEHOLDER_IMAGE}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemove(product.id)}
                      aria-label={`حذف ${product.name} من المفضلة`}
                      className="absolute top-3 left-3 p-2 bg-white rounded-full shadow-md text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <FiTrash2 />
                    </button>
                  </div>

                  <div className="p-4">
                    <Link to={`/product/${product.slug}`} className="block">
                      <h3 className="font-medium text-gray-800 hover:text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-2 line-clamp-2">
                        {product.name}
                      </h3>
                    </Link>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {product.oldPrice && (
                          <span className="text-gray-400 line-through text-sm">
                            {product.oldPrice} {STRINGS.PRODUCT.CURRENCY}
                          </span>
                        )}
                        <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                          {product.price} {STRINGS.PRODUCT.CURRENCY}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleAddToCart(product)}
                      className="mt-4 w-full btn-primary flex items-center justify-center gap-2"
                    >
                      <FiShoppingCart />
                      {STRINGS.PRODUCT.ADD_TO_CART}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={() => {
          clearWishlist();
          setIsClearModalOpen(false);
          toast.success(STRINGS.WISHLIST.CLEARED_SUCCESS || 'تم إفراغ قائمة المفضلة');
        }}
        title="تفريغ قائمة المفضلة"
        message="هل أنت متأكد من رغبتك في حذف جميع المنتجات من قائمة المفضلة؟"
        confirmText="تفريغ المفضلة"
        cancelText="تراجع"
        type="danger"
      />
    </>
  );
};

export default WishlistPage;
