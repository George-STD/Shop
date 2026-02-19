import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Thumbs, Navigation, Zoom } from 'swiper/modules'
import { FiHeart, FiShare2, FiMinus, FiPlus, FiCheck, FiTruck, FiRotateCcw, FiShield } from 'react-icons/fi'
import { productsAPI, reviewsAPI } from '../services/api'
import { useCartStore, useWishlistStore } from '../store'
import ProductCard from '../components/product/ProductCard'
import toast from 'react-hot-toast'
import 'swiper/css'
import 'swiper/css/thumbs'
import 'swiper/css/navigation'
import 'swiper/css/zoom'

const ProductPage = () => {
  const { slug } = useParams()
  const [thumbsSwiper, setThumbsSwiper] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [selectedSize, setSelectedSize] = useState(null)
  const [selectedColor, setSelectedColor] = useState(null)
  const [selectedAddons, setSelectedAddons] = useState([])
  const [giftWrap, setGiftWrap] = useState(false)
  const [activeTab, setActiveTab] = useState('description')

  const { addItem } = useCartStore()
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlistStore()

  // Fetch product
  const { data: product, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => productsAPI.getBySlug(slug).then(res => res.data.data)
  })

  // Fetch related products
  const { data: relatedProducts } = useQuery({
    queryKey: ['products', 'related', product?._id],
    queryFn: () => productsAPI.getRelated(product._id).then(res => res.data.data),
    enabled: !!product?._id
  })

  // Fetch reviews
  const { data: reviewsData } = useQuery({
    queryKey: ['reviews', product?._id],
    queryFn: () => reviewsAPI.getByProduct(product._id).then(res => res.data),
    enabled: !!product?._id
  })

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

    addItem(product, quantity, {
      selectedSize,
      selectedColor,
      addons: selectedAddons,
      giftWrap: { enabled: giftWrap }
    })
    toast.success('تمت الإضافة إلى السلة')
  }

  const handleToggleWishlist = () => {
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
    if (giftWrap) total += 25
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
      <Helmet>
        <title>{product.seo?.metaTitle || `${product.name} | For You`}</title>
        <meta name="description" content={product.seo?.metaDescription || product.description} />
        <meta name="keywords" content={product.seo?.keywords?.join(', ') || product.tags?.join(', ')} />
        <link rel="canonical" href={`https://hadaya.com/product/${product.slug}`} />
        
        {/* Open Graph */}
        <meta property="og:title" content={product.name} />
        <meta property="og:description" content={product.description} />
        <meta property="og:image" content={product.images?.[0]?.url} />
        <meta property="og:type" content="product" />
        <meta property="product:price:amount" content={product.price} />
        <meta property="product:price:currency" content="EGP" />
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            "name": product.name,
            "description": product.description,
            "image": product.images?.map(img => img.url),
            "sku": product.sku,
            "brand": { "@type": "Brand", "name": "هدايا" },
            "offers": {
              "@type": "Offer",
              "price": product.price,
              "priceCurrency": "EGP",
              "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
            },
            "aggregateRating": product.rating?.count > 0 ? {
              "@type": "AggregateRating",
              "ratingValue": product.rating.average,
              "reviewCount": product.rating.count
            } : undefined
          })}
        </script>
      </Helmet>

      <div className="bg-gray-50 min-h-screen">
        {/* Breadcrumb */}
        <div className="bg-white border-b">
          <div className="container-custom py-4">
            <nav className="flex items-center gap-2 text-sm">
              <Link to="/" className="text-gray-500 hover:text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">الرئيسية</Link>
              <span className="text-gray-400">/</span>
              <Link to="/products" className="text-gray-500 hover:text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">المنتجات</Link>
              {product.category && (
                <>
                  <span className="text-gray-400">/</span>
                  <Link 
                    to={`/products/${product.category.slug}`} 
                    className="text-gray-500 hover:text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600"
                  >
                    {product.category.name}
                  </Link>
                </>
              )}
              <span className="text-gray-400">/</span>
              <span className="text-gray-800 line-clamp-1">{product.name}</span>
            </nav>
          </div>
        </div>

        {/* Product Details */}
        <div className="container-custom py-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Images */}
            <div className="space-y-4">
              <Swiper
                modules={[Thumbs, Navigation, Zoom]}
                thumbs={{ swiper: thumbsSwiper }}
                navigation
                zoom
                className="rounded-2xl overflow-hidden bg-white aspect-square"
              >
                {product.images?.map((image, index) => (
                  <SwiperSlide key={index}>
                    <div className="swiper-zoom-container">
                      <img 
                        src={image.url} 
                        alt={image.alt || product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>

              {product.images?.length > 1 && (
                <Swiper
                  modules={[Thumbs]}
                  onSwiper={setThumbsSwiper}
                  slidesPerView={4}
                  spaceBetween={12}
                  watchSlidesProgress
                  className="thumbs-swiper"
                >
                  {product.images.map((image, index) => (
                    <SwiperSlide key={index} className="cursor-pointer">
                      <div className="rounded-lg overflow-hidden aspect-square border-2 border-transparent hover:border-purple-500 transition-colors">
                        <img 
                          src={image.url} 
                          alt={image.alt}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              )}
            </div>

            {/* Info */}
            <div className="space-y-6">
              {/* Category & Badges */}
              <div className="flex items-center gap-3">
                {product.category && (
                  <Link 
                    to={`/products/${product.category.slug}`}
                    className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 hover:underline"
                  >
                    {product.category.name}
                  </Link>
                )}
                {product.isNew && <span className="badge badge-new">جديد</span>}
                {product.isBestseller && <span className="badge badge-bestseller">الأكثر مبيعاً</span>}
              </div>

              {/* Name */}
              <h1 className="text-3xl font-bold text-gray-800">{product.name}</h1>

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
              <div className="flex items-center gap-4">
                <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                  {product.price} ج.م
                </span>
                {product.oldPrice && (
                  <>
                    <span className="text-xl text-gray-400 line-through">
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
                            ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-pink-50 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600'
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

              {/* Gift Wrap */}
              <label className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-colors ${
                giftWrap ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-pink-50' : 'border-gray-300'
              }`}>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={giftWrap}
                    onChange={(e) => setGiftWrap(e.target.checked)}
                    className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600"
                  />
                  <div>
                    <span className="font-medium">🎁 تغليف هدايا</span>
                    <p className="text-sm text-gray-500">تغليف أنيق مع بطاقة معايدة</p>
                  </div>
                </div>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 font-medium">+25 ج.م</span>
              </label>

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
                  <FiTruck className="mx-auto text-2xl text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-2" />
                  <span className="text-sm text-gray-600">توصيل سريع</span>
                </div>
                <div className="text-center">
                  <FiRotateCcw className="mx-auto text-2xl text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-2" />
                  <span className="text-sm text-gray-600">إرجاع خلال 14 يوم</span>
                </div>
                <div className="text-center">
                  <FiShield className="mx-auto text-2xl text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-2" />
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
                            className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600 hover:bg-gradient-to-r from-purple-100 to-pink-100 hover:text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600"
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
                  {reviewsData?.data?.length > 0 ? (
                    <div className="space-y-6">
                      {reviewsData.data.map((review) => (
                        <div key={review._id} className="bg-white p-6 rounded-xl">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{review.user?.firstName}</span>
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
