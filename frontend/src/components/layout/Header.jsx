import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import Image from 'next/image';
import { Link, useNavigate } from 'react-router-dom';
import { FiSearch, FiUser, FiHeart, FiShoppingBag, FiMenu, FiSettings } from 'react-icons/fi';
import { useCartStore, useWishlistStore, useAuthStore, useUIStore } from '../../store';
import { STRINGS } from '../../constants';

/**
 * Granularly Optimized & Accessible Main Header
 */
const Header = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const scrolledRef = useRef(false);

  // 1. Atomic Zustand Selectors (Prevents re-renders across the entire navbar tree on unrelated state changes)
  const cartCount = useCartStore((state) =>
    state.items.reduce((total, item) => total + (item.quantity || 1), 0)
  );
  const wishlistCount = useWishlistStore((state) => state.items.length);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isAdmin = useAuthStore((state) => state.user?.role === 'admin');

  const isMobileMenuOpen = useUIStore((state) => state.isMobileMenuOpen);
  const isCartOpen = useUIStore((state) => state.isCartOpen);
  const toggleMobileMenu = useUIStore((state) => state.toggleMobileMenu);
  const toggleCart = useUIStore((state) => state.toggleCart);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
        setIsSearchVisible(false);
      }
    },
    [searchQuery, navigate]
  );

  const categories = STRINGS.HEADER.CATEGORIES;

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
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
            <Link to="/track-order" className="hover:text-white/80 transition-colors">
              {STRINGS.NAV.TRACK_ORDER}
            </Link>
            <Link to="/stores" className="hover:text-white/80 transition-colors">
              {STRINGS.NAV.STORES}
            </Link>
            <Link to="/contact" className="hover:text-white/80 transition-colors">
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
                sizes="(max-width: 640px) 112px, (max-width: 768px) 144px, 176px"
                className="object-contain"
              />
            </div>
          </Link>

          {/* Desktop Search Form */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl mx-4" role="search" aria-label="البحث عن المنتجات">
            <div className="relative w-full group">
              <label htmlFor="desktop-search" className="sr-only">
                {STRINGS.SEARCH.PLACEHOLDER}
              </label>
              <input
                id="desktop-search"
                name="search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
              className="p-2 sm:p-2.5 hover:bg-purple-50 rounded-xl hidden sm:flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors text-gray-700"
              aria-label={isAuthenticated ? STRINGS.NAV.ACCOUNT : STRINGS.AUTH.LOGIN}
            >
              <FiUser size={20} aria-hidden="true" />
              <span className="hidden lg:inline text-sm font-medium">
                {isAuthenticated ? STRINGS.NAV.ACCOUNT : STRINGS.AUTH.LOGIN}
              </span>
            </Link>

            {/* Wishlist */}
            <Link
              to="/wishlist"
              className="p-2 sm:p-2.5 hover:bg-purple-50 rounded-xl relative focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors text-gray-700"
              aria-label={`${STRINGS.NAV.WISHLIST}${
                isMounted && wishlistCount > 0 ? ` (${wishlistCount} ${STRINGS.PRODUCT.ITEMS})` : ''
              }`}
            >
              <FiHeart size={20} aria-hidden="true" />
              {isMounted && wishlistCount > 0 && (
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
                isMounted && cartCount > 0 ? ` (${cartCount} ${STRINGS.PRODUCT.ITEMS})` : ''
              }`}
              aria-expanded={isCartOpen}
              aria-controls="cart-sidebar"
            >
              <FiShoppingBag size={20} aria-hidden="true" />
              {isMounted && cartCount > 0 && (
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
            id="mobile-search-form"
            onSubmit={handleSearch}
            className="md:hidden mt-3 animate-fadeInUp"
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
          </form>
        )}
      </div>

      {/* Desktop Categories Navigation */}
      <nav
        className={`hidden lg:block border-t border-gray-100 transition-all duration-300 ${
          isScrolled ? 'max-h-0 overflow-hidden opacity-0' : 'max-h-16 opacity-100'
        }`}
        aria-label={STRINGS.NAV.CATEGORIES}
      >
        <div className="container-custom">
          <ul className="flex items-center justify-center gap-8 py-3" role="menubar">
            <li role="none">
              <Link
                to="/products"
                className="nav-link text-gray-700 hover:text-purple-600 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 rounded text-sm"
                role="menuitem"
              >
                {STRINGS.NAV.ALL_PRODUCTS}
              </Link>
            </li>
            {categories.map((category) => (
              <li key={category.slug} role="none">
                <Link
                  to={`/products?category=${category.slug}`}
                  className="nav-link text-gray-600 hover:text-purple-600 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 rounded text-sm"
                  role="menuitem"
                >
                  {category.name}
                </Link>
              </li>
            ))}
            <li role="none">
              <Link
                to="/build-a-box"
                className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-pink-50 to-rose-50 text-pink-700 font-semibold hover:from-pink-100 hover:to-rose-100 transition-all focus:outline-none focus:ring-2 focus:ring-pink-500 rounded-full text-sm"
                role="menuitem"
              >
                <span aria-hidden="true">🎁</span>
                {STRINGS.HEADER.BUILD_BOX}
              </Link>
            </li>
            <li role="none">
              <Link
                to="/gift-finder"
                className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 font-semibold hover:from-purple-100 hover:to-pink-100 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-full text-sm"
                role="menuitem"
              >
                <span aria-hidden="true">🎯</span>
                {STRINGS.NAV.GIFT_FINDER}
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  );
};

export default memo(Header);
