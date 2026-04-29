import { Link, useNavigate } from 'react-router-dom'
import { FiHeart, FiShoppingBag, FiEye } from 'react-icons/fi'
import { useCartStore, useWishlistStore, useAuthStore } from '../../store'
import toast from 'react-hot-toast'

const ProductCard = ({ product }) => {
  const { addItem } = useCartStore()
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlistStore()
  const { isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  
  const inWishlist = isInWishlist(product._id)
  
  const handleAddToCart = (e) => {
    e.preventDefault()
    const result = addItem(product, 1)

    if (!result?.success) {
      toast.error('الكمية غير متاحة حالياً')
      return
    }

    if (result.capped && result.maxStock !== null) {
      toast.success(`تمت إضافة المتاح فقط (الحد الأقصى ${result.maxStock})`)
      return
    }

    toast.success('تمت الإضافة إلى السلة')
  }
  
  const handleToggleWishlist = (e) => {
    e.preventDefault()
    if (!isAuthenticated) {
      toast.error('سجل دخول أولاً لإضافة منتجات لقائمة الأمنيات')
      navigate('/account')
      return
    }
    if (inWishlist) {
      removeFromWishlist(product._id)
      toast.success('تمت الإزالة من قائمة الأمنيات')
    } else {
      addToWishlist(product)
      toast.success('تمت الإضافة إلى قائمة الأمنيات')
    }
  }

  const discount = product.oldPrice 
    ? Math.round((1 - product.price / product.oldPrice) * 100) 
    : 0

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ar-EG').format(price)
  }

  return (
    <div className="card product-card group">
      {/* Image Container */}
      <div className="relative overflow-hidden bg-gray-50">
        <Link to={`/product/${product.slug}`}>
          <img 
            src={product.images?.[0]?.url || '/images/placeholder.jpg'} 
            alt={product.images?.[0]?.alt || product.name}
            className="product-image"
            loading="lazy"
          />
        </Link>
        
        {/* Badges */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5">
          {discount > 0 && (
            <span className="badge badge-sale">-{discount}%</span>
          )}
          {product.isNew && (
            <span className="badge badge-new">جديد</span>
          )}
          {product.isBestseller && (
            <span className="badge badge-bestseller">الأكثر مبيعاً</span>
          )}
        </div>
        
        {/* Quick Actions */}
        <div className="quick-actions">
          <button 
            onClick={handleToggleWishlist}
            className={`quick-action-btn ${inWishlist ? '!bg-red-500 !text-white shadow-red-500/30' : ''}`}
            title={inWishlist ? 'إزالة من الأمنيات' : 'أضف للأمنيات'}
          >
            <FiHeart className={inWishlist ? 'fill-current' : ''} size={16} />
          </button>
          <Link 
            to={`/product/${product.slug}`}
            className="quick-action-btn"
            title="عرض سريع"
          >
            <FiEye size={16} />
          </Link>
          <button 
            onClick={handleAddToCart}
            className="quick-action-btn"
            title="أضف للسلة"
            disabled={Number(product.stock) === 0}
          >
            <FiShoppingBag size={16} />
          </button>
        </div>

        {/* Out of stock overlay */}
        {Number(product.stock) === 0 && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-gray-900/80 text-white px-4 py-2 rounded-full text-sm font-medium">نفذت الكمية</span>
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="p-4">
        {/* Category */}
        {product.category && (
          <div className="text-xs text-purple-400 font-medium uppercase tracking-wider">
            {(Array.isArray(product.category) ? product.category : [product.category]).filter(Boolean).map((cat, i, arr) => (
              <span key={cat._id || i}>
                <Link 
                  to={`/products?category=${cat.slug}`}
                  className="hover:text-purple-600 transition-colors"
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
            className="font-semibold text-gray-800 hover:text-purple-700 line-clamp-2 transition-colors duration-200 text-sm sm:text-base"
          >
            {product.name}
          </Link>
        </h3>
        
        {/* Rating */}
        {product.rating?.count > 0 && (
          <div className="flex items-center gap-1.5 mt-2 rating-stars">
            <div className="flex text-amber-400 text-sm">
              {[...Array(5)].map((_, i) => (
                <span key={i} className={i < Math.round(product.rating.average) ? '' : 'opacity-30'}>
                  ★
                </span>
              ))}
            </div>
            <span className="text-xs text-gray-400">
              ({product.rating.count})
            </span>
          </div>
        )}
        
        {/* Price */}
        <div className="flex items-baseline gap-2 mt-3">
          <span className="text-lg font-bold text-gray-900">
            {formatPrice(product.price)} <span className="text-xs font-normal text-gray-500">ج.م</span>
          </span>
          {product.oldPrice && (
            <span className="text-sm text-gray-400 line-through">
              {formatPrice(product.oldPrice)}
            </span>
          )}
        </div>
        
        {/* Add to Cart Button - Mobile */}
        <button 
          onClick={handleAddToCart}
          disabled={Number(product.stock) === 0}
          className="w-full mt-4 bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white py-2.5 rounded-xl font-medium 
                     hover:from-purple-600 hover:to-fuchsia-600 hover:shadow-lg hover:shadow-purple-500/25 
                     transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none
                     active:scale-[0.98] md:hidden text-sm"
        >
          {Number(product.stock) === 0 ? 'نفذت الكمية' : '🛒 أضف للسلة'}
        </button>
      </div>
    </div>
  )
}

export default ProductCard
