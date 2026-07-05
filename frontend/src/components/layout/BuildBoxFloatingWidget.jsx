import { useState } from 'react'
import { FiGift, FiX, FiTrash2, FiShoppingCart, FiRefreshCw } from 'react-icons/fi'
import { useBuildBoxStore, useCartStore } from '../../store'
import toast from 'react-hot-toast'
import { Link, useNavigate } from 'react-router-dom'

const BuildBoxFloatingWidget = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { items, maxItems, minItems, removeItem, clearBox, getTotal } = useBuildBoxStore()
  const { addItem } = useCartStore()
  const navigate = useNavigate()

  if (items.length === 0) return null

  const formatPrice = (price) => new Intl.NumberFormat('ar-EG').format(price)

  const handleFinishBox = () => {
    if (items.length < minItems) {
      toast.error(`الحد الأدنى للبوكس هو ${minItems} منتجات`)
      return
    }

    const boxId = `box_${Date.now()}`
    let successCount = 0

    // Add all items in the box to the cart with the same boxId
    items.forEach(item => {
      const result = addItem({
        _id: item.id,
        name: item.name,
        slug: item.slug,
        price: item.price,
        images: [{ url: item.image }],
        stock: item.stock,
      }, 1, {
        selectedSize: item.selectedSize,
        selectedColor: item.selectedColor,
        selectedShape: item.selectedShape,
        selectedVariants: item.selectedVariants,
        addons: item.addons,
        boxId: boxId
      })

      if (result.success) {
        successCount++
      }
    })

    if (successCount > 0) {
      toast.success(`تم إضافة البوكس (${successCount} منتجات) إلى السلة`)
      clearBox()
      setIsOpen(false)
      navigate('/cart')
    } else {
      toast.error('حدث خطأ أثناء إضافة البوكس للسلة')
    }
  }

  const handleClearBox = () => {
    if (window.confirm('هل تريد إفراغ البوكس وحذف جميع المنتجات؟')) {
      clearBox()
      setIsOpen(false)
      toast.success('تم إفراغ البوكس')
    }
  }

  const progressPercent = Math.round((items.length / maxItems) * 100)

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 left-6 z-40 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-2xl shadow-2xl hover:scale-105 transition-transform flex items-center gap-3 group"
          aria-label="فتح البوكس الخاص بك"
        >
          <div className="relative">
            <FiGift className="text-2xl" />
            <span className="absolute -top-2 -right-2 bg-white text-purple-600 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
              {items.length}
            </span>
          </div>
          <span className="font-bold hidden sm:block">البوكس ({items.length}/{maxItems})</span>
        </button>
      )}

      {/* Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div className="absolute bottom-0 left-0 sm:top-0 sm:w-96 w-full max-h-[85vh] sm:max-h-full sm:h-full bg-white shadow-2xl flex flex-col rounded-t-3xl sm:rounded-none">
            {/* Header */}
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center">
                    <FiGift className="text-purple-600" />
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-800">البوكس الخاص بك</h2>
                    <p className="text-xs text-gray-500">{items.length} من {maxItems} منتجات</p>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                  <FiX className="text-xl" />
                </button>
              </div>
              {/* Progress Bar */}
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {items.map((item, index) => (
                <div key={index} className="flex gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-100 hover:border-purple-100 transition-colors">
                  <Link to={`/product/${item.slug || item.id}`} onClick={() => setIsOpen(false)} className="flex-shrink-0">
                    <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-xl" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/product/${item.slug || item.id}`} onClick={() => setIsOpen(false)} className="font-medium text-sm text-gray-800 line-clamp-1 hover:text-purple-600 transition-colors">
                      {item.name}
                    </Link>
                    {(item.selectedSize || item.selectedColor) && (
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {item.selectedSize && `المقاس: ${item.selectedSize}`}
                        {item.selectedSize && item.selectedColor && ' | '}
                        {item.selectedColor && `اللون: ${item.selectedColor}`}
                      </p>
                    )}
                    <p className="font-bold text-sm text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mt-1">{formatPrice(item.price)} ج.م</p>
                  </div>
                  <button onClick={() => removeItem(index)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors self-center">
                    <FiTrash2 size={14} />
                  </button>
                </div>
              ))}
              
              {items.length < maxItems && (
                <Link
                  to="/products?canBeAddedToBox=true"
                  onClick={() => setIsOpen(false)}
                  className="block w-full border-2 border-dashed border-purple-200 rounded-2xl p-4 text-center text-purple-600 hover:bg-purple-50 transition-colors"
                >
                  + أضف منتج للبوكس ({maxItems - items.length} متبقي)
                </Link>
              )}
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-gray-100 bg-gray-50/50 space-y-3">
              <div className="flex justify-between items-center font-bold text-lg">
                <span>إجمالي البوكس</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">{formatPrice(getTotal())} ج.م</span>
              </div>
              
              {items.length < minItems ? (
                <div className="space-y-2">
                  <p className="text-sm text-amber-600 text-center bg-amber-50 rounded-lg py-2 px-3">
                    أضف {minItems - items.length} منتج على الأقل لإكمال البوكس (الحد الأدنى {minItems})
                  </p>
                  <button onClick={handleClearBox} className="w-full text-sm text-gray-500 hover:text-red-500 flex items-center justify-center gap-1 py-2 transition-colors">
                    <FiRefreshCw size={12} />
                    إفراغ البوكس
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <button onClick={handleFinishBox} className="w-full btn-primary flex justify-center items-center gap-2">
                    <FiShoppingCart />
                    إنهاء وإضافة للسلة
                  </button>
                  <button onClick={handleClearBox} className="w-full text-sm text-gray-500 hover:text-red-500 flex items-center justify-center gap-1 py-2 transition-colors">
                    <FiRefreshCw size={12} />
                    إفراغ البوكس
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default BuildBoxFloatingWidget
