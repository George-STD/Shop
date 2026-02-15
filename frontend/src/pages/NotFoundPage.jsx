import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { FiHome, FiSearch, FiArrowRight } from 'react-icons/fi'

const NotFoundPage = () => {
  return (
    <>
      <Helmet>
        <title>الصفحة غير موجودة | For You</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
        <div className="container-custom">
          <div className="max-w-lg mx-auto text-center">
            {/* 404 Illustration */}
            <div className="text-9xl font-bold text-purple-200 mb-4">404</div>
            
            <div className="text-6xl mb-6">🎁</div>
            
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              عذراً، الصفحة غير موجودة
            </h1>
            
            <p className="text-gray-600 text-lg mb-8">
              يبدو أن الصفحة التي تبحث عنها قد تم نقلها أو حذفها أو أن الرابط غير صحيح.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/" 
                className="btn-primary flex items-center justify-center gap-2"
              >
                <FiHome />
                الصفحة الرئيسية
              </Link>
              <Link 
                to="/products" 
                className="btn-secondary flex items-center justify-center gap-2"
              >
                <FiSearch />
                تصفح المنتجات
              </Link>
            </div>

            {/* Helpful Links */}
            <div className="mt-12 pt-8 border-t">
              <h2 className="text-lg font-bold mb-4">روابط قد تفيدك</h2>
              <div className="flex flex-wrap justify-center gap-4">
                {[
                  { to: '/gift-finder', label: 'باحث الهدايا' },
                  { to: '/products?category=bestseller', label: 'الأكثر مبيعاً' },
                  { to: '/contact', label: 'تواصل معنا' },
                  { to: '/faq', label: 'الأسئلة الشائعة' },
                ].map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 hover:underline flex items-center gap-1"
                  >
                    {link.label}
                    <FiArrowRight className="text-sm" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default NotFoundPage
