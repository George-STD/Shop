import { Link } from 'react-router-dom'
import { FiHeart, FiShoppingBag, FiEye } from 'react-icons/fi'
import { useCartStore, useWishlistStore } from '../../store'
import toast from 'react-hot-toast'

const ProductCard = ({ product }) => {
  const { addItem } = useCartStore()
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlistStore()
  
  const inWishlist = isInWishlist(product._id)
  
  const handleAddToCart = (e) => {
    e.preventDefault()
    addItem(product, 1)
    toast.success('تمت الإضافة إلى السلة')
  }
  
  const handleToggleWishlist = (e) => {
    e.preventDefault()
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

  return (
    <div className="card product-card group">
      {/* Image Container */}
      <div className="relative overflow-hidden">
        <Link to={`/product/${product.slug}`}>
          <img 
            src={product.images?.[0]?.url || '/images/placeholder.jpg'} 
            alt={product.images?.[0]?.alt || product.name}
            className="product-image"
            loading="lazy"
          />
        </Link>
        
        {/* Badges */}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
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
            className={`quick-action-btn ${inWishlist ? 'bg-red-500 text-white' : ''}`}
            title={inWishlist ? 'إزالة من الأمنيات' : 'أضف للأمنيات'}
          >
            <FiHeart className={inWishlist ? 'fill-current' : ''} />
          </button>
          <Link 
            to={`/product/${product.slug}`}
            className="quick-action-btn"
            title="عرض سريع"
          >
            <FiEye />
          </Link>
          <button 
            onClick={handleAddToCart}
            className="quick-action-btn"
            title="أضف للسلة"
          >
            <FiShoppingBag />
          </button>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4">
        {/* Category */}
        {product.category && (
          <Link 
            to={`/products/${product.category.slug}`}
            className="text-sm text-gray-500 hover:text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600"
          >
            {product.category.name}
          </Link>
        )}
        
        {/* Name */}
        <h3 className="mt-1">
          <Link 
            to={`/product/${product.slug}`}
            className="font-medium text-gray-800 hover:text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 line-clamp-2 transition-colors"
          >
            {product.name}
          </Link>
        </h3>
        
        {/* Rating */}
        {product.rating?.count > 0 && (
          <div className="flex items-center gap-1 mt-2 rating-stars">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <span key={i}>
                  {i < Math.round(product.rating.average) ? '★' : '☆'}
                </span>
              ))}
            </div>
            <span className="text-sm text-gray-500">
              ({product.rating.count})
            </span>
          </div>
        )}
        
        {/* Price */}
        <div className="flex items-center gap-2 mt-3">
          <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
            {product.price} ج.م
          </span>
          {product.oldPrice && (
            <span className="text-sm text-gray-400 line-through">
              {product.oldPrice} ج.م
            </span>
          )}
        </div>
        
        {/* Add to Cart Button - Mobile */}
        <button 
          onClick={handleAddToCart}
          className="w-full mt-4 bg-gray-100 text-gray-800 py-2 rounded-lg font-medium hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 hover:text-white transition-colors md:hidden"
        >
          أضف للسلة
        </button>
      </div>
    </div>
  )
}

export default ProductCard
