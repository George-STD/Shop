import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiSearch, FiUser, FiHeart, FiShoppingBag, FiMenu, FiX, FiSettings } from 'react-icons/fi'
import { useCartStore, useWishlistStore, useAuthStore, useUIStore } from '../../store'

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
    { name: '????? ??? ???????', slug: 'birthday-gifts' },
    { name: '????? ??????', slug: 'wedding-gifts' },
    { name: '????? ?????', slug: 'flower-bouquets' },
    { name: '??????????', slug: 'chocolates-sweets' },
    { name: '??????', slug: 'perfumes' },
    { name: '???????', slug: 'watches-accessories' },
    { name: '????? ?????', slug: 'personalized-gifts' },
    { name: '????? ???????', slug: 'kids-gifts' },
  ]

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      {/* Top Bar */}
      <div className="bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white text-sm py-2">
        <div className="container-custom flex justify-between items-center">
          <p>????? ????? ??????? ???? ?? 500 ???? ??</p>
          <div className="hidden md:flex gap-4">
            <Link to="/track-order" className="hover:underline">???? ????</Link>
            <Link to="/stores" className="hover:underline">??????</Link>
            <Link to="/contact" className="hover:underline">???? ???</Link>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container-custom py-2">
        <div className="flex items-center justify-between gap-4">
          {/* Mobile Menu Button */}
          <button 
            onClick={toggleMobileMenu}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
          >
            <FiMenu size={24} />
          </button>

          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <img 
              src="/images/logo.jpeg" 
              alt="For You Gift Shop" 
              className="h-24 md:h-28 w-auto object-contain"
            />
          </Link>

          {/* Search Bar - Desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="???? ?? ????..."
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <button 
                type="submit"
                className="absolute left-1 top-1/2 -translate-y-1/2 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 text-white p-2 rounded-full hover:from-purple-600 hover:via-fuchsia-600 hover:to-pink-600 transition-colors"
              >
                <FiSearch size={20} />
              </button>
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Mobile Search Toggle */}
            <button 
              onClick={() => setIsSearchVisible(!isSearchVisible)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              <FiSearch size={22} />
            </button>

            {/* Admin Panel Link - Only for admins */}
            {isAdmin && (
              <Link 
                to="/admin" 
                className="p-2 hover:bg-gray-100 rounded-lg hidden sm:flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600"
                title="???? ??????"
              >
                <FiSettings size={22} />
                <span className="hidden lg:inline text-sm font-medium">
                  ???? ??????
                </span>
              </Link>
            )}

            {/* Account */}
            <Link 
              to="/account" 
              className="p-2 hover:bg-gray-100 rounded-lg hidden sm:flex items-center gap-2"
            >
              <FiUser size={22} />
              <span className="hidden lg:inline text-sm">
                {isAuthenticated ? '?????' : '????? ??????'}
              </span>
            </Link>

            {/* Wishlist */}
            <Link to="/wishlist" className="p-2 hover:bg-gray-100 rounded-lg relative">
              <FiHeart size={22} />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart */}
            <button 
              onClick={toggleCart}
              className="p-2 hover:bg-gray-100 rounded-lg relative"
            >
              <FiShoppingBag size={22} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        {isSearchVisible && (
          <form onSubmit={handleSearch} className="md:hidden mt-4">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="???? ?? ????..."
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500"
                autoFocus
              />
              <button 
                type="submit"
                className="absolute left-1 top-1/2 -translate-y-1/2 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 text-white p-2 rounded-full"
              >
                <FiSearch size={20} />
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Categories Navigation - Desktop */}
      <nav className="hidden lg:block border-t border-gray-200">
        <div className="container-custom">
          <ul className="flex items-center justify-center gap-8 py-3">
            <li>
              <Link 
                to="/products" 
                className="text-gray-700 hover:text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 font-medium transition-colors"
              >
                ???? ????????
              </Link>
            </li>
            {categories.map((category) => (
              <li key={category.slug}>
                <Link 
                  to={`/products/${category.slug}`}
                  className="text-gray-700 hover:text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 transition-colors"
                >
                  {category.name}
                </Link>
              </li>
            ))}
            <li>
              <Link 
                to="/gift-finder" 
                className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 hover:text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-pink-700 font-medium flex items-center gap-1"
              >
                <span>??</span>
                ???? ??? ?????? ????????
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  )
}

export default Header

