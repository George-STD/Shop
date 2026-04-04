import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiSearch, FiUser, FiHeart, FiShoppingBag, FiMenu, FiX, FiSettings } from 'react-icons/fi'
import { useCartStore, useWishlistStore, useAuthStore, useUIStore } from '../../store'
import { STRINGS } from '../../constants'

const Header = () => {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchVisible, setIsSearchVisible] = useState(false)
  
  const { getItemsCount } = useCartStore()
  const { items: wishlistItems } = useWishlistStore()
  const { isAuthenticated, user } = useAuthStore()
  const { toggleMobileMenu, toggleCart } = useUIStore()
  
  const cartCount = getItemsCount()
  const wishlistCount = wishlistItems.length
  const isAdmin = user?.role === 'admin'

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
    <header className="sticky top-0 z-50 bg-white shadow-sm" role="banner">
      {/* Top Bar */}
      <div className="bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white text-sm py-2">
        <div className="container-custom flex justify-between items-center">
          <p>{STRINGS.HOME.TAGLINE}</p>
          <nav className="hidden md:flex gap-4" aria-label="روابط سريعة">
            <Link to="/track-order" className="hover:underline">{STRINGS.NAV.TRACK_ORDER}</Link>
            <Link to="/stores" className="hover:underline">{STRINGS.NAV.STORES}</Link>
            <Link to="/contact" className="hover:underline">{STRINGS.NAV.CONTACT}</Link>
          </nav>
        </div>
      </div>

      {/* Main Header */}
      <div className="container-custom py-2">
        <div className="flex items-center justify-between gap-4">
          {/* Mobile Menu Button */}
          <button 
            onClick={toggleMobileMenu}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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
              className="h-14 sm:h-20 md:h-28 w-auto object-contain"
            />
          </Link>

          {/* Search Bar - Desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl" role="search">
            <div className="relative w-full">
              <label htmlFor="desktop-search" className="sr-only">{STRINGS.SEARCH.PLACEHOLDER}</label>
              <input
                id="desktop-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={STRINGS.SEARCH.PLACEHOLDER}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <button 
                type="submit"
                className="absolute left-1 top-1/2 -translate-y-1/2 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 text-white p-2 rounded-full hover:from-purple-600 hover:via-fuchsia-600 hover:to-pink-600 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                aria-label={STRINGS.SEARCH.BUTTON}
              >
                <FiSearch size={20} aria-hidden="true" />
              </button>
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Mobile Search Toggle */}
            <button 
              onClick={() => setIsSearchVisible(!isSearchVisible)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              aria-label={isSearchVisible ? STRINGS.ACCESSIBILITY.CLOSE_SEARCH : STRINGS.ACCESSIBILITY.OPEN_SEARCH}
              aria-expanded={isSearchVisible}
            >
              <FiSearch size={22} aria-hidden="true" />
            </button>

            {/* Admin Panel Link - Only for admins */}
            {isAdmin && (
              <Link 
                to="/admin" 
                className="p-2 hover:bg-gray-100 rounded-lg flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                aria-label={STRINGS.NAV.ADMIN}
              >
                <FiSettings size={22} aria-hidden="true" />
                <span className="hidden lg:inline text-sm font-medium">
                  {STRINGS.NAV.ADMIN}
                </span>
              </Link>
            )}

            {/* Account */}
            <Link 
              to="/account" 
              className="p-2 hover:bg-gray-100 rounded-lg hidden sm:flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              aria-label={isAuthenticated ? STRINGS.NAV.ACCOUNT : STRINGS.AUTH.LOGIN}
            >
              <FiUser size={22} aria-hidden="true" />
              <span className="hidden lg:inline text-sm">
                {isAuthenticated ? STRINGS.NAV.ACCOUNT : STRINGS.AUTH.LOGIN}
              </span>
            </Link>

            {/* Wishlist */}
            <Link 
              to="/wishlist" 
              className="p-2 hover:bg-gray-100 rounded-lg relative focus:outline-none focus:ring-2 focus:ring-purple-500"
              aria-label={`${STRINGS.NAV.WISHLIST}${wishlistCount > 0 ? ` (${wishlistCount} ${STRINGS.PRODUCT.ITEMS})` : ''}`}
            >
              <FiHeart size={22} aria-hidden="true" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center" aria-hidden="true">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart */}
            <button 
              onClick={toggleCart}
              className="p-2 hover:bg-gray-100 rounded-lg relative focus:outline-none focus:ring-2 focus:ring-purple-500"
              aria-label={`${STRINGS.NAV.CART}${cartCount > 0 ? ` (${cartCount} ${STRINGS.PRODUCT.ITEMS})` : ''}`}
            >
              <FiShoppingBag size={22} aria-hidden="true" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center" aria-hidden="true">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        {isSearchVisible && (
          <form onSubmit={handleSearch} className="md:hidden mt-4" role="search">
            <div className="relative">
              <label htmlFor="mobile-search" className="sr-only">{STRINGS.SEARCH.PLACEHOLDER}</label>
              <input
                id="mobile-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={STRINGS.SEARCH.PLACEHOLDER}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500"
                autoFocus
              />
              <button 
                type="submit"
                className="absolute left-1 top-1/2 -translate-y-1/2 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 text-white p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                aria-label={STRINGS.SEARCH.BUTTON}
              >
                <FiSearch size={20} aria-hidden="true" />
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Categories Navigation - Desktop */}
      <nav className="hidden lg:block border-t border-gray-200" aria-label={STRINGS.NAV.CATEGORIES}>
        <div className="container-custom">
          <ul className="flex items-center justify-center gap-8 py-3" role="menubar">
            <li role="none">
              <Link 
                to="/products" 
                className="text-gray-700 hover:text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 rounded"
                role="menuitem"
              >
                {STRINGS.NAV.ALL_PRODUCTS}
              </Link>
            </li>
            {categories.map((category) => (
              <li key={category.slug} role="none">
                <Link 
                  to={`/products?category=${category.slug}`}
                  className="text-gray-700 hover:text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 rounded"
                  role="menuitem"
                >
                  {category.name}
                </Link>
              </li>
            ))}
            <li role="none">
              <Link 
                to="/gift-finder" 
                className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 font-medium flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded"
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
