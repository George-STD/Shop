import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { FiTrash2, FiPlus, FiMinus, FiShoppingBag } from 'react-icons/fi'
import { useCartStore } from '../store'

const CartPage = () => {
  const { items, removeItem, updateQuantity, getTotal, clearCart } = useCartStore()
  
  const subtotal = getTotal()
  const shippingCost = subtotal >= 500 ? 0 : 30
  const total = subtotal + shippingCost

  if (items.length === 0) {
    return (
      <>
        <Helmet>
          <title>سلة التسوق | For You</title>
        </Helmet>
        <div className="container-custom py-16 text-center">
          <div className="text-8xl mb-6">🛒</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">السلة فارغة</h1>
          <p className="text-gray-600 mb-8">لم تضف أي منتجات بعد</p>
          <Link to="/products" className="btn-primary">
            <FiShoppingBag className="inline ml-2" />
            تسوق الآن
          </Link>
        </div>
      </>
    )
  }

  return (
    <>
      <Helmet>
        <title>سلة التسوق ({items.length}) | For You</title>
      </Helmet>

      <div className="bg-gray-50 min-h-screen py-8">
        <div className="container-custom">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">سلة التسوق</h1>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item, index) => (
                <div key={`${item.id}-${index}`} className="bg-white rounded-2xl p-6 flex gap-6">
                  <Link to={`/product/${item.slug}`} className="w-24 h-24 flex-shrink-0">
                    <img 
                      src={item.image || '/images/placeholder.jpg'} 
                      alt={item.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </Link>
                  
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <div>
                        <Link 
                          to={`/product/${item.slug}`}
                          className="font-medium text-gray-800 hover:text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600"
                        >
                          {item.name}
                        </Link>
                        {(item.selectedSize || item.selectedColor) && (
                          <p className="text-sm text-gray-500 mt-1">
                            {item.selectedSize && `المقاس: ${item.selectedSize}`}
                            {item.selectedSize && item.selectedColor && ' | '}
                            {item.selectedColor && `اللون: ${item.selectedColor}`}
                          </p>
                        )}
                        {item.giftWrap?.enabled && (
                          <p className="text-sm text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mt-1">🎁 تغليف هدايا</p>
                        )}
                      </div>
                      <button 
                        onClick={() => removeItem(item.id, item.selectedSize, item.selectedColor)}
                        className="text-red-500 hover:bg-red-50 p-2 rounded-lg"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center border border-gray-300 rounded-lg">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1, item.selectedSize, item.selectedColor)}
                          className="p-2 hover:bg-gray-100"
                          disabled={item.quantity <= 1}
                        >
                          <FiMinus size={16} />
                        </button>
                        <span className="px-4 font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1, item.selectedSize, item.selectedColor)}
                          className="p-2 hover:bg-gray-100"
                        >
                          <FiPlus size={16} />
                        </button>
                      </div>
                      
                      <div className="text-left">
                        <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                          {item.price * item.quantity} ج.م
                        </span>
                        {item.oldPrice && (
                          <span className="text-sm text-gray-400 line-through mr-2">
                            {item.oldPrice * item.quantity} ج.م
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <button 
                onClick={clearCart}
                className="text-red-500 hover:underline"
              >
                إفراغ السلة
              </button>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl p-6 sticky top-24">
                <h2 className="text-xl font-bold text-gray-800 mb-6">ملخص الطلب</h2>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">المجموع الفرعي</span>
                    <span>{subtotal} ج.م</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">الشحن</span>
                    <span className={shippingCost === 0 ? 'text-green-600' : ''}>
                      {shippingCost === 0 ? 'مجاني' : `${shippingCost} ج.م`}
                    </span>
                  </div>
                  {subtotal < 500 && (
                    <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                      💡 أضف {500 - subtotal} ج.م للحصول على شحن مجاني
                    </p>
                  )}
                  <div className="border-t pt-4 flex justify-between text-lg font-bold">
                    <span>الإجمالي</span>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">{total} ج.م</span>
                  </div>
                </div>

                <Link 
                  to="/checkout" 
                  className="btn-primary w-full text-center block mb-4"
                >
                  إتمام الشراء
                </Link>
                
                <Link 
                  to="/products" 
                  className="btn-outline w-full text-center block"
                >
                  متابعة التسوق
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default CartPage
