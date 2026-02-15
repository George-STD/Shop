import { Helmet } from 'react-helmet-async'
import { FiMapPin, FiPhone, FiClock, FiNavigation } from 'react-icons/fi'

const stores = [
  {
    id: 1,
    name: 'فرع القاهرة - التجمع الخامس',
    address: 'شارع التسعين، التجمع الخامس، كايرو فيستيفال سيتي',
    city: 'القاهرة',
    phone: '+20 2 2345 6789',
    hours: 'السبت - الخميس: 10ص - 10م | الجمعة: 2م - 10م',
    mapUrl: 'https://goo.gl/maps/xyz',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600'
  },
  {
    id: 2,
    name: 'فرع القاهرة - مدينة نصر',
    address: 'شارع عباس العقاد، سيتي ستارز مول',
    city: 'القاهرة',
    phone: '+20 2 2456 7890',
    hours: 'السبت - الخميس: 10ص - 10م | الجمعة: 2م - 10م',
    mapUrl: 'https://goo.gl/maps/xyz',
    image: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=600'
  },
  {
    id: 3,
    name: 'فرع الإسكندرية - سيتي سنتر',
    address: 'طريق الكورنيش، سيتي سنتر الإسكندرية',
    city: 'الإسكندرية',
    phone: '+20 3 345 6789',
    hours: 'السبت - الخميس: 10ص - 11م | الجمعة: 2م - 11م',
    mapUrl: 'https://goo.gl/maps/xyz',
    image: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=600'
  },
  {
    id: 4,
    name: 'فرع الجيزة - مول مصر',
    address: 'مول مصر، 6 أكتوبر',
    city: 'الجيزة',
    phone: '+20 2 3456 7890',
    hours: 'السبت - الخميس: 10ص - 10م | الجمعة: 4م - 10م',
    mapUrl: 'https://goo.gl/maps/xyz',
    image: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=600'
  },
]

const cities = ['الكل', 'القاهرة', 'الإسكندرية', 'الجيزة']

const StoresPage = () => {
  return (
    <>
      <Helmet>
        <title>فروعنا | For You - اعثر على أقرب فرع إليك</title>
        <meta name="description" content="اعثر على أقرب فرع هدايا إليك. فروعنا في القاهرة، الإسكندرية، الجيزة. زورنا واستمتع بتجربة تسوق فريدة." />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Hero */}
        <div className="bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white py-16">
          <div className="container-custom text-center">
            <FiMapPin className="text-5xl mx-auto mb-4" />
            <h1 className="text-4xl font-bold mb-4">فروعنا</h1>
            <p className="text-xl opacity-90">زورنا في أحد فروعنا المنتشرة في مصر</p>
          </div>
        </div>

        <div className="container-custom py-12">
          {/* City Filter */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {cities.map((city) => (
              <button
                key={city}
                className="px-6 py-2 rounded-full border-2 border-purple-500 font-medium transition-colors hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 hover:text-white first:bg-gradient-to-r first:from-purple-500 first:to-pink-500 first:text-white"
              >
                {city}
              </button>
            ))}
          </div>

          {/* Stores Grid */}
          <div className="grid md:grid-cols-2 gap-8">
            {stores.map((store) => (
              <div key={store.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
                <div className="aspect-video overflow-hidden">
                  <img 
                    src={store.image} 
                    alt={store.name}
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-bold">{store.name}</h2>
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 text-sm">{store.city}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3 text-gray-600 mb-6">
                    <div className="flex items-start gap-3">
                      <FiMapPin className="flex-shrink-0 mt-1 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600" />
                      <span>{store.address}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <FiPhone className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600" />
                      <a href={`tel:${store.phone}`} className="hover:text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">{store.phone}</a>
                    </div>
                    <div className="flex items-start gap-3">
                      <FiClock className="flex-shrink-0 mt-1 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600" />
                      <span>{store.hours}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <a 
                      href={store.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary flex-1 flex items-center justify-center gap-2"
                    >
                      <FiNavigation />
                      الاتجاهات
                    </a>
                    <a 
                      href={`tel:${store.phone}`}
                      className="btn-secondary flex-1 flex items-center justify-center gap-2"
                    >
                      <FiPhone />
                      اتصل بنا
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Map Section */}
          <div className="mt-12 bg-white rounded-2xl p-6">
            <h2 className="text-2xl font-bold mb-6">خريطة الفروع</h2>
            <div className="aspect-[16/9] bg-gray-200 rounded-xl overflow-hidden">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d463878.0368879582!2d46.5!3d24.7!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e2f03890d489399%3A0xba974d1c98e79fd5!2sRiyadh%20Saudi%20Arabia!5e0!3m2!1sen!2ssa!4v1234567890"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>

          {/* CTA */}
          <div className="mt-12 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">لا يوجد فرع قريب منك؟</h2>
            <p className="text-gray-600 mb-6">تسوق أونلاين واستلم طلبك حتى باب بيتك</p>
            <a href="/products" className="btn-primary inline-block">تسوق الآن</a>
          </div>
        </div>
      </div>
    </>
  )
}

export default StoresPage
