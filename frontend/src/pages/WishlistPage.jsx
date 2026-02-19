import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { FiHeart, FiTrash2, FiShoppingCart } from 'react-icons/fi'
import { useWishlistStore, useCartStore } from '../store'

const WishlistPage = () => {
  const { items, removeItem, clearWishlist } = useWishlistStore()
  const { addItem } = useCartStore()

  const handleAddToCart = (product) => {
    addItem(product)
    removeItem(product._id)
  }

  return (
    <>
      <Helmet>
        <title>قائمة الأمنيات | For You</title>
        <meta name="description" content="قائمة أمنياتك - احفظ منتجاتك المفضلة واشتريها لاحقاً" />
      </Helmet>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container-custom">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">قائمة الأمنيات</h1>
              <p className="text-gray-500 mt-1">{items.length} منتج</p>
            </div>
            {items.length > 0 && (
              <button
                onClick={clearWishlist}
                className="text-red-500 hover:text-red-600 flex items-center gap-2"
              >
                <FiTrash2 />
                مسح الكل
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="text-center py-16">
              <FiHeart className="text-6xl text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-800 mb-2">قائمة الأمنيات فارغة</h2>
              <p className="text-gray-500 mb-6">أضف منتجاتك المفضلة واحتفظ بها لوقت لاحق</p>
              <Link to="/products" className="btn-primary">
                تصفح المنتجات
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {items.map((product) => (
                <div key={product._id} className="bg-white rounded-2xl overflow-hidden shadow-sm group">
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={product.images?.[0] || '/placeholder.jpg'}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <button
                      onClick={() => removeItem(product._id)}
                      className="absolute top-3 left-3 p-2 bg-white rounded-full shadow-md text-red-500 hover:bg-red-50"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                  
                  <div className="p-4">
                    <Link to={`/product/${product.slug}`} className="block">
                      <h3 className="font-medium text-gray-800 hover:text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-2 line-clamp-2">
                        {product.name}
                      </h3>
                    </Link>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {product.comparePrice && (
                          <span className="text-gray-400 line-through text-sm">
                            {product.comparePrice} ج.م
                          </span>
                        )}
                        <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                          {product.price} ج.م
                        </span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="mt-4 w-full btn-primary flex items-center justify-center gap-2"
                    >
                      <FiShoppingCart />
                      أضف للسلة
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default WishlistPage
