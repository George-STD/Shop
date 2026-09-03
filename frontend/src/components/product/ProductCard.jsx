import React, { useState, useEffect, useCallback, memo } from 'react';
import Image from 'next/image';
import { Link, useNavigate } from 'react-router-dom';
import { FiHeart, FiShoppingBag, FiEye } from 'react-icons/fi';
import { STRINGS } from '../../constants';
import { useCartStore, useWishlistStore, useAuthStore } from '../../store';
import { optimizeCloudinaryUrl } from '../../utils/optimizeImage';
import toast from 'react-hot-toast';
import { authAPI } from '../../services/api';

/**
 * Ultra-Optimized, Fully Accessible Product Card
 */
const ProductCard = ({ product, priority = false }) => {
  const [mounted, setMounted] = useState(false);
  const [wishlistPending, setWishlistPending] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Granular Zustand Selectors (Zero full-tree render cascade on cart/wishlist mutations)
  const addItem = useCartStore((state) => state.addItem);
  const addToWishlist = useWishlistStore((state) => state.addItem);
  const removeFromWishlist = useWishlistStore((state) => state.removeItem);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const inWishlist = useWishlistStore(
    useCallback(
      (state) => (mounted && product?._id ? state.isInWishlist(product._id) : false),
      [mounted, product?._id]
    )
  );

  // 2. Stable Action Handlers
  const handleAddToCart = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    const result = addItem(product, 1);
    if (!result?.success) {
      toast.error(STRINGS.PRODUCT.OUT_OF_STOCK_QTY);
      return;
    }

    if (result.capped && result.maxStock !== null) {
      toast.success(`${STRINGS.PRODUCT.ADDED_MAX_STOCK}${result.maxStock})`);
      return;
    }

    toast.success(STRINGS.PRODUCT.ADDED_TO_CART);
  }, [addItem, product]);

  const handleToggleWishlist = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error(STRINGS.PRODUCT.LOGIN_TO_ADD_WISHLIST);
      navigate('/account');
      return;
    }
    if (wishlistPending) return;

    const wasInWishlist = inWishlist;
    setWishlistPending(true);
    if (wasInWishlist) removeFromWishlist(product._id);
    else addToWishlist(product);

    try {
      if (wasInWishlist) await authAPI.removeFromWishlist(product._id);
      else await authAPI.addToWishlist(product._id);
      toast.success(wasInWishlist ? STRINGS.PRODUCT.REMOVED_FROM_WISHLIST : STRINGS.PRODUCT.ADDED_TO_WISHLIST);
    } catch (_) {
      if (wasInWishlist) addToWishlist(product);
      else removeFromWishlist(product._id);
      toast.error('تعذر تحديث المفضلة. تمت استعادة حالتها السابقة.');
    } finally {
      setWishlistPending(false);
    }
  }, [addToWishlist, inWishlist, isAuthenticated, navigate, product, removeFromWishlist, wishlistPending]);

  const discount = product.oldPrice ? Math.round((1 - product.price / product.oldPrice) * 100) : 0;
  const isOutOfStock = Number(product.stock) === 0;

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ar-EG').format(price);
  };

  const imageUrl =
    optimizeCloudinaryUrl(product?.images?.[0]?.url, 400) ||
    product?.images?.[0]?.url ||
    '/placeholder-gift.png';

  if (!product) return null;

  return (
    <article
      className="card product-card group min-w-0 flex flex-col h-full overflow-hidden w-full bg-white rounded-2xl border border-gray-100/80 hover:border-purple-200 hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-300"
      aria-label={product.name}
    >
      {/* Zero-CLS Aspect Ratio Preserved Image Container */}
      <div className="relative overflow-hidden bg-gray-50 aspect-square w-full">
        <Link
          to={`/product/${product.slug}`}
          className="block w-full h-full relative"
          aria-label={product.name}
        >
          <Image
            src={imageUrl}
            alt={product.images?.[0]?.alt || product.name}
            fill
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </Link>

        {/* Status Badges */}
        <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 flex flex-col gap-1.5 z-10 pointer-events-none">
          {discount > 0 && (
            <span className="badge badge-sale shadow-sm text-[10px] sm:text-xs font-bold px-2 py-0.5">
              -{discount}%
            </span>
          )}
          {product.isNewArrival && (
            <span className="badge badge-new shadow-sm text-[10px] sm:text-xs font-bold px-2 py-0.5">
              {STRINGS.PRODUCT.NEW}
            </span>
          )}
          {product.isBestseller && (
            <span className="badge badge-bestseller shadow-sm text-[10px] sm:text-xs font-bold px-2 py-0.5">
              {STRINGS.PRODUCT.BESTSELLER}
            </span>
          )}
        </div>

        {/* Quick Actions (Accessible >44px Mobile Tap Bounds) */}
        <div className="quick-actions" role="toolbar" aria-label="إجراءات المنتج السريعة">
          <button
            type="button"
            onClick={handleToggleWishlist}
            className={`quick-action-btn min-w-[44px] min-h-[44px] flex items-center justify-center ${
              inWishlist ? '!bg-red-500 !text-white shadow-lg shadow-red-500/30' : ''
            }`}
            title={inWishlist ? STRINGS.PRODUCT.REMOVE_FROM_WISHLIST : STRINGS.PRODUCT.ADD_TO_WISHLIST}
            aria-label={inWishlist ? STRINGS.PRODUCT.REMOVE_FROM_WISHLIST : STRINGS.PRODUCT.ADD_TO_WISHLIST}
            aria-busy={wishlistPending}
            disabled={wishlistPending}
          >
            <FiHeart className={inWishlist ? 'fill-current' : ''} size={18} aria-hidden="true" />
          </button>

          <Link
            to={`/product/${product.slug}`}
            className="quick-action-btn min-w-[44px] min-h-[44px] flex items-center justify-center"
            title={STRINGS.PRODUCT.QUICK_VIEW}
            aria-label={`${STRINGS.PRODUCT.QUICK_VIEW} - ${product.name}`}
          >
            <FiEye size={18} aria-hidden="true" />
          </Link>

          <button
            type="button"
            onClick={handleAddToCart}
            className="quick-action-btn min-w-[44px] min-h-[44px] flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
            title={STRINGS.PRODUCT.ADD_TO_CART}
            aria-label={`${STRINGS.PRODUCT.ADD_TO_CART} - ${product.name}`}
            disabled={isOutOfStock}
          >
            <FiShoppingBag size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Out Of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center z-20 pointer-events-none">
            <span className="bg-gray-900/90 text-white px-3.5 py-1.5 rounded-full text-xs font-bold shadow-md">
              {STRINGS.PRODUCT.OUT_OF_STOCK}
            </span>
          </div>
        )}
      </div>

      {/* Content Meta Area */}
      <div className="p-2.5 sm:p-4 flex flex-col flex-grow min-w-0 justify-between">
        <div>
          {/* Category Links */}
          {product.category && (
            <div className="text-[11px] sm:text-xs text-purple-700 font-bold uppercase tracking-wider mb-1">
              {(Array.isArray(product.category) ? product.category : [product.category])
                .filter(Boolean)
                .map((cat, i, arr) => (
                  <span key={cat._id || i}>
                    <Link
                      to={`/products?category=${cat.slug}`}
                      className="inline-block py-0.5 hover:text-purple-900 transition-colors"
                    >
                      {cat.name}
                    </Link>
                    {i < arr.length - 1 && ' · '}
                  </span>
                ))}
            </div>
          )}

          {/* Product Name */}
          <h3 className="mt-1">
            <Link
              to={`/product/${product.slug}`}
              className="font-semibold text-gray-800 hover:text-purple-700 line-clamp-2 transition-colors duration-200 text-xs sm:text-sm md:text-base break-words leading-snug"
            >
              {product.name}
            </Link>
          </h3>

          {/* Ratings */}
          {product.rating?.count > 0 && (
            <div className="flex items-center gap-1.5 mt-2 rating-stars" aria-label={`تقييم ${product.rating.average} من 5`}>
              <div className="flex text-amber-400 text-xs sm:text-sm">
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className={i < Math.round(product.rating.average) ? '' : 'opacity-30'}
                    aria-hidden="true"
                  >
                    ★
                  </span>
                ))}
              </div>
              <span className="text-[11px] text-gray-400 font-medium">({product.rating.count})</span>
            </div>
          )}
        </div>

        {/* Pricing & Mobile Quick Action */}
        <div className="mt-3 pt-2 border-t border-gray-50">
          <div className="flex flex-wrap items-baseline gap-1.5 sm:gap-2 min-w-0">
            <span className="text-sm sm:text-base md:text-lg font-extrabold text-gray-900 whitespace-nowrap">
              <bdi>{formatPrice(product.price)}</bdi>{' '}
              <span className="text-[11px] font-normal text-gray-500">{STRINGS.PRODUCT.CURRENCY}</span>
            </span>
            {product.oldPrice && (
              <span className="text-xs sm:text-sm text-gray-400 line-through whitespace-nowrap">
                <bdi>{formatPrice(product.oldPrice)}</bdi>{' '}
                <span className="text-[10px] font-normal text-gray-400">{STRINGS.PRODUCT.CURRENCY}</span>
              </span>
            )}
          </div>

          {/* Mobile Direct Add Button */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className="w-full mt-2.5 bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white py-2 sm:py-2.5 rounded-xl font-bold 
                       hover:from-purple-600 hover:to-fuchsia-600 hover:shadow-lg hover:shadow-purple-500/25 
                       transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none
                       active:scale-[0.98] md:hidden text-xs sm:text-sm flex items-center justify-center gap-1.5 min-h-[44px]"
            aria-label={`${STRINGS.PRODUCT.ADD_TO_CART} - ${product.name}`}
          >
            {isOutOfStock ? (
              STRINGS.PRODUCT.OUT_OF_STOCK
            ) : (
              <>
                <FiShoppingBag size={16} aria-hidden="true" />
                <span>{STRINGS.PRODUCT.ADD_TO_CART}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
};

// 3. Strict Custom arePropsEqual Function for React.memo
const arePropsEqual = (prevProps, nextProps) => {
  if (prevProps.priority !== nextProps.priority) return false;
  const p = prevProps.product;
  const n = nextProps.product;
  if (p?._id !== n?._id) return false;
  if (p?.slug !== n?.slug) return false;
  if (p?.price !== n?.price) return false;
  if (p?.oldPrice !== n?.oldPrice) return false;
  if (p?.stock !== n?.stock) return false;
  if (p?.name !== n?.name) return false;
  if (p?.images?.[0]?.url !== n?.images?.[0]?.url) return false;
  if (p?.images?.[0]?.alt !== n?.images?.[0]?.alt) return false;
  if (p?.isNewArrival !== n?.isNewArrival) return false;
  if (p?.isBestseller !== n?.isBestseller) return false;
  if (p?.rating?.average !== n?.rating?.average) return false;
  if (p?.rating?.count !== n?.rating?.count) return false;
  const catKey = (arr) => (arr || []).map((c) => c?._id || c?.name || c).join(',');
  if (catKey(p?.category) !== catKey(n?.category)) return false;
  return true;
};

export default memo(ProductCard, arePropsEqual);
