import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination, Navigation } from 'swiper/modules'
import { productsAPI, categoriesAPI } from '../services/api'
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
  })

  // Fetch bestsellers
  const { data: bestsellers, isLoading: loadingBestsellers } = useQuery({
    queryKey: ['products', 'bestsellers'],
    queryFn: () => productsAPI.getBestsellers(8).then(res => res.data.data)
  })

  // Fetch new arrivals
  const { data: newArrivals, isLoading: loadingNew } = useQuery({
    queryKey: ['products', 'new'],
    queryFn: () => productsAPI.getNew(8).then(res => res.data.data)
  })

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesAPI.getAll().then(res => res.data.data)
  })

  const occasions = [
    { name: 'عيد ميلاد', icon: '🎂', color: 'from-pink-400 to-pink-600' },
    { name: 'زفاف', icon: '💍', color: 'from-purple-400 to-purple-600' },
    { name: 'عيد الحب', icon: '❤️', color: 'from-red-400 to-red-600' },
    { name: 'عيد الأم', icon: '👩', color: 'from-rose-400 to-rose-600' },
    { name: 'تخرج', icon: '🎓', color: 'from-blue-400 to-blue-600' },
    { name: 'ولادة', icon: '👶', color: 'from-cyan-400 to-cyan-600' },
  ]

  const features = [
    { icon: '🚚', title: 'شحن سريع', description: 'توصيل لباب البيت' },
    { icon: '🎁', title: 'تغليف مجاني', description: 'تغليف هدايا أنيق' },
    { icon: '💳', title: 'دفع آمن', description: 'طرق دفع متعددة' },
    { icon: '↩️', title: 'إرجاع سهل', description: 'خلال 14 يوم' },
  ]

  return (
    <>
      <Helmet>
        <title>For You - متجر الهدايا الأول في مصر | هدايا لجميع المناسبات</title>
        <meta name="description" content="تسوق أفضل الهدايا لجميع المناسبات - عيد ميلاد، زفاف، تخرج، عيد الأم والمزيد. توصيل سريع لجميع أنحاء مصر. ورد، شوكولاتة، عطور، هدايا شخصية." />
        <meta name="keywords" content="For You, متجر هدايا، هدايا عيد ميلاد، هدايا زفاف، ورد، شوكولاتة، عطور، هدايا مصر" />
        <link rel="canonical" href="https://foryou-gifts.com/" />
      </Helmet>

      {/* Hero Section */}
      <section className="hero-gradient">
        <Swiper
          modules={[Autoplay, Pagination, Navigation]}
          spaceBetween={0}
          slidesPerView={1}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          pagination={{ clickable: true }}
          navigation
          className="h-[500px] md:h-[600px]"
        >
          <SwiperSlide>
            <div className="h-full flex items-center">
              <div className="container-custom">
                <div className="max-w-2xl animate-fadeInUp">
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 mb-6 leading-tight">
                    اجعل كل مناسبة 
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600"> لحظة لا تُنسى</span>
                  </h1>
                  <p className="text-xl text-gray-600 mb-8">
                    اكتشف تشكيلة واسعة من الهدايا المميزة لجميع المناسبات مع توصيل سريع لباب بيتك
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <Link to="/products" className="btn-primary text-lg px-8">
                      تسوق الآن
                    </Link>
                    <Link to="/gift-finder" className="btn-outline text-lg px-8">
                      اعثر على الهدية المثالية
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
          <SwiperSlide>
            <div className="h-full flex items-center bg-gradient-to-r from-purple-50 via-fuchsia-50 to-pink-50">
              <div className="container-custom">
                <div className="max-w-2xl animate-fadeInUp">
                  <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
                    خصومات تصل إلى 
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600"> 50%</span>
                  </h2>
                  <p className="text-xl text-gray-600 mb-8">
                    استمتع بأفضل العروض على الهدايا المميزة. عرض لفترة محدودة!
                  </p>
                  <Link to="/products?sort=discount" className="btn-gold text-lg px-8">
                    تسوق العروض
                  </Link>
                </div>
              </div>
            </div>
          </SwiperSlide>
        </Swiper>
      </section>

      {/* Features */}
      <section className="py-8 bg-white border-b">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* Shop by Occasion */}
      <section className="py-16">
        <div className="container-custom">
          <h2 className="section-title">تسوق حسب المناسبة</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {occasions.map((occasion, index) => (
              <OccasionCard key={index} {...occasion} />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-800">منتجات مميزة</h2>
            <Link to="/products?featured=true" className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 hover:underline">
              عرض الكل ←
            </Link>
          </div>
          
          {loadingFeatured ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="card p-4">
                  <div className="skeleton h-48 mb-4"></div>
                  <div className="skeleton h-4 mb-2"></div>
                  <div className="skeleton h-4 w-2/3"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {featuredProducts?.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Categories */}
      <section className="py-16">
        <div className="container-custom">
          <h2 className="section-title">تصفح حسب الفئة</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {categories?.slice(0, 10).map((category) => (
              <CategoryCard key={category._id} category={category} />
            ))}
          </div>
        </div>
      </section>

      {/* Bestsellers */}
      <section className="py-16 bg-gradient-to-r from-gold-50 to-gold-100">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="text-gold-600 font-medium">⭐ الأكثر مبيعاً</span>
              <h2 className="text-3xl font-bold text-gray-800 mt-2">منتجات يحبها عملاؤنا</h2>
            </div>
            <Link to="/products?bestseller=true" className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 hover:underline">
              عرض الكل ←
            </Link>
          </div>
          
          {loadingBestsellers ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="card p-4">
                  <div className="skeleton h-48 mb-4"></div>
                  <div className="skeleton h-4 mb-2"></div>
                  <div className="skeleton h-4 w-2/3"></div>
                </div>
              ))}
            </div>
          ) : (
            <Swiper
              modules={[Autoplay, Navigation]}
              spaceBetween={24}
              slidesPerView={2}
              navigation
              autoplay={{ delay: 4000 }}
              breakpoints={{
                640: { slidesPerView: 2 },
                768: { slidesPerView: 3 },
                1024: { slidesPerView: 4 },
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
      <section className="py-16">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="text-green-600 font-medium">✨ وصل حديثاً</span>
              <h2 className="text-3xl font-bold text-gray-800 mt-2">أحدث المنتجات</h2>
            </div>
            <Link to="/products?new=true" className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 hover:underline">
              عرض الكل ←
            </Link>
          </div>
          
          {loadingNew ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="card p-4">
                  <div className="skeleton h-48 mb-4"></div>
                  <div className="skeleton h-4 mb-2"></div>
                  <div className="skeleton h-4 w-2/3"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {newArrivals?.slice(0, 8).map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white">
        <div className="container-custom text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            لا تعرف ماذا تختار؟
          </h2>
          <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
            استخدم أداة البحث عن الهدايا للعثور على الهدية المثالية حسب المناسبة والميزانية والشخص
          </p>
          <Link 
            to="/gift-finder" 
            className="inline-flex items-center gap-2 bg-white text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-4 rounded-full text-lg font-bold hover:bg-gray-100 transition-colors"
          >
            <span>🎯</span>
            ابدأ البحث الآن
          </Link>
        </div>
      </section>
    </>
  )
}

export default HomePage
