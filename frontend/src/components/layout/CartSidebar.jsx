import { Link } from 'react-router-dom'
import { FiX, FiTrash2, FiPlus, FiMinus, FiShoppingBag } from 'react-icons/fi'
import { useUIStore, useCartStore } from '../../store'
import toast from 'react-hot-toast'

const CartSidebar = () => {
  const { closeCart } = useUIStore()
  const { items, removeItem, updateQuantity, getTotal } = useCartStore()

  const increaseQuantity = (item) => {
    const result = updateQuantity(
      item.id,
      item.quantity + 1,
      item.selectedSize,
      item.selectedColor,
      item.selectedShape,
      item._variantsKey
    )

    if (result?.capped && result.maxStock !== null) {
      toast.error(`الحد الأقصى المتاح هو ${result.maxStock}`)
    }
  }
  
  const total = getTotal()
  const shippingCost = 60

  const formatPrice = (price) => new Intl.NumberFormat('ar-EG').format(price)

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm overlay-backdrop"
        onClick={closeCart}
      />
      
      {/* Cart Panel */}
      <div className="absolute top-0 left-0 h-full w-[85vw] sm:w-96 max-w-full bg-white shadow-2xl flex flex-col panel-slide-left">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center">
              <FiShoppingBag size={18} className="text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">سلة التسوق</h2>
              {items.length > 0 && (
                <p className="text-xs text-gray-400">{items.length} منتج</p>
              )}
            </div>
          </div>
          <button 
            onClick={closeCart}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <FiX size={22} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-50 to-pink-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <span className="text-4xl">🛒</span>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                السلة فارغة
              </h3>
              <p className="text-gray-400 mb-8 text-sm">
                لم تضف أي منتجات بعد، ابدأ التسوق الآن!
              </p>
              <Link 
                to="/products"
                onClick={closeCart}
                className="btn-primary inline-block text-sm"
              >
                تسوق الآن ←
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={`${item.id}-${index}`} className="flex gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-100 hover:border-purple-100 transition-colors">
                  {/* Image */}
                  <Link 
                    to={`/product/${item.slug}`}
                    onClick={closeCart}
                    className="w-20 h-20 flex-shrink-0 overflow-hidden rounded-xl"
                  >
                    <img 
                      src={item.image || '/images/placeholder.jpg'} 
                      alt={item.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </Link>
                  
                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <Link 
                      to={`/product/${item.slug}`}
                      onClick={closeCart}
                      className="font-medium text-gray-800 hover:text-purple-700 line-clamp-2 text-sm transition-colors"
                    >
                      {item.name}
                    </Link>
                    
                    {/* Options */}
                    {(item.selectedSize || item.selectedColor) && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {item.selectedSize && `المقاس: ${item.selectedSize}`}
                        {item.selectedSize && item.selectedColor && ' | '}
                        {item.selectedColor && `اللون: ${item.selectedColor}`}
                      </p>
                    )}
                    
                    {/* Price */}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-bold text-gray-900 text-sm">
                        {formatPrice(item.price)} ج.م
                      </span>
                      {item.oldPrice && (
                        <span className="text-xs text-gray-400 line-through">
                          {formatPrice(item.oldPrice)}
                        </span>
                      )}
                    </div>
                    
                    {/* Quantity & Remove */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-0">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1, item.selectedSize, item.selectedColor, item.selectedShape, item._variantsKey)}
                          className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:border-purple-300 hover:bg-purple-50 transition-colors"
                          disabled={item.quantity <= 1}
                        >
                          <FiMinus size={12} />
                        </button>
                        <span className="w-9 text-center font-bold text-sm">{item.quantity}</span>
                        <button
                          onClick={() => increaseQuantity(item)}
                          className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:border-purple-300 hover:bg-purple-50 transition-colors"
                          disabled={Number.isFinite(Number(item.stock)) && item.quantity >= Number(item.stock)}
                        >
                          <FiPlus size={12} />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.id, item.selectedSize, item.selectedColor, item.selectedShape, item._variantsKey)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 p-5 space-y-4 bg-gray-50/50">
            {/* Subtotal */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-500">
                <span>المجموع الفرعي</span>
                <span>{formatPrice(total)} ج.م</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>الشحن</span>
                <span>{formatPrice(shippingCost)} ج.م</span>
              </div>

              <div className="flex justify-between text-lg font-bold pt-3 border-t border-gray-200">
                <span>الإجمالي</span>
                <span className="text-gradient">{formatPrice(total + shippingCost)} ج.م</span>
              </div>
            </div>

            {/* Buttons */}
            <div className="space-y-2">
              <Link 
                to="/checkout"
                onClick={closeCart}
                className="btn-primary w-full text-center block text-sm"
              >
                إتمام الشراء ←
              </Link>
              <Link 
                to="/cart"
                onClick={closeCart}
                className="btn-secondary w-full text-center block text-sm"
              >
                عرض السلة
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CartSidebar
