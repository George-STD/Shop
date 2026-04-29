import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination, Navigation } from 'swiper/modules'
import { productsAPI, categoriesAPI, occasionsAPI } from '../services/api'
import ProductCard from '../components/product/ProductCard'
import CategoryCard from '../components/home/CategoryCard'
import FeatureCard from '../components/home/FeatureCard'
import OccasionCard from '../components/home/OccasionCard'
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/navigation'

const HomePage = () => {
  // Fetch featured products
  const { data: featuredProducts, isLoading: loadingFeatured } = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => productsAPI.getFeatured(8).then(res => res.data.data)
  });

  // Fetch bestsellers
  const { data: bestsellers, isLoading: loadingBestsellers } = useQuery({
    queryKey: ['products', 'bestsellers'],
    queryFn: () => productsAPI.getBestsellers(8).then(res => res.data.data)
  });

  // Fetch new arrivals
  const { data: newArrivals, isLoading: loadingNew } = useQuery({
    queryKey: ['products', 'new'],
    queryFn: () => productsAPI.getNew(8).then(res => res.data.data)
  });

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesAPI.getAll().then(res => res.data.data)
  });

  // Fetch occasions
  const { data: occasions } = useQuery({
    queryKey: ['occasions'],
    queryFn: () => occasionsAPI.getAll().then(res => res.data.data)
  });

  const features = [
    { icon: '🚚', title: 'شحن سريع', description: 'توصيل لباب البيت' },
    { icon: '🎁', title: 'تغليف مجاني', description: 'تغليف هدايا أنيق' },
    { icon: '💳', title: 'دفع آمن', description: 'طرق دفع متعددة' },
    { icon: '↩️', title: 'إرجاع سهل', description: 'خلال 14 يوم' },
  ]

  const ProductSkeleton = () => (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
      <div className="skeleton h-52 sm:h-64 rounded-none"></div>
      <div className="p-4 space-y-3">
        <div className="skeleton h-3 w-16"></div>
        <div className="skeleton h-4 w-3/4"></div>
        <div className="skeleton h-5 w-1/3"></div>
      </div>
    </div>
  )

  return (
    <>
      {/* Hero Section */}
      <section className="hero-gradient relative">
        <Swiper
          modules={[Autoplay, Pagination, Navigation]}
          spaceBetween={0}
          slidesPerView={1}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          pagination={{ clickable: true }}
          navigation
          className="h-[350px] sm:h-[450px] md:h-[550px]"
        >
          <SwiperSlide>
            <div className="h-full flex items-center relative z-10">
              <div className="container-custom">
                <div className="max-w-2xl">
                  <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full text-sm text-purple-700 font-medium mb-6 animate-fadeInUp">
                    <span>✨</span>
                    <span>أجمل الهدايا لأحبائك</span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 mb-5 leading-tight animate-fadeInUp">
                    اجعل كل مناسبة {' '}
                    <span className="text-gradient">لحظة لا تُنسى</span>
                  </h1>
                  <p className="text-base sm:text-lg text-gray-600 mb-8 animate-fadeInUp leading-relaxed max-w-lg">
                    اكتشف تشكيلة واسعة من الهدايا المميزة لجميع المناسبات مع توصيل سريع لباب بيتك
                  </p>
                  <div className="flex flex-wrap gap-3 sm:gap-4 animate-fadeInUp">
                    <Link to="/products" className="btn-primary text-sm sm:text-base px-6 sm:px-8">
                      تسوق الآن ←
                    </Link>
                    <Link to="/gift-finder" className="btn-secondary text-sm sm:text-base px-6 sm:px-8">
                      🎯 اعثر على الهدية المثالية
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
          <SwiperSlide>
            <div className="h-full flex items-center bg-gradient-to-br from-purple-50 via-fuchsia-50 to-pink-50 relative z-10">
              <div className="container-custom">
                <div className="max-w-2xl">
                  <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 rounded-full text-sm text-white font-bold mb-6 animate-fadeInUp shadow-lg shadow-amber-500/25">
                    <span>🔥</span>
                    <span>عروض حصرية</span>
                  </div>
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 mb-5 animate-fadeInUp">
                    خصومات تصل إلى {' '}
                    <span className="text-gradient">50%</span>
                  </h2>
                  <p className="text-base sm:text-lg text-gray-600 mb-8 animate-fadeInUp leading-relaxed max-w-lg">
                    استمتع بأفضل العروض على الهدايا المميزة. عرض لفترة محدودة!
                  </p>
                  <Link to="/products?sort=discount" className="btn-gold text-sm sm:text-base px-6 sm:px-8 animate-fadeInUp">
                    تسوق العروض ←
                  </Link>
                </div>
              </div>
            </div>
          </SwiperSlide>
        </Swiper>
      </section>

      {/* Features */}
      <section className="py-6 sm:py-8 bg-white border-b border-gray-100">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* Shop by Occasion */}
      {occasions?.length > 0 && (
        <section className="py-14 sm:py-20">
          <div className="container-custom">
            <h2 className="section-title">تسوق حسب المناسبة</h2>
            <p className="section-subtitle">اختر المناسبة ونحن نوفرلك أفضل الهدايا</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {occasions?.map((occasion) => (
                <OccasionCard key={occasion._id} {...occasion} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="py-14 sm:py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container-custom">
          <div className="flex items-end justify-between mb-10">
            <div>
              <span className="inline-flex items-center gap-1.5 text-purple-600 font-medium text-sm mb-2">
                <span className="w-8 h-[2px] bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></span>
                منتجات مختارة
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">منتجات مميزة</h2>
            </div>
            <Link to="/products?featured=true" className="hidden sm:inline-flex items-center gap-1 text-purple-600 hover:text-purple-700 font-medium text-sm hover:gap-2 transition-all">
              عرض الكل
              <span>←</span>
            </Link>
          </div>
          
          {loadingFeatured ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {[...Array(8)].map((_, i) => (
                <ProductSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {featuredProducts?.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
          
          <Link to="/products?featured=true" className="sm:hidden flex items-center justify-center gap-1 text-purple-600 font-medium text-sm mt-6 hover:gap-2 transition-all">
            عرض جميع المنتجات المميزة ←
          </Link>
        </div>
      </section>

      {/* Categories */}
      {categories?.length > 0 && (
        <section className="py-14 sm:py-20">
          <div className="container-custom">
            <h2 className="section-title">تصفح حسب الفئة</h2>
            <p className="section-subtitle">اختر من بين مجموعتنا الواسعة من التصنيفات</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {categories?.slice(0, 10).map((category) => (
                <CategoryCard key={category._id} category={category} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Bestsellers */}
      <section className="py-14 sm:py-20 bg-gradient-to-b from-amber-50/50 to-white">
        <div className="container-custom">
          <div className="flex items-end justify-between mb-10">
            <div>
              <span className="inline-flex items-center gap-1.5 text-amber-600 font-medium text-sm mb-2">
                <span className="w-8 h-[2px] bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"></span>
                ⭐ الأكثر مبيعاً
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">منتجات يحبها عملاؤنا</h2>
            </div>
            <Link to="/products?bestseller=true" className="hidden sm:inline-flex items-center gap-1 text-amber-600 hover:text-amber-700 font-medium text-sm hover:gap-2 transition-all">
              عرض الكل
              <span>←</span>
            </Link>
          </div>
          
          {loadingBestsellers ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {[...Array(4)].map((_, i) => (
                <ProductSkeleton key={i} />
              ))}
            </div>
          ) : (
            <Swiper
              modules={[Autoplay]}
              spaceBetween={16}
              slidesPerView={2}
              autoplay={{ delay: 4000 }}
              breakpoints={{
                640: { slidesPerView: 2, spaceBetween: 20 },
                768: { slidesPerView: 3, spaceBetween: 24 },
                1024: { slidesPerView: 4, spaceBetween: 24 },
              }}
            >
              {bestsellers?.map((product) => (
                <SwiperSlide key={product._id}>
                  <ProductCard product={product} />
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </div>
      </section>

      {/* New Arrivals */}
      <section className="py-14 sm:py-20">
        <div className="container-custom">
          <div className="flex items-end justify-between mb-10">
            <div>
              <span className="inline-flex items-center gap-1.5 text-emerald-600 font-medium text-sm mb-2">
                <span className="w-8 h-[2px] bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"></span>
                ✨ وصل حديثاً
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">أحدث المنتجات</h2>
            </div>
            <Link to="/products?new=true" className="hidden sm:inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-medium text-sm hover:gap-2 transition-all">
              عرض الكل
              <span>←</span>
            </Link>
          </div>
          
          {loadingNew ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {[...Array(4)].map((_, i) => (
                <ProductSkeleton key={i} />
              ))}
            </div>
          ) : (
            <Swiper
              modules={[Autoplay]}
              spaceBetween={16}
              slidesPerView={2}
              autoplay={{ delay: 4000 }}
              breakpoints={{
                640: { slidesPerView: 2, spaceBetween: 20 },
                768: { slidesPerView: 3, spaceBetween: 24 },
                1024: { slidesPerView: 4, spaceBetween: 24 },
              }}
            >
              {newArrivals?.map((product) => (
                <SwiperSlide key={product._id}>
                  <ProductCard product={product} />
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-fuchsia-600 to-pink-600"></div>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 text-white text-8xl animate-float">🎁</div>
          <div className="absolute bottom-10 left-10 text-white text-6xl animate-float" style={{ animationDelay: '1s' }}>🎀</div>
          <div className="absolute top-1/2 left-1/3 text-white text-5xl animate-float" style={{ animationDelay: '2s' }}>✨</div>
        </div>
        
        <div className="container-custom text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-5 py-2 rounded-full text-sm text-white/90 font-medium mb-6 border border-white/20">
            <span>🎯</span>
            <span>مساعد الهدايا الذكي</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-white">
            لا تعرف ماذا تختار؟
          </h2>
          <p className="text-lg text-purple-100 mb-10 max-w-2xl mx-auto leading-relaxed">
            استخدم أداة البحث عن الهدايا للعثور على الهدية المثالية حسب المناسبة والميزانية والشخص
          </p>
          <Link 
            to="/gift-finder" 
            className="inline-flex items-center gap-2 bg-white text-purple-700 px-8 py-4 rounded-2xl text-lg font-bold hover:bg-purple-50 transition-all duration-300 hover:shadow-2xl hover:shadow-white/20 hover:-translate-y-1 active:translate-y-0"
          >
            <span>🎯</span>
            ابدأ البحث الآن
            <span className="mr-1">←</span>
          </Link>
        </div>
      </section>
    </>
  )
}

export default HomePage
