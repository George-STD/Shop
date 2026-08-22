import React, { useState, useRef, useCallback, useEffect, useMemo, memo } from 'react';
import Image from 'next/image';
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  FiHeart,
  FiShare2,
  FiMinus,
  FiPlus,
  FiCheck,
  FiTruck,
  FiRotateCcw,
  FiShield,
  FiZoomIn,
} from 'react-icons/fi';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import { productsAPI, reviewsAPI, settingsAPI } from '../services/api';
import { useCartStore, useWishlistStore, useAuthStore } from '../store';
import ProductCard from '../components/product/ProductCard';
import toast from 'react-hot-toast';
import { STRINGS } from '../constants';

// Safe image helper
const getOptImages = (opt) => {
  if (opt?.images?.length) return opt.images.filter(Boolean);
  if (opt?.image) return [opt.image];
  return [];
};

/**
 * Optimized Review Form Component
 */
const ReviewForm = memo(function ReviewForm({ productId, refreshReviews }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [form, setForm] = useState({
    rating: 0,
    title: '',
    comment: '',
    guestName: '',
    guestEmail: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleRating = useCallback((r) => {
    setForm((prev) => ({ ...prev, rating: r }));
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setError('');
      if (form.rating === 0) return setError(STRINGS.PRODUCT.REVIEW_RATING_REQUIRED);
      if (!isAuthenticated && (!form.guestName || !form.guestEmail))
        return setError(STRINGS.PRODUCT.REVIEW_GUEST_REQUIRED);

      setLoading(true);
      try {
        await reviewsAPI.create({
          product: productId,
          rating: form.rating,
          title: form.title,
          comment: form.comment,
          guestName: isAuthenticated ? undefined : form.guestName,
          guestEmail: isAuthenticated ? undefined : form.guestEmail,
        });
        setSuccess(true);
        setForm({ rating: 0, title: '', comment: '', guestName: '', guestEmail: '' });
        refreshReviews();
      } catch (err) {
        const errorData = err.response?.data;
        if (errorData?.errors?.length > 0) {
          setError(errorData.errors[0].msg);
        } else if (errorData?.message) {
          setError(errorData.message);
        } else {
          setError(STRINGS.PRODUCT.REVIEW_ERROR);
        }
      } finally {
        setLoading(false);
      }
    },
    [form, isAuthenticated, productId, refreshReviews]
  );

  if (success) {
    return (
      <div className="bg-green-50 text-green-700 p-4 rounded-xl mb-6 text-center shadow-sm" role="status">
        {STRINGS.PRODUCT.REVIEW_SUCCESS}
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded-xl shadow-sm border mb-8 max-w-2xl mx-auto"
      aria-label={STRINGS.PRODUCT.ADD_REVIEW}
    >
      <h3 className="font-bold text-lg mb-4 text-gray-800">{STRINGS.PRODUCT.ADD_REVIEW}</h3>
      <div className="flex items-center gap-2 mb-4">
        <span className="font-medium text-gray-700">{STRINGS.PRODUCT.RATING_LABEL}</span>
        <div className="flex" role="radiogroup" aria-label={STRINGS.PRODUCT.RATING_LABEL}>
          {[1, 2, 3, 4, 5].map((r) => (
            <button
              type="button"
              key={r}
              onClick={() => handleRating(r)}
              className={`text-2xl transition-colors ${
                r <= form.rating ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-200'
              }`}
              aria-label={`${r} Stars`}
            >
              ★
            </button>
          ))}
        </div>
      </div>
      <input
        type="text"
        name="title"
        placeholder={STRINGS.PRODUCT.REVIEW_TITLE_PLACEHOLDER}
        value={form.title}
        onChange={handleChange}
        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 mb-3 bg-gray-50 text-sm"
      />
      <textarea
        name="comment"
        placeholder={STRINGS.PRODUCT.REVIEW_COMMENT_PLACEHOLDER}
        value={form.comment}
        onChange={handleChange}
        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 mb-3 bg-gray-50 min-h-[100px] text-sm"
        required
      />
      {!isAuthenticated && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <input
            type="text"
            name="guestName"
            placeholder={STRINGS.PRODUCT.REVIEW_NAME_PLACEHOLDER}
            value={form.guestName}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50 text-sm"
            required
          />
          <input
            type="email"
            name="guestEmail"
            placeholder={STRINGS.PRODUCT.REVIEW_EMAIL_PLACEHOLDER}
            value={form.guestEmail}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50 text-sm"
            required
          />
        </div>
      )}
      {error && <div className="text-red-500 text-sm mb-3 font-medium" role="alert">{error}</div>}
      <button
        type="submit"
        className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        disabled={loading}
      >
        {loading ? STRINGS.PRODUCT.SUBMITTING_REVIEW : STRINGS.PRODUCT.SUBMIT_REVIEW}
      </button>
    </form>
  );
});

/**
 * Granular & Memoized Master Product Page
 */
const ProductPage = () => {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Local interaction states
  const [quantity, setQuantity] = useState(1);
  const [isZooming, setIsZooming] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [activeBoxImage, setActiveBoxImage] = useState(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const imgContainerRef = useRef(null);

  // Variant & Customization states
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedShape, setSelectedShape] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [boxSelections, setBoxSelections] = useState({});
  const [selectedVariants, setSelectedVariants] = useState({});

  const [activeTab, setActiveTab] = useState(
    searchParams.get('tab') === 'reviews' ? 'reviews' : 'description'
  );

  // 1. Granular Zustand Selectors (Prevents full-tree re-rendering on unrelated store updates)
  const addItem = useCartStore((state) => state.addItem);
  const addToWishlist = useWishlistStore((state) => state.addItem);
  const removeFromWishlist = useWishlistStore((state) => state.removeItem);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // 2. React Query Data Hooks with stable cache keys
  const { data: loyaltySettings } = useQuery({
    queryKey: ['public-loyalty-settings'],
    queryFn: () => settingsAPI.getLoyaltySettings().then((res) => res.data?.data),
    staleTime: 1000 * 60 * 10,
  });

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => productsAPI.getBySlug(slug).then((res) => res.data.data),
    staleTime: 1000 * 60 * 5,
  });

  const inWishlist = useWishlistStore(
    useCallback(
      (state) => (product?._id ? state.isInWishlist(product._id) : false),
      [product?._id]
    )
  );

  const { data: relatedProducts } = useQuery({
    queryKey: ['products', 'related', product?._id],
    queryFn: () => productsAPI.getRelated(product._id).then((res) => res.data.data),
    enabled: !!product?._id,
    staleTime: 1000 * 60 * 5,
  });

  const { data: reviewsData } = useQuery({
    queryKey: ['reviews', product?._id],
    queryFn: () => reviewsAPI.getByProduct(product._id).then((res) => res.data),
    enabled: !!product?._id,
  });

  // Default variant selection on load
  const defaultsAppliedRef = useRef(false);
  useEffect(() => {
    if (!product?.variantGroups?.length || defaultsAppliedRef.current) return;
    const defaults = {};
    for (const group of product.variantGroups) {
      if (group.defaultOption) {
        defaults[group.name] = group.defaultOption;
      }
    }
    if (Object.keys(defaults).length > 0) {
      setSelectedVariants(defaults);
      defaultsAppliedRef.current = true;
    }
  }, [product]);

  // Gallery image calculations memoized
  const filteredImages = useMemo(() => {
    if (!product?.images) return [];
    return product.images.filter((img) => {
      const tags = img.variantTags || {};
      if (Object.keys(tags).length === 0) return true;
      return Object.entries(selectedVariants).every(([groupName, optionName]) => {
        if (!tags[groupName]) return true;
        return tags[groupName] === optionName;
      });
    });
  }, [product?.images, selectedVariants]);

  const displayImages = useMemo(() => {
    return filteredImages.length > 0 ? filteredImages : product?.images || [];
  }, [filteredImages, product?.images]);

  // Main override image lookup
  const mainOverrideImage = useMemo(() => {
    const replaceGroup = product?.variantGroups?.find((g) => g.replaceMainImage);
    if (!replaceGroup || !selectedVariants[replaceGroup.name]) return null;
    const replaceOption = replaceGroup.options.find(
      (o) => o.name === selectedVariants[replaceGroup.name]
    );
    return replaceOption?.thumbnail || null;
  }, [product?.variantGroups, selectedVariants]);

  // Active Hero Image URL
  const currentHeroImageUrl = useMemo(() => {
    return mainOverrideImage || activeBoxImage || displayImages[activeImageIdx]?.url || '/placeholder-gift.png';
  }, [mainOverrideImage, activeBoxImage, displayImages, activeImageIdx]);

  // Auto-play gallery
  useEffect(() => {
    let interval;
    if (isAutoPlaying && displayImages.length > 1 && !activeBoxImage && !mainOverrideImage) {
      interval = setInterval(() => {
        setActiveImageIdx((prev) => (prev + 1) % displayImages.length);
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [isAutoPlaying, displayImages.length, activeBoxImage, mainOverrideImage]);

  // Gesture navigation
  const handleSwipeStart = useCallback((e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches ? e.targetTouches[0].clientX : e.clientX);
  }, []);

  const handleSwipeMove = useCallback((e) => {
    if (!touchStart) return;
    if (e.targetTouches) {
      setTouchEnd(e.targetTouches[0].clientX);
    } else {
      if (e.buttons !== 1) return;
      setTouchEnd(e.clientX);
    }
  }, [touchStart]);

  const handleSwipeEnd = useCallback(() => {
    if (!touchStart || !touchEnd) {
      setTouchStart(null);
      return;
    }
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe || isRightSwipe) {
      setIsAutoPlaying(false);
      if (displayImages.length > 1 && !activeBoxImage && !mainOverrideImage) {
        if (isLeftSwipe) {
          setActiveImageIdx((prev) => (prev + 1) % displayImages.length);
        } else {
          setActiveImageIdx((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1));
        }
      }
    }
    setTouchStart(null);
    setTouchEnd(null);
  }, [touchStart, touchEnd, displayImages.length, activeBoxImage, mainOverrideImage]);

  // Effective price & total price memoized
  const effectiveBasePrice = useMemo(() => {
    if (!product) return 0;
    const selectedSizeObj = Array.isArray(product.sizes)
      ? product.sizes.find((s) => (s?.name || s) === selectedSize)
      : null;
    return selectedSizeObj && selectedSizeObj.price != null
      ? Number(selectedSizeObj.price)
      : product.price;
  }, [product, selectedSize]);

  const calculateTotal = useCallback(() => {
    if (!product) return 0;
    const addonsTotal = selectedAddons.reduce(
      (sum, addon) => sum + (Number(addon.price) || 0),
      0
    );
    return (effectiveBasePrice + addonsTotal) * quantity;
  }, [product, effectiveBasePrice, selectedAddons, quantity]);

  // Dynamic JSON-LD structured data for Google Crawlers
  const jsonLd = useMemo(() => {
    if (!product) return null;
    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      image: product.images?.map((img) => img.url) || [],
      description: product.description,
      sku: product.sku || product._id,
      brand: {
        '@type': 'Brand',
        name: 'Hadaya Gifts',
      },
      offers: {
        '@type': 'Offer',
        url: typeof window !== 'undefined' ? window.location.href : '',
        priceCurrency: 'EGP',
        price: product.price,
        priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        itemCondition: 'https://schema.org/NewCondition',
        availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      },
      ...(product.rating?.count > 0 && {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: product.rating.average,
          reviewCount: product.rating.count,
        },
      }),
    };
  }, [product]);

  // Add to cart handler
  const handleAddToCart = useCallback(() => {
    if (!product) return;
    if (product.sizes?.length > 0 && !selectedSize) {
      toast.error(STRINGS.PRODUCT.PLEASE_SELECT_SIZE);
      return;
    }
    if (product.colors?.length > 0 && !selectedColor) {
      toast.error(STRINGS.PRODUCT.PLEASE_SELECT_COLOR);
      return;
    }
    if (product.shapes?.length > 0 && !selectedShape) {
      toast.error(STRINGS.PRODUCT.PLEASE_SELECT_SHAPE);
      return;
    }

    if (product.variantGroups?.length > 0) {
      for (const group of product.variantGroups) {
        if (!selectedVariants[group.name]) {
          toast.error(`${STRINGS.PRODUCT.PLEASE_SELECT}${group.name}`);
          return;
        }
      }
    }

    if (product.isCustomBox && product.boxSlots?.length > 0) {
      for (const slot of product.boxSlots) {
        if (slot.required && !boxSelections[slot.slotLabel]) {
          toast.error(`${STRINGS.PRODUCT.PLEASE_SELECT}${slot.slotLabel}`);
          return;
        }
      }
    }

    const result = addItem({ ...product, price: effectiveBasePrice }, quantity, {
      selectedSize: typeof selectedSize === 'object' ? selectedSize?.name : selectedSize,
      selectedColor,
      selectedShape,
      selectedVariants: product.variantGroups?.length > 0 ? selectedVariants : undefined,
      addons: selectedAddons,
      boxSelections: product.isCustomBox
        ? Object.entries(boxSelections)
            .filter(([, opt]) => opt)
            .map(([slotLabel, opt]) => ({
              slotLabel,
              chosenOption: opt.name,
              image: getOptImages(opt)[0] || '',
            }))
        : undefined,
    });

    if (!result?.success) {
      toast.error(STRINGS.PRODUCT.OUT_OF_STOCK_QTY);
      return;
    }

    if (result.capped && result.maxStock !== null) {
      toast.success(`${STRINGS.PRODUCT.ADDED_MAX_STOCK}${result.maxStock})`);
      return;
    }

    toast.success(STRINGS.PRODUCT.ADDED_TO_CART);
  }, [
    product,
    selectedSize,
    selectedColor,
    selectedShape,
    selectedVariants,
    boxSelections,
    selectedAddons,
    addItem,
    effectiveBasePrice,
    quantity,
  ]);

  const handleToggleWishlist = useCallback(() => {
    if (!isAuthenticated) {
      toast.error(STRINGS.PRODUCT.LOGIN_TO_ADD_WISHLIST);
      navigate('/account');
      return;
    }
    if (inWishlist) {
      removeFromWishlist(product._id);
      toast.success(STRINGS.PRODUCT.REMOVED_FROM_WISHLIST);
    } else {
      addToWishlist(product);
      toast.success(STRINGS.PRODUCT.ADDED_TO_WISHLIST);
    }
  }, [isAuthenticated, inWishlist, product, navigate, removeFromWishlist, addToWishlist]);

  const handleShare = useCallback(async () => {
    if (!product) return;
    if (navigator.share) {
      await navigator.share({
        title: product.name,
        text: product.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success(STRINGS.PRODUCT.LINK_COPIED);
    }
  }, [product]);

  const toggleAddon = useCallback((addon) => {
    setSelectedAddons((prev) => {
      const exists = prev.find((a) => a.name === addon.name);
      return exists ? prev.filter((a) => a.name !== addon.name) : [...prev, addon];
    });
  }, []);

  const getVisibleOptions = useCallback(
    (group) => {
      if (!product.variantGroups || product.variantGroups.length < 2) return group.options;
      const otherSelections = Object.entries(selectedVariants).filter(
        ([gName]) => gName !== group.name
      );
      if (otherSelections.length === 0) return group.options;
      return group.options.filter((option) => {
        return product.images?.some((img) => {
          const tags = img.variantTags || {};
          if (Object.keys(tags).length === 0) return true;
          const matchesThis = !tags[group.name] || tags[group.name] === option.name;
          const matchesOthers = otherSelections.every(([gName, gVal]) => {
            return !tags[gName] || tags[gName] === gVal;
          });
          return matchesThis && matchesOthers;
        });
      });
    },
    [product?.variantGroups, product?.images, selectedVariants]
  );

  if (isLoading) {
    return (
      <div className="container-custom py-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="skeleton aspect-square rounded-2xl"></div>
          <div className="space-y-4">
            <div className="skeleton h-8 w-3/4"></div>
            <div className="skeleton h-4 w-1/4"></div>
            <div className="skeleton h-24"></div>
            <div className="skeleton h-12 w-1/3"></div>
            <div className="skeleton h-14"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container-custom py-16 text-center">
        <div className="text-6xl mb-4">😔</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-4">{STRINGS.PRODUCT.PRODUCT_NOT_FOUND}</h1>
        <Link to="/products" className="btn-primary">
          {STRINGS.PRODUCT.BROWSE_PRODUCTS}
        </Link>
      </div>
    );
  }

  const discount = product.oldPrice ? Math.round((1 - product.price / product.oldPrice) * 100) : 0;

  return (
    <>
      {/* Dynamic SEO JSON-LD injection */}
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      <div className="bg-gray-50 min-h-screen">
        {/* Breadcrumbs */}
        <div className="bg-white border-b">
          <div className="container-custom py-4">
            <nav className="flex items-center gap-2 text-sm overflow-x-auto whitespace-nowrap scrollbar-hide" aria-label="Breadcrumb">
              <Link
                to="/"
                className="text-gray-500 hover:text-purple-600 transition-colors flex-shrink-0"
              >
                {STRINGS.NAV.HOME}
              </Link>
              <span className="text-gray-400 flex-shrink-0">/</span>
              <Link
                to="/products"
                className="text-gray-500 hover:text-purple-600 transition-colors flex-shrink-0"
              >
                {STRINGS.NAV.PRODUCTS}
              </Link>
              {product.category &&
                (Array.isArray(product.category) ? product.category : [product.category])
                  .filter(Boolean)
                  .map((cat, i) => (
                    <span key={cat._id || i} className="flex-shrink-0 flex items-center gap-2">
                      <span className="text-gray-400">/</span>
                      <Link
                        to={`/products?category=${cat.slug}`}
                        className="text-gray-500 hover:text-purple-600 transition-colors"
                      >
                        {cat.name}
                      </Link>
                    </span>
                  ))}
              <span className="text-gray-400 flex-shrink-0">/</span>
              <span className="text-gray-800 font-medium truncate max-w-[150px] sm:max-w-none">
                {product.name}
              </span>
            </nav>
          </div>
        </div>

        {/* Product Details Section */}
        <div className="container-custom py-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            {/* Gallery Column */}
            <div className="space-y-4">
              {/* Main Hero Image Container with zero CLS layout wrapper */}
              <div className="relative">
                <div
                  ref={imgContainerRef}
                  className="relative rounded-2xl overflow-hidden bg-white aspect-square cursor-crosshair group touch-pan-y shadow-sm"
                  onMouseEnter={() => {
                    setIsZooming(true);
                    setIsAutoPlaying(false);
                  }}
                  onMouseLeave={() => {
                    setIsZooming(false);
                    setIsAutoPlaying(true);
                    handleSwipeEnd();
                  }}
                  onTouchStart={handleSwipeStart}
                  onTouchMove={handleSwipeMove}
                  onTouchEnd={handleSwipeEnd}
                  onMouseDown={handleSwipeStart}
                  onMouseUp={handleSwipeEnd}
                  onMouseMove={(e) => {
                    const rect = imgContainerRef.current?.getBoundingClientRect();
                    if (rect) {
                      const x = ((e.clientX - rect.left) / rect.width) * 100;
                      const y = ((e.clientY - rect.top) / rect.height) * 100;
                      setZoomPos({ x, y });
                    }
                    handleSwipeMove(e);
                  }}
                >
                  <Image
                    src={currentHeroImageUrl}
                    alt={
                      mainOverrideImage
                        ? STRINGS.PRODUCT.SELECTED_OPTION
                        : activeBoxImage
                          ? STRINGS.PRODUCT.BOX_SELECTION
                          : displayImages[activeImageIdx]?.alt || product.name
                    }
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                    priority
                    className="object-cover transition-opacity duration-300"
                    draggable={false}
                  />

                  {/* Amazon-style Zoom Lens Indicator */}
                  {isZooming && (
                    <div
                      className="absolute pointer-events-none border-2 border-purple-400/50 bg-purple-200/20 rounded-sm"
                      style={{
                        width: '120px',
                        height: '120px',
                        left: `calc(${zoomPos.x}% - 60px)`,
                        top: `calc(${zoomPos.y}% - 60px)`,
                      }}
                    />
                  )}
                  <div className="absolute bottom-3 left-3 bg-white/80 backdrop-blur-sm rounded-full px-3 py-1 text-xs text-gray-600 items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity hidden lg:flex">
                    <FiZoomIn className="w-3 h-3" />
                    {STRINGS.PRODUCT.HOVER_TO_ZOOM}
                  </div>
                </div>

                {/* Floating Zoom Overlay */}
                {isZooming && (
                  <div
                    className="hidden xl:block absolute top-0 right-[calc(100%+16px)] w-[clamp(300px,30vw,500px)] h-[clamp(300px,30vw,500px)] bg-white border-2 border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden"
                    style={{
                      backgroundImage: `url(${currentHeroImageUrl})`,
                      backgroundSize: '250%',
                      backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                      backgroundRepeat: 'no-repeat',
                    }}
                  />
                )}
              </div>

              {/* Mobile Dots Pagination */}
              {!activeBoxImage && !mainOverrideImage && displayImages.length > 1 && (
                <div className="flex justify-center items-center gap-2 mt-4 md:hidden">
                  {displayImages.map((_, index) => (
                    <button
                      key={`dot-${index}`}
                      onClick={() => {
                        setActiveImageIdx(index);
                        setIsAutoPlaying(false);
                      }}
                      className={`h-2 rounded-full transition-all ${
                        activeImageIdx === index ? 'bg-purple-600 w-4' : 'bg-gray-300 w-2'
                      }`}
                      aria-label={`Go to image ${index + 1}`}
                    />
                  ))}
                </div>
              )}

              {/* Thumbnails Row */}
              <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 mt-4 scrollbar-hide">
                {displayImages.map((image, index) => (
                  <button
                    key={`img-${index}`}
                    onClick={() => {
                      setActiveImageIdx(index);
                      setActiveBoxImage(null);
                    }}
                    onMouseEnter={() => {
                      setActiveImageIdx(index);
                      setActiveBoxImage(null);
                    }}
                    className={`relative flex-shrink-0 rounded-lg overflow-hidden aspect-square w-14 sm:w-16 md:w-20 border-2 transition-all ${
                      !activeBoxImage && activeImageIdx === index
                        ? 'border-purple-500 shadow-md scale-105'
                        : 'border-transparent hover:border-purple-300'
                    }`}
                  >
                    <Image
                      src={image.url}
                      alt={image.alt || `${product.name} thumbnail ${index + 1}`}
                      fill
                      sizes="(max-width: 640px) 56px, 80px"
                      className="object-cover"
                    />
                  </button>
                ))}

                {/* Box selection thumbnails */}
                {product.isCustomBox &&
                  Object.entries(boxSelections)
                    .filter(([, opt]) => opt && getOptImages(opt).length > 0)
                    .flatMap(([label, opt]) =>
                      getOptImages(opt).map((imgUrl, imgIdx) => (
                        <button
                          key={`box-${label}-${imgIdx}`}
                          onClick={() => setActiveBoxImage(imgUrl)}
                          onMouseEnter={() => setActiveBoxImage(imgUrl)}
                          className={`relative flex-shrink-0 rounded-lg overflow-hidden w-14 sm:w-16 md:w-20 aspect-square border-2 transition-all ${
                            activeBoxImage === imgUrl
                              ? 'border-purple-500 shadow-md scale-105'
                              : 'border-transparent hover:border-purple-300'
                          }`}
                        >
                          <Image
                            src={imgUrl}
                            alt={opt.name}
                            fill
                            sizes="(max-width: 640px) 56px, 80px"
                            className="object-cover"
                          />
                          <span className="absolute bottom-0 inset-x-0 bg-purple-600/90 text-white text-[8px] sm:text-[9px] text-center py-0.5 truncate px-1 z-10">
                            🎁 {opt.name}
                          </span>
                        </button>
                      ))
                    )}

                {/* Ready Box Included Products */}
                {product.isReadyBox &&
                  product.includedProducts &&
                  product.includedProducts
                    .filter((item) => item.product && item.product.images?.length > 0)
                    .map((item, idx) => {
                      const mainImg = item.product.images[0];
                      return (
                        <button
                          key={`ready-${item.product._id}-${idx}`}
                          onClick={() => setActiveBoxImage(mainImg.url)}
                          onMouseEnter={() => setActiveBoxImage(mainImg.url)}
                          className={`relative flex-shrink-0 rounded-lg overflow-hidden w-14 sm:w-16 md:w-20 aspect-square border-2 transition-all ${
                            activeBoxImage === mainImg.url
                              ? 'border-purple-500 shadow-md scale-105'
                              : 'border-transparent hover:border-purple-300'
                          }`}
                        >
                          <Image
                            src={mainImg.url}
                            alt={item.product.name}
                            fill
                            sizes="(max-width: 640px) 56px, 80px"
                            className="object-cover"
                          />
                          <span
                            className="absolute bottom-0 inset-x-0 bg-purple-600/90 text-white text-[8px] sm:text-[9px] text-center py-0.5 truncate px-1 z-10"
                            title={item.product.name}
                          >
                            🎁 {item.product.name}
                          </span>
                        </button>
                      );
                    })}

                {/* Shape Selection Thumbnails */}
                {selectedShape &&
                  product.shapes
                    ?.filter((s) => s.name === selectedShape)
                    .flatMap((shape) =>
                      getOptImages(shape).map((imgUrl, imgIdx) => (
                        <button
                          key={`shape-${shape.name}-${imgIdx}`}
                          onClick={() => setActiveBoxImage(imgUrl)}
                          onMouseEnter={() => setActiveBoxImage(imgUrl)}
                          className={`relative flex-shrink-0 rounded-lg overflow-hidden w-14 sm:w-16 md:w-20 aspect-square border-2 transition-all ${
                            activeBoxImage === imgUrl
                              ? 'border-purple-500 shadow-md scale-105'
                              : 'border-transparent hover:border-purple-300'
                          }`}
                        >
                          <Image
                            src={imgUrl}
                            alt={shape.name}
                            fill
                            sizes="(max-width: 640px) 56px, 80px"
                            className="object-cover"
                          />
                          <span className="absolute bottom-0 inset-x-0 bg-purple-600/90 text-white text-[8px] sm:text-[9px] text-center py-0.5 truncate px-1 z-10">
                            {shape.name}
                          </span>
                        </button>
                      ))
                    )}
              </div>
            </div>

            {/* Product Meta & Purchasing Column */}
            <div className="space-y-4 sm:space-y-6">
              {/* Category Links & Badges */}
              <div className="flex items-center gap-3 flex-wrap">
                {product.category &&
                  (Array.isArray(product.category) ? product.category : [product.category])
                    .filter(Boolean)
                    .map((cat, i, arr) => (
                      <span key={cat._id || i}>
                        <Link
                          to={`/products?category=${cat.slug}`}
                          className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 hover:underline font-medium text-sm"
                        >
                          {cat.name}
                        </Link>
                        {i < arr.length - 1 && <span className="text-gray-300 mx-1">·</span>}
                      </span>
                    ))}
                {product.isNewArrival && <span className="badge badge-new">{STRINGS.PRODUCT.NEW}</span>}
                {product.isBestseller && (
                  <span className="badge badge-bestseller">{STRINGS.PRODUCT.BESTSELLER}</span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">
                {product.name}
              </h1>

              {/* Rating */}
              {product.rating?.count > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex text-yellow-400 text-lg rating-stars" aria-label={`Rated ${product.rating.average} out of 5 stars`}>
                    {[...Array(5)].map((_, i) => (
                      <span key={i}>{i < Math.round(product.rating.average) ? '★' : '☆'}</span>
                    ))}
                  </div>
                  <span className="text-gray-600 text-sm">
                    {product.rating.average} ({product.rating.count} {STRINGS.PRODUCT.REVIEW})
                  </span>
                </div>
              )}

              {/* Price Row */}
              <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                <span className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 whitespace-nowrap">
                  <bdi>{effectiveBasePrice}</bdi> {STRINGS.PRODUCT.CURRENCY}
                </span>
                {product.oldPrice && (
                  <>
                    <span className="text-base sm:text-xl text-gray-400 line-through whitespace-nowrap">
                      <bdi>{product.oldPrice}</bdi> {STRINGS.PRODUCT.CURRENCY}
                    </span>
                    <span className="badge badge-sale">{STRINGS.PRODUCT.SAVE_AMOUNT} {discount}%</span>
                  </>
                )}
              </div>

              {/* Loyalty Reward Information Banner */}
              {loyaltySettings?.enabled !== false && (
                <div className="p-3 bg-gradient-to-r from-purple-50 via-pink-50 to-amber-50 border border-purple-200/80 rounded-2xl flex items-center gap-3 text-xs sm:text-sm font-semibold text-purple-900 shadow-sm">
                  <div className="w-8 h-8 rounded-xl bg-purple-600 text-yellow-300 flex items-center justify-center flex-shrink-0 text-base shadow-sm">
                    🎁
                  </div>
                  <div>
                    <span>
                      تكسب <strong className="text-purple-700 font-extrabold text-sm sm:text-base">{Math.floor(effectiveBasePrice * (loyaltySettings?.pointsPerEgpSpent || 1))} نقطة ولاء</strong> عند إتمام شراء هذا المنتج!
                    </span>
                    <span className="block text-[11px] text-gray-500 font-normal mt-0.5">
                      تتحول النقاط تلقائياً لخصم مباشر في طلبياتك القادمة.
                    </span>
                  </div>
                </div>
              )}

              {/* Variant Groups Selection */}
              {product.variantGroups?.length > 0 &&
                product.variantGroups.map((group) => {
                  const visibleOptions = getVisibleOptions(group);
                  return (
                    <div key={group.name}>
                      <h3 className="font-medium text-gray-800 mb-3 text-sm">
                        {group.name}:{' '}
                        {selectedVariants[group.name] && (
                          <span className="text-gray-500">{selectedVariants[group.name]}</span>
                        )}
                      </h3>
                      <div className="flex flex-wrap gap-2 sm:gap-3">
                        {visibleOptions.map((option) => (
                          <button
                            key={option.name}
                            onClick={() => {
                              const newVariants = {
                                ...selectedVariants,
                                [group.name]: option.name,
                              };
                              if (product.variantGroups?.length >= 2) {
                                for (const otherGroup of product.variantGroups) {
                                  if (
                                    otherGroup.name === group.name ||
                                    !newVariants[otherGroup.name]
                                  )
                                    continue;
                                  const otherSelections = Object.entries(newVariants).filter(
                                    ([gName]) => gName !== otherGroup.name
                                  );
                                  const stillVisible = otherGroup.options.some((opt) => {
                                    if (opt.name !== newVariants[otherGroup.name]) return false;
                                    return product.images?.some((img) => {
                                      const tags = img.variantTags || {};
                                      if (Object.keys(tags).length === 0) return true;
                                      const matchesOpt =
                                        !tags[otherGroup.name] ||
                                        tags[otherGroup.name] === opt.name;
                                      const matchesRest = otherSelections.every(
                                        ([gN, gV]) => !tags[gN] || tags[gN] === gV
                                      );
                                      return matchesOpt && matchesRest;
                                    });
                                  });
                                  if (!stillVisible) delete newVariants[otherGroup.name];
                                }
                              }
                              setSelectedVariants(newVariants);
                              setActiveImageIdx(0);
                              setActiveBoxImage(null);
                            }}
                            className={`relative rounded-xl border-2 overflow-hidden transition-all ${
                              selectedVariants[group.name] === option.name
                                ? 'border-purple-500 ring-2 ring-purple-200 scale-105'
                                : 'border-gray-200 hover:border-purple-300'
                            } ${option.thumbnail ? 'w-16 h-16 sm:w-20 sm:h-20' : 'px-4 py-2'}`}
                            title={option.name}
                          >
                            {option.thumbnail ? (
                              <Image
                                src={option.thumbnail}
                                alt={option.name}
                                fill
                                sizes="80px"
                                className="object-cover"
                              />
                            ) : (
                              <span className="text-sm font-medium text-gray-700">
                                {option.name}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}

              {/* Sizes Selection */}
              {product.sizes?.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-800 mb-3 text-sm">{STRINGS.PRODUCT.SIZE}</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((size) => {
                      const sizeName = typeof size === 'object' ? size.name : size;
                      const sizePrice = typeof size === 'object' && size.price != null ? size.price : null;
                      return (
                        <button
                          key={sizeName}
                          onClick={() => setSelectedSize(sizeName)}
                          className={`px-4 py-2 rounded-lg border-2 transition-colors text-sm ${
                            selectedSize === sizeName
                              ? 'border-purple-500 bg-purple-50 text-purple-700 font-bold'
                              : 'border-gray-300 hover:border-purple-500 text-gray-700'
                          }`}
                        >
                          {sizeName}
                          {sizePrice !== null && sizePrice !== product.price && (
                            <span className="text-xs text-gray-500 mr-1.5 font-normal">
                              ({sizePrice} {STRINGS.PRODUCT.CURRENCY})
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Colors Selection */}
              {product.colors?.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-800 mb-3 text-sm">
                    {STRINGS.PRODUCT.COLOR} {selectedColor && <span className="text-gray-500">{selectedColor}</span>}
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {product.colors.map((color) => (
                      <button
                        key={color.name}
                        onClick={() => setSelectedColor(color.name)}
                        className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${
                          selectedColor === color.name
                            ? 'border-gray-800 scale-110'
                            : 'border-gray-300 hover:scale-105'
                        }`}
                        style={{ backgroundColor: color.code }}
                        title={color.name}
                      >
                        {selectedColor === color.name && (
                          <FiCheck
                            className={`${
                              color.code === '#ffffff' || color.code === '#fff'
                                ? 'text-gray-800'
                                : 'text-white'
                            }`}
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Shapes Selection */}
              {product.shapes?.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-800 mb-3 text-sm">
                    {STRINGS.PRODUCT.SHAPE} {selectedShape && <span className="text-gray-500">{selectedShape}</span>}
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => {
                        setSelectedShape(null);
                        setActiveImageIdx(0);
                        setActiveBoxImage(null);
                      }}
                      className={`relative w-16 h-16 rounded-xl border-2 overflow-hidden transition-all ${
                        !selectedShape
                          ? 'border-purple-500 ring-2 ring-purple-200 scale-105'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                      title={STRINGS.PRODUCT.ORIGINAL_SHAPE}
                    >
                      <Image
                        src={displayImages[0]?.url || product.images?.[0]?.url || '/placeholder-gift.png'}
                        alt={STRINGS.PRODUCT.ORIGINAL_SHAPE}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </button>
                    {product.shapes.map((shape) => {
                      const shapeImages = getOptImages(shape);
                      return (
                        <button
                          key={shape.name}
                          onClick={() => {
                            setSelectedShape(shape.name);
                            if (shapeImages.length > 0) setActiveBoxImage(shapeImages[0]);
                          }}
                          className={`relative w-16 h-16 rounded-xl border-2 overflow-hidden transition-all ${
                            selectedShape === shape.name
                              ? 'border-purple-500 ring-2 ring-purple-200 scale-105'
                              : 'border-gray-200 hover:border-purple-300'
                          }`}
                          title={shape.name}
                        >
                          {shapeImages.length > 0 ? (
                            <Image
                              src={shapeImages[0]}
                              alt={shape.name}
                              fill
                              sizes="64px"
                              className="object-cover"
                            />
                          ) : (
                            <span className="text-xs text-gray-600 flex items-center justify-center h-full">
                              {shape.name}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Addons Selection */}
              {product.addons?.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-800 mb-3 text-sm">{STRINGS.PRODUCT.ADDONS}</h3>
                  <div className="space-y-2">
                    {product.addons.map((addon) => (
                      <label
                        key={addon.name}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors text-sm ${
                          selectedAddons.find((a) => a.name === addon.name)
                            ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-pink-50'
                            : 'border-gray-300 hover:border-purple-500'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={!!selectedAddons.find((a) => a.name === addon.name)}
                            onChange={() => toggleAddon(addon)}
                            className="rounded text-purple-600 focus:ring-purple-500"
                          />
                          <span>{addon.name}</span>
                        </div>
                        <span className="text-purple-700 font-semibold">
                          +{addon.price} {STRINGS.PRODUCT.CURRENCY}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Box Builder */}
              {product.isCustomBox && product.boxSlots?.length > 0 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-gray-800">{STRINGS.PRODUCT.CUSTOMIZE_BOX}</h3>
                  {product.boxSlots.map((slot) => (
                    <div key={slot.slotLabel} className="space-y-3">
                      <h4 className="font-medium text-gray-800 text-sm">
                        {slot.slotLabel}
                        {slot.required && <span className="text-red-500 mr-1">*</span>}
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                        {slot.options.map((opt) => {
                          const isSelected = boxSelections[slot.slotLabel]?.name === opt.name;
                          const optImages = getOptImages(opt);
                          return (
                            <button
                              key={opt.name}
                              type="button"
                              onClick={() =>
                                setBoxSelections((prev) => ({
                                  ...prev,
                                  [slot.slotLabel]: isSelected ? undefined : opt,
                                }))
                              }
                              className={`relative rounded-xl border-2 overflow-hidden transition-all ${
                                isSelected
                                  ? 'border-purple-500 ring-2 ring-purple-200 scale-[1.02]'
                                  : 'border-gray-200 hover:border-purple-300'
                              }`}
                            >
                              {optImages.length > 1 ? (
                                <div className="aspect-square relative" onClick={(e) => e.stopPropagation()}>
                                  <Swiper
                                    modules={[Autoplay, Pagination]}
                                    spaceBetween={0}
                                    slidesPerView={1}
                                    autoplay={{ delay: 3000, disableOnInteraction: false }}
                                    pagination={{ clickable: true }}
                                    className="h-full w-full box-option-swiper"
                                  >
                                    {optImages.map((imgUrl, imgIdx) => (
                                      <SwiperSlide key={imgIdx}>
                                        <div className="aspect-square relative w-full h-full">
                                          <Image
                                            src={imgUrl}
                                            alt={opt.name}
                                            fill
                                            sizes="(max-width: 640px) 150px, 200px"
                                            className="object-cover"
                                          />
                                        </div>
                                      </SwiperSlide>
                                    ))}
                                  </Swiper>
                                </div>
                              ) : optImages.length === 1 ? (
                                <div className="aspect-square relative w-full">
                                  <Image
                                    src={optImages[0]}
                                    alt={opt.name}
                                    fill
                                    sizes="(max-width: 640px) 150px, 200px"
                                    className="object-cover"
                                  />
                                </div>
                              ) : null}
                              <div className="p-1.5 sm:p-2 text-center">
                                <p className="text-xs sm:text-sm font-medium text-gray-800">
                                  {opt.name}
                                </p>
                              </div>
                              {isSelected && (
                                <div className="absolute top-2 left-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center z-10">
                                  <FiCheck className="text-white text-sm" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Quantity Counter & Add To Cart CTA */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-3 hover:bg-gray-100 transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <FiMinus />
                  </button>
                  <span className="px-4 font-semibold text-gray-800">{quantity}</span>
                  <button
                    onClick={() => {
                      const maxStock = Number(product.stock);
                      if (Number.isFinite(maxStock)) {
                        setQuantity(Math.min(quantity + 1, Math.max(1, maxStock)));
                        return;
                      }
                      setQuantity(quantity + 1);
                    }}
                    className="p-3 hover:bg-gray-100 transition-colors"
                    disabled={
                      Number.isFinite(Number(product.stock)) && quantity >= Number(product.stock)
                    }
                    aria-label="Increase quantity"
                  >
                    <FiPlus />
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed text-base font-bold py-3.5"
                >
                  {product.stock === 0
                    ? STRINGS.PRODUCT.OUT_OF_STOCK
                    : `${STRINGS.PRODUCT.ADD_TO_CART_TOTAL}${calculateTotal()} ${STRINGS.PRODUCT.CURRENCY}`}
                </button>
              </div>

              {Number.isFinite(Number(product.stock)) && (
                <p className="text-sm text-gray-500">
                  {STRINGS.PRODUCT.AVAILABLE_NOW} {Math.max(0, Number(product.stock))} {STRINGS.PRODUCT.PIECE}
                </p>
              )}

              {/* Actions: Wishlist & Share */}
              <div className="flex items-center gap-4 pt-4 border-t">
                <button
                  onClick={handleToggleWishlist}
                  className={`flex items-center gap-2 ${
                    inWishlist ? 'text-red-500 font-semibold' : 'text-gray-600'
                  } hover:text-red-500 transition-colors text-sm`}
                >
                  <FiHeart className={inWishlist ? 'fill-current' : ''} />
                  {inWishlist ? STRINGS.PRODUCT.IN_WISHLIST : STRINGS.PRODUCT.ADD_TO_WISHLIST}
                </button>
                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors text-sm"
                >
                  <FiShare2 />
                  <span>{STRINGS.PRODUCT.SHARE}</span>
                </button>
              </div>

              {/* Confidence Features */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t">
                <div className="text-center">
                  <FiTruck className="mx-auto text-2xl text-purple-600 mb-2" />
                  <span className="text-xs sm:text-sm text-gray-600">{STRINGS.FEATURES.FAST_SHIPPING}</span>
                </div>
                <div className="text-center">
                  <FiRotateCcw className="mx-auto text-2xl text-purple-600 mb-2" />
                  <span className="text-xs sm:text-sm text-gray-600">{STRINGS.FEATURES.EASY_RETURNS}</span>
                </div>
                <div className="text-center">
                  <FiShield className="mx-auto text-2xl text-purple-600 mb-2" />
                  <span className="text-xs sm:text-sm text-gray-600">{STRINGS.FEATURES.SECURE_PAYMENT}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Description & Reviews Tabs */}
          <div className="mt-12">
            <div className="flex border-b" role="tablist">
              {['description', 'reviews'].map((tab) => (
                <button
                  key={tab}
                  role="tab"
                  aria-selected={activeTab === tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 font-medium transition-colors text-base ${
                    activeTab === tab
                      ? 'text-purple-700 border-b-2 border-purple-600 font-bold'
                      : 'text-gray-600 hover:text-purple-600'
                  }`}
                >
                  {tab === 'description'
                    ? STRINGS.PRODUCT.DESCRIPTION
                    : `${STRINGS.PRODUCT.REVIEWS} (${reviewsData?.pagination?.total || 0})`}
                </button>
              ))}
            </div>

            <div className="py-8">
              {activeTab === 'description' ? (
                <div className="prose prose-lg max-w-none">
                  <p className="text-gray-600 leading-relaxed text-base">{product.description}</p>

                  {product.tags?.length > 0 && (
                    <div className="mt-6">
                      <h3 className="font-bold text-gray-800 mb-3 text-sm">{STRINGS.PRODUCT.KEYWORDS}</h3>
                      <div className="flex flex-wrap gap-2">
                        {product.tags.map((tag) => (
                          <Link
                            key={tag}
                            to={`/products?search=${tag}`}
                            className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium hover:bg-purple-100 transition-colors"
                          >
                            #{tag}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <ReviewForm
                    productId={product._id}
                    refreshReviews={() => queryClient.invalidateQueries({ queryKey: ['reviews', product._id] })}
                  />

                  {reviewsData?.data?.length > 0 ? (
                    <div className="space-y-4">
                      {reviewsData.data.map((review) => (
                        <div key={review._id} className="bg-white p-6 rounded-xl border shadow-sm">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-800">
                                  {review.user?.firstName || review.guestName}
                                </span>
                                {review.isVerifiedPurchase && (
                                  <span className="text-green-600 text-xs flex items-center gap-1 font-semibold">
                                    <FiCheck size={14} />
                                    {STRINGS.PRODUCT.VERIFIED_BUYER}
                                  </span>
                                )}
                              </div>
                              <div className="flex text-yellow-400 text-sm mt-1 rating-stars">
                                {[...Array(5)].map((_, i) => (
                                  <span key={i}>{i < review.rating ? '★' : '☆'}</span>
                                ))}
                              </div>
                            </div>
                            <span className="text-xs text-gray-400">
                              {new Date(review.createdAt).toLocaleDateString('ar-EG')}
                            </span>
                          </div>
                          {review.title && (
                            <h4 className="font-semibold text-gray-800 mt-3 text-sm">{review.title}</h4>
                          )}
                          <p className="text-gray-600 mt-2 text-sm leading-relaxed">{review.comment}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-5xl mb-4">⭐</div>
                      <h3 className="text-lg font-medium text-gray-800 mb-2">
                        {STRINGS.PRODUCT.NO_REVIEWS}
                      </h3>
                      <p className="text-gray-600 text-sm">{STRINGS.PRODUCT.BE_FIRST_TO_REVIEW}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Related Products Grid */}
          {relatedProducts?.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">{STRINGS.PRODUCT.RELATED_PRODUCTS}</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                {relatedProducts.map((p) => (
                  <ProductCard key={p._id} product={p} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default memo(ProductPage);
