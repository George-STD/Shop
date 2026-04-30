import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiSearch, FiUser, FiHeart, FiShoppingBag, FiMenu, FiX, FiSettings } from 'react-icons/fi'
import { useCartStore, useWishlistStore, useAuthStore, useUIStore } from '../../store'
import { STRINGS } from '../../constants'

const Header = () => {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchVisible, setIsSearchVisible] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const scrolledRef = useRef(false)
  
  const { getItemsCount } = useCartStore()
  const { items: wishlistItems } = useWishlistStore()
  const { isAuthenticated, user } = useAuthStore()
  const { toggleMobileMenu, toggleCart } = useUIStore()
  
  const cartCount = getItemsCount()
  const wishlistCount = wishlistItems.length
  const isAdmin = user?.role === 'admin'

  // Scroll detection with hysteresis to prevent vibration
  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY
      // Use a large gap between thresholds to account for the header's height reduction (~160px).
      // When the header shrinks, scroll anchoring shifts scrollY down by ~160px.
      if (!scrolledRef.current && y > 250) {
        scrolledRef.current = true
        setIsScrolled(true)
      } else if (scrolledRef.current && y < 20) {
        scrolledRef.current = false
        setIsScrolled(false)
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`)
      setSearchQuery('')
      setIsSearchVisible(false)
    }
  }

  const categories = [
    { name: 'رجالي مميز', slug: 'special-men' },
    { name: 'نسائي مميز', slug: 'special-women' },
    { name: 'رجالي', slug: 'men' },
    { name: 'نسائي', slug: 'women' },
    { name: 'الهدايا الشخصية', slug: 'personal-gifts' },
    { name: 'العطور', slug: 'perfumes' },
  ]

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled ? 'header-scrolled' : 'bg-white shadow-sm'}`} role="banner">
      {/* Top Bar */}
      <div className={`topbar-gradient text-white text-sm transition-all duration-300 overflow-hidden ${isScrolled ? 'py-0 max-h-0 opacity-0' : 'py-2 max-h-12 opacity-100'}`}>
        <div className="container-custom flex justify-between items-center">
          <p className="flex items-center gap-2">
            <span className="animate-pulse">✨</span>
            {STRINGS.HOME.TAGLINE}
          </p>
          <nav className="hidden md:flex gap-4" aria-label="روابط سريعة">
            <Link to="/track-order" className="hover:text-white/80 transition-colors">{STRINGS.NAV.TRACK_ORDER}</Link>
            <Link to="/stores" className="hover:text-white/80 transition-colors">{STRINGS.NAV.STORES}</Link>
            <Link to="/contact" className="hover:text-white/80 transition-colors">{STRINGS.NAV.CONTACT}</Link>
          </nav>
        </div>
      </div>

      {/* Main Header */}
      <div className={`container-custom transition-all duration-300 ${isScrolled ? 'py-1.5' : 'py-2'}`}>
        <div className="flex items-center justify-between gap-4">
          {/* Mobile Menu Button */}
          <button 
            onClick={toggleMobileMenu}
            className="lg:hidden p-2 hover:bg-purple-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
            aria-label={STRINGS.ACCESSIBILITY.OPEN_MENU}
            aria-expanded="false"
          >
            <FiMenu size={24} aria-hidden="true" />
          </button>

          {/* Logo */}
          <Link to="/" className="flex-shrink-0" aria-label={STRINGS.NAV.HOME}>
            <img 
              src="/images/logo.jpeg" 
              alt="For You Gift Shop - فور يو للهدايا" 
              className={`w-auto object-contain transition-all duration-300 ${isScrolled ? 'h-10 sm:h-14' : 'h-14 sm:h-20 md:h-28'}`}
            />
          </Link>

          {/* Search Bar - Desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl" role="search">
            <div className="relative w-full group">
              <label htmlFor="desktop-search" className="sr-only">{STRINGS.SEARCH.PLACEHOLDER}</label>
              <input
                id="desktop-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={STRINGS.SEARCH.PLACEHOLDER}
                className="w-full pl-14 pr-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:bg-white transition-all duration-300 group-hover:border-purple-300"
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

          {/* Actions */}
          <div className="flex items-center gap-1 md:gap-2">
            {/* Mobile Search Toggle */}
            <button 
              onClick={() => setIsSearchVisible(!isSearchVisible)}
              className="md:hidden p-2.5 hover:bg-purple-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
              aria-label={isSearchVisible ? STRINGS.ACCESSIBILITY.CLOSE_SEARCH : STRINGS.ACCESSIBILITY.OPEN_SEARCH}
              aria-expanded={isSearchVisible}
            >
              <FiSearch size={20} aria-hidden="true" />
            </button>

            {/* Admin Panel Link - Only for admins */}
            {isAdmin && (
              <Link 
                to="/admin" 
                className="p-2.5 hover:bg-purple-50 rounded-xl flex items-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
                aria-label={STRINGS.NAV.ADMIN}
              >
                <FiSettings size={20} className="text-purple-600" aria-hidden="true" />
                <span className="hidden lg:inline text-sm font-medium text-purple-700">
                  {STRINGS.NAV.ADMIN}
                </span>
              </Link>
            )}

            {/* Account */}
            <Link 
              to="/account" 
              className="p-2.5 hover:bg-purple-50 rounded-xl hidden sm:flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
              aria-label={isAuthenticated ? STRINGS.NAV.ACCOUNT : STRINGS.AUTH.LOGIN}
            >
              <FiUser size={20} aria-hidden="true" />
              <span className="hidden lg:inline text-sm">
                {isAuthenticated ? STRINGS.NAV.ACCOUNT : STRINGS.AUTH.LOGIN}
              </span>
            </Link>

            {/* Wishlist */}
            <Link 
              to="/wishlist" 
              className="p-2.5 hover:bg-purple-50 rounded-xl relative focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
              aria-label={`${STRINGS.NAV.WISHLIST}${wishlistCount > 0 ? ` (${wishlistCount} ${STRINGS.PRODUCT.ITEMS})` : ''}`}
            >
              <FiHeart size={20} aria-hidden="true" />
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm" aria-hidden="true">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart */}
            <button 
              onClick={toggleCart}
              className="p-2.5 hover:bg-purple-50 rounded-xl relative focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
              aria-label={`${STRINGS.NAV.CART}${cartCount > 0 ? ` (${cartCount} ${STRINGS.PRODUCT.ITEMS})` : ''}`}
            >
              <FiShoppingBag size={20} aria-hidden="true" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm animate-[pulse-ring_2s_ease-in-out_infinite]" aria-hidden="true">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        {isSearchVisible && (
          <form onSubmit={handleSearch} className="md:hidden mt-3 animate-fadeInUp" role="search">
            <div className="relative">
              <label htmlFor="mobile-search" className="sr-only">{STRINGS.SEARCH.PLACEHOLDER}</label>
              <input
                id="mobile-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={STRINGS.SEARCH.PLACEHOLDER}
                className="w-full pl-14 pr-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
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

      {/* Categories Navigation - Desktop */}
      <nav className={`hidden lg:block border-t border-gray-100 transition-all duration-300 ${isScrolled ? 'max-h-0 overflow-hidden opacity-0' : 'max-h-16 opacity-100'}`} aria-label={STRINGS.NAV.CATEGORIES}>
        <div className="container-custom">
          <ul className="flex items-center justify-center gap-8 py-3" role="menubar">
            <li role="none">
              <Link 
                to="/products" 
                className="nav-link text-gray-700 hover:text-purple-600 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 rounded"
                role="menuitem"
              >
                {STRINGS.NAV.ALL_PRODUCTS}
              </Link>
            </li>
            {categories.map((category) => (
              <li key={category.slug} role="none">
                <Link 
                  to={`/products?category=${category.slug}`}
                  className="nav-link text-gray-600 hover:text-purple-600 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 rounded"
                  role="menuitem"
                >
                  {category.name}
                </Link>
              </li>
            ))}
            <li role="none">
              <Link 
                to="/gift-finder" 
                className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-purple-50 to-pink-50 rounded-full text-purple-700 font-medium hover:from-purple-100 hover:to-pink-100 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 rounded"
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
  )
}

export default Header
