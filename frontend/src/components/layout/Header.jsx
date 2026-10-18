import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import Image from 'next/image';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FiSearch, FiUser, FiHeart, FiShoppingBag, FiMenu, FiSettings, FiArrowLeft, FiTrendingUp } from 'react-icons/fi';
import { useCartStore, useWishlistStore, useAuthStore, useUIStore } from '../../store';
import { categoriesAPI, productsAPI } from '../../services/api';
import { STRINGS, SITE_CONFIG } from '../../constants';
import { optimizeCloudinaryUrl } from '../../utils/optimizeImage';

const POPULAR_SEARCHES = ['بوكس هدايا', 'ساعة', 'مج', 'شوكولاتة', 'عيد ميلاد', 'خطوبة'];

/**
 * Granularly Optimized & Accessible Main Header with Live Instant Search
 */
const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const scrolledRef = useRef(false);
  const desktopSearchRef = useRef(null);
  const mobileSearchRef = useRef(null);

  // Debounce search query for live autocomplete
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 280);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close autocomplete on outside click or Escape
  useEffect(() => {
    if (!isSearchFocused) return undefined;
    const handleOutsideClick = (e) => {
      const inDesktop = desktopSearchRef.current && desktopSearchRef.current.contains(e.target);
      const inMobile = mobileSearchRef.current && mobileSearchRef.current.contains(e.target);
      if (!inDesktop && !inMobile) {
        setIsSearchFocused(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSearchFocused]);

  // 1. Atomic Zustand Selectors (Prevents re-renders across the entire navbar tree on unrelated state changes)
  const cartCount = useCartStore((state) =>
    state.items.reduce((total, item) => total + (item.quantity || 1), 0)
  );
  const cartHydrated = useCartStore((state) => state._hasHydrated);
  const wishlistCount = useWishlistStore((state) => state.items.length);
  const wishlistHydrated = useWishlistStore((state) => state._hasHydrated);
  const countsReady = cartHydrated && wishlistHydrated;
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isAdmin = useAuthStore((state) => state.user?.role === 'admin');

  const isMobileMenuOpen = useUIStore((state) => state.isMobileMenuOpen);
  const isCartOpen = useUIStore((state) => state.isCartOpen);
  const toggleMobileMenu = useUIStore((state) => state.toggleMobileMenu);
  const toggleCart = useUIStore((state) => state.toggleCart);

  // 2. High-performance scroll hysteresis using passive listeners
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const y = window.scrollY;
          if (!scrolledRef.current && y > 250) {
            scrolledRef.current = true;
            setIsScrolled(true);
            document.documentElement.style.setProperty('--header-offset', '80px');
          } else if (scrolledRef.current && y < 20) {
            scrolledRef.current = false;
            setIsScrolled(false);
            document.documentElement.style.setProperty('--header-offset', '140px');
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    document.documentElement.style.setProperty('--header-offset', '140px');
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 3. Search submission handler
  const handleSearch = useCallback(
    (e) => {
      e.preventDefault();
      const query = searchQuery.trim();
      if (query) {
        navigate(`/products?search=${encodeURIComponent(query)}`);
        setSearchQuery('');
        setIsSearchFocused(false);
        setIsSearchVisible(false);
      }
    },
    [searchQuery, navigate]
  );

  // Live search autocomplete query
  const { data: liveSearchData, isFetching: isSearchingLive } = useQuery({
    queryKey: ['live-search', debouncedQuery],
    queryFn: () =>
      productsAPI.getAll({ search: debouncedQuery, limit: 6 }).then((res) => res.data),
    enabled: isSearchFocused && debouncedQuery.length >= 2,
    staleTime: 1000 * 60 * 2,
  });

  const liveProducts = liveSearchData?.data || [];
  const liveTotal = liveSearchData?.pagination?.total || liveProducts.length;

  const { data: dbCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesAPI.getAll().then((res) => res.data.data),
    staleTime: 1000 * 60 * 10,
  });

  const categories =
    dbCategories && dbCategories.length > 0 ? dbCategories : STRINGS.HEADER.CATEGORIES;

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        isScrolled ? 'header-scrolled bg-white/95 backdrop-blur-md shadow-md' : 'bg-white shadow-sm'
      }`}
      role="banner"
    >
      {/* Top Bar Announcement */}
      <div
        className={`topbar-gradient text-white text-xs sm:text-sm transition-all duration-300 overflow-hidden ${
          isScrolled ? 'py-0 max-h-0 opacity-0' : 'py-2 max-h-12 opacity-100'
        }`}
      >
        <div className="container-custom flex justify-between items-center">
          <p className="flex items-center gap-2 font-medium">
            <span className="animate-pulse" aria-hidden="true">✨</span>
            {STRINGS.HOME.TAGLINE}
          </p>
          <nav className="hidden md:flex gap-4 font-medium" aria-label={STRINGS.NAV.QUICK_LINKS}>
            <Link
              to="/track-order"
              className={`hover:text-white/80 transition-colors ${location.pathname === '/track-order' ? 'underline font-bold' : ''}`}
              aria-current={location.pathname === '/track-order' ? 'page' : undefined}
            >
              {STRINGS.NAV.TRACK_ORDER}
            </Link>
            <Link
              to="/stores"
              className={`hover:text-white/80 transition-colors ${location.pathname === '/stores' ? 'underline font-bold' : ''}`}
              aria-current={location.pathname === '/stores' ? 'page' : undefined}
            >
              {STRINGS.NAV.STORES}
            </Link>
            <Link
              to="/contact"
              className={`hover:text-white/80 transition-colors ${location.pathname === '/contact' ? 'underline font-bold' : ''}`}
              aria-current={location.pathname === '/contact' ? 'page' : undefined}
            >
              {STRINGS.NAV.CONTACT}
            </Link>
          </nav>
        </div>
      </div>

      {/* Main Header Container */}
      <div
        className={`container-custom transition-all duration-300 ${
          isScrolled ? 'py-1.5' : 'py-2'
        }`}
      >
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Mobile Menu Hamburger Button */}
          <button
            onClick={toggleMobileMenu}
            className="lg:hidden p-2 hover:bg-purple-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors text-gray-700"
            aria-label={STRINGS.ACCESSIBILITY.OPEN_MENU}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu-drawer"
          >
            <FiMenu size={24} aria-hidden="true" />
          </button>

          {/* Brand Logo with Next.js Image Component */}
          <Link to="/" className="flex-shrink-0 relative flex items-center" aria-label={STRINGS.NAV.HOME}>
            <div
              className={`relative transition-all duration-300 ${
                isScrolled ? 'w-24 sm:w-28 h-9 sm:h-12' : 'w-28 sm:w-36 md:w-44 h-11 sm:h-16 md:h-20'
              }`}
            >
              <Image
                src="/images/logo.jpeg"
                alt={STRINGS.NAV.LOGO_ALT}
                fill
                priority
                sizes="(max-width: 640px) 64px, (max-width: 768px) 72px, 80px"
                className="object-contain"
              />
            </div>
          </Link>

          {/* Desktop Search Form */}
          <form
            ref={desktopSearchRef}
            onSubmit={handleSearch}
            className="hidden md:flex flex-1 max-w-xl mx-4 relative"
            role="search"
            aria-label="البحث عن المنتجات"
          >
            <div className="relative w-full group">
              <label htmlFor="desktop-search" className="sr-only">
                {STRINGS.SEARCH.PLACEHOLDER}
              </label>
              <input
                id="desktop-search"
                name="search"
                type="search"
                autoComplete="off"
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchFocused(true);
                }}
                placeholder={STRINGS.SEARCH.PLACEHOLDER}
                className="w-full pl-14 pr-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:bg-white transition-all duration-300 group-hover:border-purple-300 text-sm"
              />
              <button
                type="submit"
                className="absolute left-1.5 top-1/2 -translate-y-1/2 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 text-white p-2.5 rounded-xl hover:from-purple-600 hover:via-fuchsia-600 hover:to-pink-600 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/30 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                aria-label={STRINGS.SEARCH.BUTTON}
              >
                <FiSearch size={18} aria-hidden="true" />
              </button>
            </div>

            {/* Live Instant Search Autocomplete Dropdown (Desktop) */}
            {isSearchFocused && (
              <div className="absolute top-full right-0 left-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-fadeInUp">
                {debouncedQuery.length < 2 ? (
                  <div className="p-4">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 mb-2.5">
                      <FiTrendingUp className="text-purple-600" aria-hidden="true" />
                      <span>عمليات بحث شائعة</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {POPULAR_SEARCHES.map((term) => (
                        <button
                          key={term}
                          type="button"
                          onClick={() => {
                            setSearchQuery(term);
                            setIsSearchFocused(false);
                            navigate(`/products?search=${encodeURIComponent(term)}`);
                          }}
                          className="px-3 py-1.5 bg-purple-50/70 hover:bg-purple-100 text-purple-700 text-xs font-medium rounded-full border border-purple-100 transition-colors"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : isSearchingLive ? (
                  <div className="p-6 text-center text-gray-500 text-sm flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    <span>جاري البحث عن أفضل الهدايا...</span>
                  </div>
                ) : liveProducts.length === 0 ? (
                  <div className="p-5 text-center">
                    <p className="text-sm font-semibold text-gray-700">
                      لم نجد نتائج مطابقة لـ «{debouncedQuery}»
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      جرب البحث بكلمات أخرى أو استخدم باحث الهدايا الذكي
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                      {liveProducts.map((product) => {
                        const thumbUrl =
                          optimizeCloudinaryUrl(product.images?.[0]?.url, 120) ||
                          product.images?.[0]?.url ||
                          SITE_CONFIG.PLACEHOLDER_IMAGE;
                        const isOut =
                          product.stock !== null &&
                          product.stock !== undefined &&
                          product.stock !== '' &&
                          Number.isFinite(Number(product.stock)) &&
                          Number(product.stock) <= 0;

                        return (
                          <Link
                            key={product._id}
                            to={`/product/${product.slug || product._id}`}
                            onClick={() => {
                              setIsSearchFocused(false);
                              setSearchQuery('');
                            }}
                            className="flex items-center gap-3 p-3 hover:bg-purple-50/60 transition-colors group/item"
                          >
                            <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100">
                              <Image
                                src={thumbUrl}
                                alt={product.name}
                                fill
                                sizes="48px"
                                className="object-cover group-hover/item:scale-105 transition-transform"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-800 group-hover/item:text-purple-700 truncate">
                                {product.name}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                                {product.rating?.count > 0 && (
                                  <span className="text-amber-500 font-bold">
                                    ★ {Number(product.rating.average || 0).toFixed(1)}
                                  </span>
                                )}
                                {isOut ? (
                                  <span className="text-red-500 font-semibold">نفذت الكمية</span>
                                ) : (
                                  <span className="text-emerald-600 font-medium">متوفر</span>
                                )}
                              </div>
                            </div>
                            <div className="text-left flex-shrink-0">
                              <span className="text-sm font-extrabold text-purple-700 block">
                                <bdi>{new Intl.NumberFormat('ar-EG').format(product.price)}</bdi>{' '}
                                <span className="text-[10px] font-normal text-gray-500">
                                  {STRINGS.PRODUCT.CURRENCY}
                                </span>
                              </span>
                              {product.oldPrice > product.price && (
                                <span className="text-[11px] text-gray-400 line-through block">
                                  <bdi>{new Intl.NumberFormat('ar-EG').format(product.oldPrice)}</bdi>
                                </span>
                              )}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2.5 px-4 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center gap-1.5 border-t border-purple-100 transition-colors"
                    >
                      <span>
                        عرض كل النتائج لـ «{debouncedQuery}» ({liveTotal})
                      </span>
                      <FiArrowLeft size={14} aria-hidden="true" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </form>

          {/* Action Icons */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Mobile Search Toggle */}
            <button
              onClick={() => setIsSearchVisible(!isSearchVisible)}
              className="md:hidden p-2 sm:p-2.5 hover:bg-purple-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors text-gray-700"
              aria-label={
                isSearchVisible
                  ? STRINGS.ACCESSIBILITY.CLOSE_SEARCH
                  : STRINGS.ACCESSIBILITY.OPEN_SEARCH
              }
              aria-expanded={isSearchVisible}
              aria-controls="mobile-search-form"
            >
              <FiSearch size={20} aria-hidden="true" />
            </button>

            {/* Admin Panel Link */}
            {isAdmin && (
              <Link
                to="/admin"
                className="hidden sm:flex p-2 sm:p-2.5 hover:bg-purple-50 rounded-xl items-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 text-purple-700 font-semibold text-sm"
                aria-label={STRINGS.NAV.ADMIN}
              >
                <FiSettings size={20} className="text-purple-600" aria-hidden="true" />
                <span className="hidden lg:inline">{STRINGS.NAV.ADMIN}</span>
              </Link>
            )}

            {/* Account / Login */}
            <Link
              to="/account"
              className={`p-2 sm:p-2.5 rounded-xl hidden sm:flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors ${
                location.pathname.startsWith('/account')
                  ? 'bg-purple-100/70 text-purple-700'
                  : 'text-gray-700 hover:bg-purple-50'
              }`}
              aria-label={isAuthenticated ? STRINGS.NAV.ACCOUNT : STRINGS.AUTH.LOGIN}
              aria-current={location.pathname.startsWith('/account') ? 'page' : undefined}
            >
              <FiUser size={20} aria-hidden="true" />
              <span className="hidden lg:inline text-sm font-medium">
                {isAuthenticated ? STRINGS.NAV.ACCOUNT : STRINGS.AUTH.LOGIN}
              </span>
            </Link>

            {/* Wishlist */}
            <Link
              to="/wishlist"
              className={`p-2 sm:p-2.5 rounded-xl relative focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors ${
                location.pathname === '/wishlist'
                  ? 'bg-purple-100/70 text-purple-700'
                  : 'text-gray-700 hover:bg-purple-50'
              }`}
              aria-label={`${STRINGS.NAV.WISHLIST}${
                countsReady && wishlistCount > 0 ? ` (${wishlistCount} ${STRINGS.PRODUCT.ITEMS})` : ''
              }`}
              aria-current={location.pathname === '/wishlist' ? 'page' : undefined}
            >
              <FiHeart size={20} aria-hidden="true" />
              {countsReady && wishlistCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm"
                  aria-hidden="true"
                >
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart Slide-Over Trigger */}
            <button
              onClick={toggleCart}
              className="p-2 sm:p-2.5 hover:bg-purple-50 rounded-xl relative focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors text-gray-700"
              aria-label={`${STRINGS.NAV.CART}${
                countsReady && cartCount > 0 ? ` (${cartCount} ${STRINGS.PRODUCT.ITEMS})` : ''
              }`}
              aria-expanded={isCartOpen}
              aria-controls="cart-sidebar"
            >
              <FiShoppingBag size={20} aria-hidden="true" />
              {countsReady && cartCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm"
                  aria-hidden="true"
                >
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Input Row */}
        {isSearchVisible && (
          <form
            ref={mobileSearchRef}
            id="mobile-search-form"
            onSubmit={handleSearch}
            className="md:hidden mt-3 animate-fadeInUp relative"
            role="search"
            aria-label="البحث عن المنتجات للهواتف"
          >
            <div className="relative">
              <label htmlFor="mobile-search" className="sr-only">
                {STRINGS.SEARCH.PLACEHOLDER}
              </label>
              <input
                id="mobile-search"
                name="search"
                type="search"
                autoComplete="off"
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchFocused(true);
                }}
                placeholder={STRINGS.SEARCH.PLACEHOLDER}
                className="w-full pl-14 pr-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all text-sm"
                autoFocus
              />
              <button
                type="submit"
                className="absolute left-1.5 top-1/2 -translate-y-1/2 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 text-white p-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                aria-label={STRINGS.SEARCH.BUTTON}
              >
                <FiSearch size={18} aria-hidden="true" />
              </button>
            </div>

            {/* Live Instant Search Autocomplete Dropdown (Mobile) */}
            {isSearchFocused && debouncedQuery.length >= 2 && (
              <div className="absolute top-full right-0 left-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                {isSearchingLive ? (
                  <div className="p-4 text-center text-gray-500 text-xs flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    <span>جاري البحث...</span>
                  </div>
                ) : liveProducts.length === 0 ? (
                  <div className="p-4 text-center text-xs text-gray-500">
                    لم نجد نتائج مطابقة لـ «{debouncedQuery}»
                  </div>
                ) : (
                  <div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                      {liveProducts.map((product) => {
                        const thumbUrl =
                          optimizeCloudinaryUrl(product.images?.[0]?.url, 120) ||
                          product.images?.[0]?.url ||
                          SITE_CONFIG.PLACEHOLDER_IMAGE;
                        return (
                          <Link
                            key={product._id}
                            to={`/product/${product.slug || product._id}`}
                            onClick={() => {
                              setIsSearchFocused(false);
                              setIsSearchVisible(false);
                              setSearchQuery('');
                            }}
                            className="flex items-center gap-3 p-2.5 hover:bg-purple-50/60 transition-colors"
                          >
                            <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                              <Image
                                src={thumbUrl}
                                alt={product.name}
                                fill
                                sizes="44px"
                                className="object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-gray-800 truncate">{product.name}</p>
                              <span className="text-xs font-bold text-purple-700">
                                <bdi>{new Intl.NumberFormat('ar-EG').format(product.price)}</bdi>{' '}
                                {STRINGS.PRODUCT.CURRENCY}
                              </span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2 px-3 bg-purple-50 text-purple-700 text-xs font-bold flex items-center justify-center gap-1 border-t border-purple-100"
                    >
                      <span>عرض كل النتائج ({liveTotal})</span>
                      <FiArrowLeft size={13} aria-hidden="true" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </form>
        )}
      </div>

      {/* Desktop Categories Navigation */}
      <nav
        className={`hidden lg:block border-t border-gray-100 transition-all duration-300 ${
          isScrolled ? 'max-h-0 overflow-hidden opacity-0' : 'h-12 min-h-[48px] opacity-100'
        }`}
        aria-label={STRINGS.NAV.CATEGORIES}
      >
        <div className="container-custom">
          <ul className="flex items-center justify-center gap-2 xl:gap-4 py-2.5 whitespace-nowrap overflow-x-auto custom-scrollbar" role="menubar">
            <li role="none" className="shrink-0">
              <Link
                to="/products"
                className={`nav-link px-3 py-1.5 rounded-xl text-sm whitespace-nowrap inline-block transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  location.pathname === '/products' && !location.search
                    ? 'text-purple-700 bg-purple-50 font-bold border border-purple-200/60'
                    : 'text-gray-700 hover:text-purple-600 font-semibold'
                }`}
                role="menuitem"
                aria-current={location.pathname === '/products' && !location.search ? 'page' : undefined}
              >
                {STRINGS.NAV.ALL_PRODUCTS}
              </Link>
            </li>
            {categories.map((category) => {
              const isCategoryActive =
                location.pathname === '/products' &&
                Boolean(category.slug) &&
                new URLSearchParams(location.search).get('category') === category.slug;
              return (
                <li key={category.slug || category._id} role="none" className="shrink-0">
                  <Link
                    to={category.slug ? `/products?category=${encodeURIComponent(category.slug)}` : '/products'}
                    className={`nav-link px-3 py-1.5 rounded-xl text-sm whitespace-nowrap inline-block transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      isCategoryActive
                        ? 'text-purple-700 bg-purple-50 font-bold border border-purple-200/60'
                        : 'text-gray-600 hover:text-purple-600 font-medium'
                    }`}
                    role="menuitem"
                    aria-current={isCategoryActive ? 'page' : undefined}
                  >
                    {category.name}
                  </Link>
                </li>
              );
            })}
            <li role="none" className="shrink-0">
              <Link
                to="/build-a-box"
                className={`flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-pink-50 to-rose-50 text-pink-700 font-bold hover:from-pink-100 hover:to-rose-100 transition-all focus:outline-none focus:ring-2 focus:ring-pink-500 rounded-full text-sm whitespace-nowrap border border-pink-200/80 shadow-sm ${
                  location.pathname === '/build-a-box' ? 'ring-2 ring-pink-500 shadow-md' : ''
                }`}
                role="menuitem"
                aria-current={location.pathname === '/build-a-box' ? 'page' : undefined}
              >
                <span aria-hidden="true">🎁</span>
                <span>{STRINGS.HEADER.BUILD_BOX}</span>
              </Link>
            </li>
            <li role="none" className="shrink-0">
              <Link
                to="/gift-finder"
                className={`flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 font-bold hover:from-purple-100 hover:to-pink-100 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-full text-sm whitespace-nowrap border border-purple-200/80 shadow-sm ${
                  location.pathname === '/gift-finder' ? 'ring-2 ring-purple-500 shadow-md' : ''
                }`}
                role="menuitem"
                aria-current={location.pathname === '/gift-finder' ? 'page' : undefined}
              >
                <span aria-hidden="true">🎯</span>
                <span>{STRINGS.NAV.GIFT_FINDER}</span>
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  );
};

export default memo(Header);
