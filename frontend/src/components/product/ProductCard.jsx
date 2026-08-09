import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiHeart, FiShoppingBag, FiEye } from 'react-icons/fi';
import { STRINGS } from '../../constants';
import { useCartStore, useWishlistStore, useAuthStore } from '../../store';
import { optimizeCloudinaryUrl } from '../../utils/optimizeImage';
import toast from 'react-hot-toast';

import { authAPI } from '../../services/api';

const ProductCard = ({ product }) => {
  if (!product) return null;

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { addItem } = useCartStore();
  const {
    addItem: addToWishlist,
    removeItem: removeFromWishlist,
    isInWishlist,
  } = useWishlistStore();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const inWishlist = mounted && isInWishlist(product._id);

  const handleAddToCart = (e) => {
    e.preventDefault();
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
  };

  const handleToggleWishlist = (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error(STRINGS.PRODUCT.LOGIN_TO_ADD_WISHLIST);
      navigate('/account');
      return;
    }

    if (inWishlist) {
      removeFromWishlist(product._id);
      authAPI.removeFromWishlist(product._id).catch(() => {});
      toast.success(STRINGS.PRODUCT.REMOVED_FROM_WISHLIST);
    } else {
      addToWishlist(product);
      authAPI.addToWishlist(product._id).catch(() => {});
      toast.success(STRINGS.PRODUCT.ADDED_TO_WISHLIST);
    }
  };

  const discount = product.oldPrice ? Math.round((1 - product.price / product.oldPrice) * 100) : 0;

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ar-EG').format(price);
  };

  return (
    <div className="card product-card group min-w-0 flex flex-col h-full overflow-hidden w-full">
      {/* Image Container */}
      <div className="relative overflow-hidden bg-gray-50 aspect-square">
        <Link to={`/product/${product.slug}`} aria-label={product.name}>
          <img
            src={optimizeCloudinaryUrl(product.images?.[0]?.url, 320) || '/images/placeholder.jpg'}
            alt={product.images?.[0]?.alt || product.name}
            className="product-image"
            loading="lazy"
            width={320}
            height={320}
          />
        </Link>

        {/* Badges */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5">
          {discount > 0 && <span className="badge badge-sale">-{discount}%</span>}
          {product.isNewArrival && <span className="badge badge-new">{STRINGS.PRODUCT.NEW}</span>}
          {product.isBestseller && <span className="badge badge-bestseller">{STRINGS.PRODUCT.BESTSELLER}</span>}
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <button
            onClick={handleToggleWishlist}
            className={`quick-action-btn ${inWishlist ? '!bg-red-500 !text-white shadow-red-500/30' : ''}`}
            title={inWishlist ? STRINGS.PRODUCT.REMOVE_FROM_WISHLIST : STRINGS.PRODUCT.ADD_TO_WISHLIST}
          >
            <FiHeart className={inWishlist ? 'fill-current' : ''} size={16} />
          </button>
          <Link
            to={`/product/${product.slug}`}
            className="quick-action-btn"
            title={STRINGS.PRODUCT.QUICK_VIEW}
            aria-label={`${STRINGS.PRODUCT.QUICK_VIEW} - ${product.name}`}
          >
            <FiEye size={16} />
          </Link>
          <button
            onClick={handleAddToCart}
            className="quick-action-btn"
            title={STRINGS.PRODUCT.ADD_TO_CART}
            disabled={Number(product.stock) === 0}
          >
            <FiShoppingBag size={16} />
          </button>
        </div>

        {/* Out of stock overlay */}
        {Number(product.stock) === 0 && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-gray-900/80 text-white px-4 py-2 rounded-full text-sm font-medium">
              {STRINGS.PRODUCT.OUT_OF_STOCK}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-2.5 sm:p-4 flex flex-col flex-grow min-w-0">
        {/* Category */}
        {product.category && (
          <div className="text-xs text-purple-700 font-bold uppercase tracking-wider mb-1">
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

        {/* Name */}
        <h3 className="mt-1.5">
          <Link
            to={`/product/${product.slug}`}
            className="font-semibold text-gray-800 hover:text-purple-700 line-clamp-2 transition-colors duration-200 text-xs sm:text-sm md:text-base break-words whitespace-normal"
          >
            {product.name}
          </Link>
        </h3>

        {/* Rating */}
        {product.rating?.count > 0 && (
          <div className="flex items-center gap-1.5 mt-2 rating-stars">
            <div className="flex text-amber-400 text-sm">
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className={i < Math.round(product.rating.average) ? '' : 'opacity-30'}
                >
                  ★
                </span>
              ))}
            </div>
            <span className="text-xs text-gray-400">({product.rating.count})</span>
          </div>
        )}

        {/* Price */}
        <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-auto pt-2.5 min-w-0">
          <span className="text-sm sm:text-base md:text-lg font-bold text-gray-900 whitespace-nowrap">
            <bdi>{formatPrice(product.price)}</bdi>{' '}
            <span className="text-xs font-normal text-gray-500">{STRINGS.PRODUCT.CURRENCY}</span>
          </span>
          {product.oldPrice && (
            <span className="text-xs sm:text-sm text-gray-500 line-through whitespace-nowrap">
              <bdi>{formatPrice(product.oldPrice)}</bdi>{' '}
              <span className="text-[10px] sm:text-xs font-normal text-gray-500">{STRINGS.PRODUCT.CURRENCY}</span>
            </span>
          )}
        </div>

        {/* Add to Cart Button - Mobile */}
        <button
          onClick={handleAddToCart}
          disabled={Number(product.stock) === 0}
          className="w-full mt-3 bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white py-2 sm:py-2.5 rounded-xl font-medium 
                     hover:from-purple-600 hover:to-fuchsia-600 hover:shadow-lg hover:shadow-purple-500/25 
                     transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none
                     active:scale-[0.98] md:hidden text-xs sm:text-sm whitespace-normal break-words leading-tight flex items-center justify-center gap-1"
        >
          {Number(product.stock) === 0 ? STRINGS.PRODUCT.OUT_OF_STOCK : (
            <>
              <FiShoppingBag className="shrink-0" />
              <span className="line-clamp-2">{STRINGS.PRODUCT.ADD_TO_CART}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
