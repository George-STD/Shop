import { useState, useRef, useCallback } from 'react'
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { FiHeart, FiShare2, FiMinus, FiPlus, FiCheck, FiTruck, FiRotateCcw, FiShield, FiZoomIn } from 'react-icons/fi'
import { productsAPI, reviewsAPI } from '../services/api'
import { useCartStore, useWishlistStore, useAuthStore } from '../store'
import ProductCard from '../components/product/ProductCard'
import toast from 'react-hot-toast'

// تم فصل مكون إضافة التقييم ليكون مكوناً مستقلاً ونظيفاً
const ReviewForm = ({ productId, refreshReviews }) => {
  const { isAuthenticated } = useAuthStore();
  const [form, setForm] = useState({
    rating: 0,
    title: '',
    comment: '',
    guestName: '',
    guestEmail: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRating = (r) => {
    setForm({ ...form, rating: r });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.rating === 0) return setError('الرجاء اختيار التقييم');
    if (!isAuthenticated && (!form.guestName || !form.guestEmail)) return setError('الرجاء إدخال الاسم والبريد الإلكتروني');
    
    setLoading(true);
    try {
      await reviewsAPI.create({
        product: productId,
        rating: form.rating,
        title: form.title,
        comment: form.comment,
        guestName: isAuthenticated ? undefined : form.guestName,
        guestEmail: isAuthenticated ? undefined : form.guestEmail
      });
      setSuccess(true);
      setForm({ rating: 0, title: '', comment: '', guestName: '', guestEmail: '' });
      refreshReviews();
    } catch (err) {
      const errorData = err.response?.data;
      if (errorData?.errors?.length > 0) {
        setError(errorData.errors[0].msg);
      } else if (errorData?.message) {
        setError(errorData.message);
      } else {
        setError('حدث خطأ أثناء إرسال التقييم');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-green-50 text-green-700 p-4 rounded-xl mb-6 text-center shadow-sm">
        تم إرسال تقييمك بنجاح!
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border mb-8 max-w-2xl mx-auto">
      <h3 className="font-bold text-lg mb-4 text-gray-800">أضف تقييمك</h3>
      <div className="flex items-center gap-2 mb-4">
        <span className="font-medium text-gray-700">التقييم:</span>
        <div className="flex">
          {[1, 2, 3, 4, 5].map((r) => (
            <button 
              type="button" 
              key={r} 
              onClick={() => handleRating(r)} 
              className={`text-2xl transition-colors ${r <= form.rating ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-200'}`}
            >
              ★
            </button>
          ))}
        </div>
      </div>
      <input
        type="text"
        name="title"
        placeholder="عنوان التقييم (اختياري)"
        value={form.title}
        onChange={handleChange}
        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 mb-3 bg-gray-50"
      />
      <textarea
        name="comment"
        placeholder="اكتب تعليقك هنا"
        value={form.comment}
        onChange={handleChange}
        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 mb-3 bg-gray-50 min-h-[100px]"
        required
      />
      {!isAuthenticated && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <input
            type="text"
            name="guestName"
            placeholder="اسمك"
            value={form.guestName}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50"
            required
          />
          <input
            type="email"
            name="guestEmail"
            placeholder="بريدك الإلكتروني"
            value={form.guestEmail}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50"
            required
          />
        </div>
      )}
      {error && <div className="text-red-500 text-sm mb-3 font-medium">{error}</div>}
      <button 
        type="submit" 
        className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50" 
        disabled={loading}
      >
        {loading ? 'جاري الإرسال...' : 'إرسال التقييم'}
      </button>
    </form>
  );
};

const ProductPage = () => {
  const { slug } = useParams()
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const [quantity, setQuantity] = useState(1)
  const [isZooming, setIsZooming] = useState(false)
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 })
  const [activeImageIdx, setActiveImageIdx] = useState(0)
  const [activeBoxImage, setActiveBoxImage] = useState(null)
  const imgContainerRef = useRef(null)
  const [selectedSize, setSelectedSize] = useState(null)
  const [selectedColor, setSelectedColor] = useState(null)
  const [selectedAddons, setSelectedAddons] = useState([])
  const [boxSelections, setBoxSelections] = useState({})
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') === 'reviews' ? 'reviews' : 'description')

  const { addItem } = useCartStore()
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlistStore()
  const { isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  // Fetch product
  const { data: product, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => productsAPI.getBySlug(slug).then(res => res.data.data)
  });

  // Fetch related products
  const { data: relatedProducts } = useQuery({
    queryKey: ['products', 'related', product?._id],
    queryFn: () => productsAPI.getRelated(product._id).then(res => res.data.data),
    enabled: !!product?._id
  });

  // Fetch reviews
  const { data: reviewsData } = useQuery({
    queryKey: ['reviews', product?._id],
    queryFn: () => reviewsAPI.getByProduct(product._id).then(res => res.data),
    enabled: !!product?._id
  });

  const inWishlist = product ? isInWishlist(product._id) : false

  const handleAddToCart = () => {
    if (product.sizes?.length > 0 && !selectedSize) {
      toast.error('الرجاء اختيار المقاس')
      return
    }
    if (product.colors?.length > 0 && !selectedColor) {
      toast.error('الرجاء اختيار اللون')
      return
    }

    // Validate box selections
    if (product.isCustomBox && product.boxSlots?.length > 0) {
      for (const slot of product.boxSlots) {
        if (slot.required && !boxSelections[slot.slotLabel]) {
          toast.error(`الرجاء اختيار: ${slot.slotLabel}`)
          return
        }
      }
    }

    addItem(product, quantity, {
      selectedSize,
      selectedColor,
      addons: selectedAddons,
      boxSelections: product.isCustomBox ? Object.entries(boxSelections).filter(([, opt]) => opt).map(([slotLabel, opt]) => ({
        slotLabel,
        chosenOption: opt.name,
        image: opt.image
      })) : undefined
    })
    toast.success('تمت الإضافة إلى السلة')
  }

  const handleToggleWishlist = () => {
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

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: product.name,
        text: product.description,
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('تم نسخ الرابط')
    }
  }

  const toggleAddon = (addon) => {
    const exists = selectedAddons.find(a => a.name === addon.name)
    if (exists) {
      setSelectedAddons(selectedAddons.filter(a => a.name !== addon.name))
    } else {
      setSelectedAddons([...selectedAddons, addon])
    }
  }

  const calculateTotal = () => {
    if (!product) return 0
    let total = product.price * quantity
    selectedAddons.forEach(addon => total += addon.price)
    return total
  }

  if (isLoading) {
    return (
      <div className="container-custom py-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="skeleton h-96 rounded-2xl"></div>
          <div className="space-y-4">
            <div className="skeleton h-8 w-3/4"></div>
            <div className="skeleton h-4 w-1/4"></div>
            <div className="skeleton h-24"></div>
            <div className="skeleton h-12 w-1/3"></div>
            <div className="skeleton h-14"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container-custom py-16 text-center">
        <div className="text-6xl mb-4">😔</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-4">المنتج غير موجود</h1>
        <Link to="/products" className="btn-primary">
          تصفح المنتجات
        </Link>
      </div>
    )
  }

  const discount = product.oldPrice 
    ? Math.round((1 - product.price / product.oldPrice) * 100) 
    : 0

  return (
    <>

      <div className="bg-gray-50 min-h-screen">
        {/* Breadcrumb */}
        <div className="bg-white border-b">
          <div className="container-custom py-4">
            <nav className="flex items-center gap-2 text-sm overflow-x-auto whitespace-nowrap scrollbar-hide">
              <Link to="/" className="text-gray-500 hover:text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 flex-shrink-0">الرئيسية</Link>
              <span className="text-gray-400 flex-shrink-0">/</span>
              <Link to="/products" className="text-gray-500 hover:text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 flex-shrink-0">المنتجات</Link>
              {product.category && (
                <>
                  <span className="text-gray-400 flex-shrink-0">/</span>
                  <Link 
                    to={`/products?category=${product.category.slug}`} 
                    className="text-gray-500 hover:text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 flex-shrink-0"
                  >
                    {product.category.name}
                  </Link>
                </>
              )}
              <span className="text-gray-400 flex-shrink-0">/</span>
              <span className="text-gray-800 truncate max-w-[150px] sm:max-w-none">{product.name}</span>
            </nav>
          </div>
        </div>

        {/* Product Details */}
        <div className="container-custom py-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Images */}
            <div className="space-y-4">
              {/* Main Image with Amazon-style zoom */}
              <div className="relative">
                <div
                  ref={imgContainerRef}
                  className="relative rounded-2xl overflow-hidden bg-white aspect-square cursor-crosshair group"
                  onMouseEnter={() => setIsZooming(true)}
                  onMouseLeave={() => setIsZooming(false)}
                  onMouseMove={(e) => {
                    const rect = imgContainerRef.current?.getBoundingClientRect()
                    if (!rect) return
                    const x = ((e.clientX - rect.left) / rect.width) * 100
                    const y = ((e.clientY - rect.top) / rect.height) * 100
                    setZoomPos({ x, y })
                  }}
                >
                  <img
                    src={activeBoxImage || product.images?.[activeImageIdx]?.url}
                    alt={activeBoxImage ? 'اختيار البوكس' : (product.images?.[activeImageIdx]?.alt || product.name)}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                  {/* Zoom lens indicator */}
                  {isZooming && (
                    <div
                      className="absolute pointer-events-none border-2 border-purple-400/50 bg-purple-200/20 rounded-sm"
                      style={{
                        width: '120px',
                        height: '120px',
                        left: `calc(${zoomPos.x}% - 60px)`,
                        top: `calc(${zoomPos.y}% - 60px)`,
                      }}
                    />
                  )}
                  <div className="absolute bottom-3 left-3 bg-white/80 backdrop-blur-sm rounded-full px-3 py-1 text-xs text-gray-600 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity lg:flex hidden">
                    <FiZoomIn className="w-3 h-3" />
                    مرر الماوس للتكبير
                  </div>
                </div>
                {/* Zoomed overlay — outside overflow-hidden so it's not clipped */}
                {isZooming && (
                  <div
                    className="hidden lg:block absolute top-0 left-[calc(100%+16px)] w-[500px] h-[500px] bg-white border-2 border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden"
                  >
                    <img
                      src={activeBoxImage || product.images?.[activeImageIdx]?.url}
                      alt="zoom"
                      className="absolute max-w-none"
                      style={{
                        width: '250%',
                        height: '250%',
                        left: `${-zoomPos.x * 2.5 + 125}%`,
                        top: `${-zoomPos.y * 2.5 + 125}%`,
                      }}
                      draggable={false}
                    />
                  </div>
                )}
              </div>

              {/* Product image thumbnails */}
              {product.images?.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => { setActiveImageIdx(index); setActiveBoxImage(null) }}
                      onMouseEnter={() => { setActiveImageIdx(index); setActiveBoxImage(null) }}
                      className={`flex-shrink-0 rounded-lg overflow-hidden aspect-square w-16 sm:w-20 border-2 transition-all ${
                        !activeBoxImage && activeImageIdx === index
                          ? 'border-purple-500 shadow-md scale-105'
                          : 'border-transparent hover:border-purple-300'
                      }`}
                    >
                      <img 
                        src={image.url} 
                        alt={image.alt}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Box selection thumbnails */}
              {product.isCustomBox && Object.entries(boxSelections).some(([, opt]) => opt?.image) && (
                <div>
                  <p className="text-sm text-gray-600 mb-2 font-medium">🎁 اختياراتك:</p>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {Object.entries(boxSelections).filter(([, opt]) => opt?.image).map(([label, opt]) => (
                      <button
                        key={label}
                        onClick={() => setActiveBoxImage(opt.image)}
                        onMouseEnter={() => setActiveBoxImage(opt.image)}
                        className={`flex-shrink-0 rounded-lg overflow-hidden w-16 sm:w-20 border-2 transition-all ${
                          activeBoxImage === opt.image
                            ? 'border-purple-500 shadow-md scale-105'
                            : 'border-transparent hover:border-purple-300'
                        }`}
                      >
                        <div className="aspect-square">
                          <img src={opt.image} alt={opt.name} className="w-full h-full object-cover" />
                        </div>
                        <p className="text-[10px] text-center truncate px-1 py-0.5 text-gray-600">{opt.name}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="space-y-6">
              {/* Category & Badges */}
              <div className="flex items-center gap-3">
                {product.category && (
                  <Link 
                    to={`/products?category=${product.category.slug}`}
                    className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 hover:underline"
                  >
                    {product.category.name}
                  </Link>
                )}
                {product.isNew && <span className="badge badge-new">جديد</span>}
                {product.isBestseller && <span className="badge badge-bestseller">الأكثر مبيعاً</span>}
              </div>

              {/* Name */}
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">{product.name}</h1>

              {/* Rating */}
              {product.rating?.count > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex text-yellow-400 text-lg rating-stars">
                    {[...Array(5)].map((_, i) => (
                      <span key={i}>
                        {i < Math.round(product.rating.average) ? '★' : '☆'}
                      </span>
                    ))}
                  </div>
                  <span className="text-gray-600">
                    {product.rating.average} ({product.rating.count} تقييم)
                  </span>
                </div>
              )}

              {/* Price */}
              <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                <span className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                  {product.price} ج.م
                </span>
                {product.oldPrice && (
                  <>
                    <span className="text-base sm:text-xl text-gray-400 line-through">
                      {product.oldPrice} ج.م
                    </span>
                    <span className="badge badge-sale">وفر {discount}%</span>
                  </>
                )}
              </div>

              {/* Description */}
              <p className="text-gray-600 leading-relaxed">{product.description}</p>

              {/* Sizes */}
              {product.sizes?.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-800 mb-3">المقاس:</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                          selectedSize === size
                            ? 'border-purple-500 bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 text-transparent'
                            : 'border-gray-300 hover:border-purple-500'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Colors */}
              {product.colors?.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-800 mb-3">
                    اللون: {selectedColor && <span className="text-gray-500">{selectedColor}</span>}
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {product.colors.map((color) => (
                      <button
                        key={color.name}
                        onClick={() => setSelectedColor(color.name)}
                        className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${
                          selectedColor === color.name
                            ? 'border-gray-800 scale-110'
                            : 'border-gray-300 hover:scale-105'
                        }`}
                        style={{ backgroundColor: color.code }}
                        title={color.name}
                      >
                        {selectedColor === color.name && (
                          <FiCheck className={`${color.code === '#ffffff' || color.code === '#fff' ? 'text-gray-800' : 'text-white'}`} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Addons */}
              {product.addons?.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-800 mb-3">إضافات:</h3>
                  <div className="space-y-2">
                    {product.addons.map((addon) => (
                      <label
                        key={addon.name}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedAddons.find(a => a.name === addon.name)
                            ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-pink-50'
                            : 'border-gray-300 hover:border-purple-500'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={!!selectedAddons.find(a => a.name === addon.name)}
                            onChange={() => toggleAddon(addon)}
                            className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600"
                          />
                          <span>{addon.name}</span>
                        </div>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 font-medium">+{addon.price} ج.م</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Box Builder */}
              {product.isCustomBox && product.boxSlots?.length > 0 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-gray-800">🎁 شكّل البوكس بتاعك</h3>
                  {product.boxSlots.map((slot) => (
                    <div key={slot.slotLabel} className="space-y-3">
                      <h4 className="font-medium text-gray-800">
                        {slot.slotLabel}
                        {slot.required && <span className="text-red-500 mr-1">*</span>}
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {slot.options.map((opt) => {
                          const isSelected = boxSelections[slot.slotLabel]?.name === opt.name
                          return (
                            <button
                              key={opt.name}
                              type="button"
                              onClick={() => setBoxSelections(prev => ({
                                ...prev,
                                [slot.slotLabel]: isSelected ? undefined : opt
                              }))}
                              className={`relative rounded-xl border-2 overflow-hidden transition-all ${
                                isSelected
                                  ? 'border-purple-500 ring-2 ring-purple-200 scale-[1.02]'
                                  : 'border-gray-200 hover:border-purple-300'
                              }`}
                            >
                              {opt.image && (
                                <div className="aspect-square">
                                  <img src={opt.image} alt={opt.name} className="w-full h-full object-cover" />
                                </div>
                              )}
                              <div className="p-2 text-center">
                                <p className="text-sm font-medium text-gray-800">{opt.name}</p>
                              </div>
                              {isSelected && (
                                <div className="absolute top-2 left-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                                  <FiCheck className="text-white text-sm" />
                                </div>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Quantity & Add to Cart */}
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Quantity */}
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-3 hover:bg-gray-100"
                  >
                    <FiMinus />
                  </button>
                  <span className="px-4 font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-3 hover:bg-gray-100"
                  >
                    <FiPlus />
                  </button>
                </div>

                {/* Add to Cart */}
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {product.stock === 0 ? 'نفذت الكمية' : `أضف للسلة - ${calculateTotal()} ج.م`}
                </button>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-4 pt-4 border-t">
                <button
                  onClick={handleToggleWishlist}
                  className={`flex items-center gap-2 ${inWishlist ? 'text-red-500' : 'text-gray-600'} hover:text-red-500`}
                >
                  <FiHeart className={inWishlist ? 'fill-current' : ''} />
                  {inWishlist ? 'في قائمة الأمنيات' : 'أضف للأمنيات'}
                </button>
                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 text-gray-600 hover:text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600"
                >
                  <FiShare2 />
                  مشاركة
                </button>
              </div>

              {/* Features */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t">
                <div className="text-center">
                  <FiTruck className="mx-auto text-2xl text-purple-600 mb-2" />
                  <span className="text-sm text-gray-600">توصيل سريع</span>
                </div>
                <div className="text-center">
                  <FiRotateCcw className="mx-auto text-2xl text-purple-600 mb-2" />
                  <span className="text-sm text-gray-600">إرجاع خلال 14 يوم</span>
                </div>
                <div className="text-center">
                  <FiShield className="mx-auto text-2xl text-purple-600 mb-2" />
                  <span className="text-sm text-gray-600">دفع آمن</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-12">
            <div className="flex border-b">
              {['description', 'reviews'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 font-medium transition-colors ${
                    activeTab === tab
                      ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 border-b-2 border-purple-500'
                      : 'text-gray-600 hover:text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600'
                  }`}
                >
                  {tab === 'description' ? 'الوصف' : `التقييمات (${reviewsData?.pagination?.total || 0})`}
                </button>
              ))}
            </div>

            <div className="py-8">
              {activeTab === 'description' ? (
                <div className="prose prose-lg max-w-none">
                  <p className="text-gray-600 leading-relaxed">{product.description}</p>
                  
                  {product.tags?.length > 0 && (
                    <div className="mt-6">
                      <h3 className="font-bold text-gray-800 mb-3">الكلمات المفتاحية:</h3>
                      <div className="flex flex-wrap gap-2">
                        {product.tags.map((tag) => (
                          <Link
                            key={tag}
                            to={`/products?search=${tag}`}
                            className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600 bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-100 hover:to-pink-100 hover:text-transparent"
                          >
                            {tag}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  {/* Review Form Component */}
                  <ReviewForm 
                    productId={product._id} 
                    refreshReviews={() => queryClient.invalidateQueries(['reviews', product._id])} 
                  />

                  {reviewsData?.data?.length > 0 ? (
                    <div className="space-y-6">
                      {reviewsData.data.map((review) => (
                        <div key={review._id} className="bg-white p-6 rounded-xl border">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{review.user?.firstName || review.guestName}</span>
                                {review.isVerifiedPurchase && (
                                  <span className="text-green-600 text-sm flex items-center gap-1">
                                    <FiCheck size={14} />
                                    مشتري معتمد
                                  </span>
                                )}
                              </div>
                              <div className="flex text-yellow-400 text-sm mt-1 rating-stars">
                                {[...Array(5)].map((_, i) => (
                                  <span key={i}>{i < review.rating ? '★' : '☆'}</span>
                                ))}
                              </div>
                            </div>
                            <span className="text-sm text-gray-500">
                              {new Date(review.createdAt).toLocaleDateString('ar-EG')}
                            </span>
                          </div>
                          {review.title && (
                            <h4 className="font-medium text-gray-800 mt-3">{review.title}</h4>
                          )}
                          <p className="text-gray-600 mt-2">{review.comment}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-5xl mb-4">⭐</div>
                      <h3 className="text-lg font-medium text-gray-800 mb-2">
                        لا توجد تقييمات بعد
                      </h3>
                      <p className="text-gray-600">
                        كن أول من يقيم هذا المنتج
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts?.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">منتجات ذات صلة</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {relatedProducts.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default ProductPage