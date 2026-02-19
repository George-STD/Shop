import { Link } from 'react-router-dom'
import { FiX, FiTrash2, FiPlus, FiMinus } from 'react-icons/fi'
import { useUIStore, useCartStore } from '../../store'

const CartSidebar = () => {
  const { closeCart } = useUIStore()
  const { items, removeItem, updateQuantity, getTotal } = useCartStore()
  
  const total = getTotal()
  const shippingCost = total >= 500 ? 0 : 30

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={closeCart}
      />
      
      {/* Cart Panel */}
      <div className="absolute top-0 left-0 h-full w-96 max-w-full bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">??? ??????</h2>
          <button 
            onClick={closeCart}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">??</div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                ????? ?????
              </h3>
              <p className="text-gray-500 mb-6">
                ?? ??? ?? ?????? ???
              </p>
              <Link 
                to="/products"
                onClick={closeCart}
                className="btn-primary inline-block"
              >
                ???? ????
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={`${item.id}-${index}`} className="flex gap-4 bg-gray-50 p-3 rounded-xl">
                  {/* Image */}
                  <Link 
                    to={`/product/${item.slug}`}
                    onClick={closeCart}
                    className="w-20 h-20 flex-shrink-0"
                  >
                    <img 
                      src={item.image || '/images/placeholder.jpg'} 
                      alt={item.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </Link>
                  
                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <Link 
                      to={`/product/${item.slug}`}
                      onClick={closeCart}
                      className="font-medium text-gray-800 hover:text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 line-clamp-2"
                    >
                      {item.name}
                    </Link>
                    
                    {/* Options */}
                    {(item.selectedSize || item.selectedColor) && (
                      <p className="text-sm text-gray-500 mt-1">
                        {item.selectedSize && `??????: ${item.selectedSize}`}
                        {item.selectedSize && item.selectedColor && ' | '}
                        {item.selectedColor && `?????: ${item.selectedColor}`}
                      </p>
                    )}
                    
                    {/* Price */}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                        {item.price} ?.?
                      </span>
                      {item.oldPrice && (
                        <span className="text-sm text-gray-400 line-through">
                          {item.oldPrice} ?.?
                        </span>
                      )}
                    </div>
                    
                    {/* Quantity & Remove */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1, item.selectedSize, item.selectedColor)}
                          className="w-7 h-7 rounded-full bg-white border border-gray-300 flex items-center justify-center hover:border-purple-500 hover:text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600"
                        >
                          <FiMinus size={14} />
                        </button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1, item.selectedSize, item.selectedColor)}
                          className="w-7 h-7 rounded-full bg-white border border-gray-300 flex items-center justify-center hover:border-purple-500 hover:text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600"
                        >
                          <FiPlus size={14} />
                        </button>
                      </div>
                      <button 
                        onClick={() => removeItem(item.id, item.selectedSize, item.selectedColor)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <FiTrash2 size={16} />
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
          <div className="border-t p-4 space-y-4">
            {/* Subtotal */}
            <div className="space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>??????? ??????</span>
                <span>{total} ?.?</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>?????</span>
                <span>
                  {shippingCost === 0 ? (
                    <span className="text-green-600">?????</span>
                  ) : (
                    `${shippingCost} ?.?`
                  )}
                </span>
              </div>
              {total < 500 && (
                <p className="text-sm text-gray-500">
                  ??? {500 - total} ?.? ?????? ??? ??? ?????
                </p>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>????????</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">{total + shippingCost} ?.?</span>
              </div>
            </div>

            {/* Buttons */}
            <div className="space-y-2">
              <Link 
                to="/checkout"
                onClick={closeCart}
                className="btn-primary w-full text-center block"
              >
                ????? ??????
              </Link>
              <Link 
                to="/cart"
                onClick={closeCart}
                className="btn-outline w-full text-center block"
              >
                ??? ?????
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CartSidebar

