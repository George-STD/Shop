import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FiGift, FiX, FiShoppingCart, FiRefreshCw, FiTrash2, FiSearch, FiPlus } from 'react-icons/fi'
import { productsAPI } from '../services/api'
import { useBuildBoxStore, useCartStore } from '../store'
import { BUSINESS_CONFIG } from '../constants/config'
import toast from 'react-hot-toast'

const BuildBoxPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const { items: boxItems, addItem, removeItem, clearBox, getTotal } = useBuildBoxStore()
  const maxItems = BUSINESS_CONFIG.BOX_MAX_ITEMS
  const minItems = BUSINESS_CONFIG.BOX_MIN_ITEMS
  const { addItem: addCartItem } = useCartStore()
  const navigate = useNavigate()

  // Fetch box-eligible products
  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', { canBeAddedToBox: 'true', search: searchTerm }],
    queryFn: () => productsAPI.getAll({ canBeAddedToBox: 'true', search: searchTerm }).then(res => res.data)
  })

  const products = productsData?.data || []

  const formatPrice = (price) => new Intl.NumberFormat('ar-EG').format(price)

  const handleFinishBox = () => {
    if (boxItems.length < minItems) {
      toast.error(`الحد الأدنى للبوكس هو ${minItems} منتجات`)
      return
    }

    const boxId = `box_${Date.now()}`
    let successCount = 0

    boxItems.forEach(item => {
      const result = addCartItem({
        _id: item.id,
        name: item.name,
        slug: item.slug,
        price: item.price,
        images: [{ url: item.image }],
        stock: item.stock,
      }, 1, {
        boxId: boxId
      })

      if (result.success) {
        successCount++
      }
    })

    if (successCount > 0) {
      toast.success(`تم إضافة البوكس (${successCount} منتجات) إلى السلة`)
      clearBox()
      navigate('/cart')
    } else {
      toast.error('حدث خطأ أثناء إضافة البوكس للسلة')
    }
  }

  const handleClearBox = () => {
    if (window.confirm('هل تريد إفراغ البوكس وحذف جميع المنتجات؟')) {
      clearBox()
      toast.success('تم إفراغ البوكس')
    }
  }

  const handleAddToBox = (product) => {
    if (boxItems.length >= maxItems) {
      toast.error(`وصلت للحد الأقصى (${maxItems} منتجات)`)
      return
    }
    if (product.stock === 0) {
      toast.error('هذا المنتج غير متوفر حالياً')
      return
    }

    const existingCount = boxItems.filter(item => item.id === product._id).length;
    if (existingCount >= product.stock) {
      toast.error(`لا يمكنك إضافة المزيد، المتوفر في المخزون ${product.stock} فقط`);
      return;
    }

    addItem({
      id: product._id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image: product.images[0]?.url,
      stock: product.stock,
    })
    toast.success('تم الإضافة للبوكس')
  }

  const progressPercent = Math.round((boxItems.length / maxItems) * 100)

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-12 px-4 text-center">
        <h1 className="text-3xl md:text-5xl font-bold mb-4 flex items-center justify-center gap-3">
          <FiGift />
          صمم بوكس هديتك
        </h1>
        <p className="text-purple-100 max-w-2xl mx-auto text-lg">
          اختر ما شئت من المنتجات (الحد الأدنى {minItems} منتجات) وسنقوم بتغليفها في بوكس هدايا أنيق ({BUSINESS_CONFIG.BOX_BASE_PRICE_EGP} ج.م)،
          <br/>
          <span className="font-bold text-white bg-purple-800/50 px-3 py-1 rounded-lg inline-block mt-2">
            واحصل على خصم {BUSINESS_CONFIG.BOX_DISCOUNT_PERCENTAGE}% على جميع المنتجات داخل البوكس!
          </span>
        </p>
      </div>

      <div className="container-custom py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Column: Products List */}
          <div className="flex-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6 sticky top-24 z-10">
              <div className="relative">
                <input
                  type="text"
                  placeholder="ابحث عن منتجات لإضافتها للبوكس..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-purple-500 transition-all"
                />
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl h-64 skeleton border border-gray-100"></div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">لا توجد منتجات</h3>
                <p className="text-gray-500">لم نعثر على منتجات تطابق بحثك يمكن إضافتها للبوكس.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {products.map(product => (
                  <div key={product._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:border-purple-200 transition-all group flex flex-col">
                    <Link to={`/product/${product.slug}`} target="_blank" className="relative h-48 overflow-hidden block">
                      <img src={product.images[0]?.url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      {product.stock === 0 && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                          <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">نفذت الكمية</span>
                        </div>
                      )}
                    </Link>
                    <div className="p-4 flex flex-col flex-1">
                      <Link to={`/product/${product.slug}`} target="_blank" className="font-bold text-gray-800 line-clamp-1 hover:text-purple-600 mb-1">
                        {product.name}
                      </Link>
                      <div className="mb-4">
                        <span className="text-gray-400 line-through text-sm">{formatPrice(product.price)} ج.م</span>
                        <p className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 font-bold text-lg">
                          {formatPrice(product.price * (1 - BUSINESS_CONFIG.BOX_DISCOUNT_PERCENTAGE / 100))} ج.م
                        </p>
                      </div>
                      
                      <button
                        onClick={() => handleAddToBox(product)}
                        disabled={product.stock === 0}
                        className="mt-auto w-full btn-outline border-purple-200 text-purple-600 hover:bg-purple-50 disabled:opacity-50 py-2 rounded-xl flex items-center justify-center gap-2"
                      >
                        <FiPlus />
                        إضافة للبوكس
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Current Box Status */}
          <div className="lg:w-96 flex-shrink-0">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 sticky top-24">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600 text-xl">
                  <FiGift />
                </div>
                <div>
                  <h2 className="font-bold text-xl text-gray-800">محتويات البوكس</h2>
                  <p className="text-sm text-gray-500">{boxItems.length} منتج داخل البوكس</p>
                </div>
              </div>

              {/* Progress Bar Removed */}

              {/* Visual Box Representation */}
              <div className="mb-6 bg-purple-50/50 rounded-2xl p-4 flex flex-col items-center justify-center border border-purple-100/50 overflow-hidden relative">
                <p className="text-xs font-bold text-purple-600 mb-4 bg-purple-100 px-3 py-1 rounded-full">معاينة البوكس</p>
                <div 
                  className="relative transition-all duration-700 ease-in-out flex items-center justify-center"
                  style={{
                    width: boxItems.length === 0 ? '160px' : boxItems.length <= 2 ? '200px' : boxItems.length <= 4 ? '240px' : boxItems.length <= 7 ? '280px' : '320px',
                    height: boxItems.length === 0 ? '160px' : boxItems.length <= 2 ? '200px' : boxItems.length <= 4 ? '240px' : boxItems.length <= 7 ? '280px' : '320px',
                  }}
                >
                  {/* Empty Box Image */}
                  <img 
                    src="/images/empty_box.png" 
                    alt="Empty Box" 
                    className="absolute inset-0 w-full h-full object-contain mix-blend-multiply opacity-90 drop-shadow-xl"
                  />
                  
                  {/* Items inside the box */}
                  <div className="absolute inset-0 flex flex-wrap items-center justify-center content-center gap-1 p-6" style={{ zIndex: 10 }}>
                    {boxItems.map((item, idx) => (
                      <div 
                        key={idx} 
                        className="transition-all duration-500 animate-fadeInUp hover:scale-110 cursor-pointer relative group drop-shadow-lg"
                        style={{
                          width: boxItems.length <= 2 ? '40%' : boxItems.length <= 4 ? '35%' : boxItems.length <= 7 ? '28%' : '20%',
                          aspectRatio: '1/1'
                        }}
                      >
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-full h-full object-cover rounded-lg border-2 border-white/50 bg-white"
                        />
                        <button 
                          onClick={(e) => { e.stopPropagation(); removeItem(idx); }} 
                          className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                        >
                          <FiX size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Box Items List */}
              <div className="space-y-3 mb-6 max-h-[25vh] overflow-y-auto pr-2 custom-scrollbar">
                {boxItems.length === 0 ? (
                  <div className="text-center py-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <p className="text-gray-400 font-medium">البوكس فارغ حالياً</p>
                    <p className="text-xs text-gray-400 mt-1">ابدأ بإضافة المنتجات من القائمة</p>
                  </div>
                ) : (
                  boxItems.map((item, index) => (
                    <div key={index} className="flex gap-3 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm relative group">
                      <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-xl" />
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <p className="font-medium text-sm text-gray-800 line-clamp-1">{item.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-bold text-sm text-purple-600">
                            {formatPrice(item.price * (1 - BUSINESS_CONFIG.BOX_DISCOUNT_PERCENTAGE / 100))} ج.م
                          </span>
                          <span className="text-xs text-gray-400 line-through">
                            {formatPrice(item.price)} ج.م
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={() => removeItem(index)} 
                        className="absolute top-2 left-2 p-1.5 bg-red-50 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        title="حذف من البوكس"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Total & Actions */}
              <div className="border-t border-gray-100 pt-6">
                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>المنتجات (بعد الخصم)</span>
                    <span className="font-bold text-gray-800">
                      {formatPrice(getTotal() > 0 ? getTotal() - BUSINESS_CONFIG.BOX_BASE_PRICE_EGP : 0)} ج.م
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>تغليف البوكس</span>
                    <span className="font-bold text-gray-800">{BUSINESS_CONFIG.BOX_BASE_PRICE_EGP} ج.م</span>
                  </div>
                </div>
                <div className="flex justify-between items-center font-bold text-lg mb-6 border-t border-gray-50 pt-4">
                  <span className="text-gray-800">إجمالي البوكس</span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 text-xl">
                    {formatPrice(getTotal())} ج.م
                  </span>
                </div>

                {boxItems.length < minItems ? (
                  <div className="text-center p-3 bg-amber-50 text-amber-700 rounded-xl text-sm font-medium mb-4">
                    أضف {minItems - boxItems.length} منتج على الأقل لإكمال البوكس
                  </div>
                ) : (
                  <button 
                    onClick={handleFinishBox} 
                    className="w-full btn-primary py-3 flex justify-center items-center gap-2 mb-3 shadow-lg shadow-purple-500/25"
                  >
                    <FiShoppingCart />
                    إنهاء وإضافة للسلة
                  </button>
                )}
                
                {boxItems.length > 0 && (
                  <button 
                    onClick={handleClearBox} 
                    className="w-full py-2 text-gray-500 hover:text-red-500 flex items-center justify-center gap-2 transition-colors text-sm font-medium"
                  >
                    <FiRefreshCw size={14} />
                    إفراغ البوكس
                  </button>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default BuildBoxPage
