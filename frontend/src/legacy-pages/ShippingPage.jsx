import { FiTruck, FiClock, FiMapPin, FiPackage, FiGift, FiCheckCircle } from 'react-icons/fi';
import { BUSINESS_CONFIG, STRINGS } from '../constants';

const featureIcons = [FiPackage, FiGift, FiClock, FiCheckCircle];

const ShippingPage = () => {
  const deliveryTimes = STRINGS.SHIPPING_PAGE.DELIVERY_TIMES;

  const features = STRINGS.SHIPPING_PAGE.FEATURES.map((feature, idx) => ({
    ...feature,
    icon: featureIcons[idx],
  }));

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Hero */}
        <div className="bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white py-16">
          <div className="container-custom text-center">
            <FiTruck className="text-5xl mx-auto mb-4" />
            <h1 className="text-4xl font-bold mb-4">{STRINGS.SHIPPING_PAGE.HERO_TITLE}</h1>
            <p className="text-xl opacity-90">{STRINGS.SHIPPING_PAGE.HERO_SUBTITLE}</p>
          </div>
        </div>

        <div className="container-custom py-12">
          {/* Shipping Options */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-8 text-center">{STRINGS.SHIPPING_PAGE.SHIPPING_OPTIONS_TITLE}</h2>
            <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
              {/* Cairo Shipping */}
              <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all text-center border border-purple-50">
                <div className="w-14 h-14 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <FiTruck className="text-2xl text-purple-600" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-gray-800">{STRINGS.SHIPPING_PAGE.SHIPPING_CAIRO_TITLE}</h3>
                <span className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                  {BUSINESS_CONFIG.SHIPPING_COST_CAIRO} {STRINGS.SHIPPING_PAGE.CURRENCY}
                </span>
                <div className="flex items-center justify-center gap-1.5 text-gray-600 mt-4 mb-2 text-sm font-medium">
                  <FiClock className="text-purple-500" />
                  <span>{STRINGS.SHIPPING_PAGE.SHIPPING_CAIRO_TIME}</span>
                </div>
                <p className="text-gray-500 text-xs sm:text-sm">{STRINGS.SHIPPING_PAGE.SHIPPING_CAIRO_DESC}</p>
              </div>

              {/* Other Governorates Shipping */}
              <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all text-center border border-purple-50">
                <div className="w-14 h-14 bg-gradient-to-r from-pink-100 to-amber-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <FiTruck className="text-2xl text-pink-600" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-gray-800">{STRINGS.SHIPPING_PAGE.SHIPPING_OTHER_TITLE}</h3>
                <span className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600">
                  {BUSINESS_CONFIG.SHIPPING_COST_OTHER} {STRINGS.SHIPPING_PAGE.CURRENCY}
                </span>
                <div className="flex items-center justify-center gap-1.5 text-gray-600 mt-4 mb-2 text-sm font-medium">
                  <FiClock className="text-pink-500" />
                  <span>{STRINGS.SHIPPING_PAGE.SHIPPING_OTHER_TIME}</span>
                </div>
                <p className="text-gray-500 text-xs sm:text-sm">{STRINGS.SHIPPING_PAGE.SHIPPING_OTHER_DESC}</p>
              </div>
            </div>
          </section>

          {/* Delivery Times */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-8 text-center">{STRINGS.SHIPPING_PAGE.DELIVERY_TIMES_TITLE}</h2>
            <div className="bg-white rounded-2xl p-6 max-w-2xl mx-auto">
              <div className="divide-y">
                {deliveryTimes.map((item, idx) => (
                  <div key={idx} className="flex justify-between py-4">
                    <span className="flex items-center gap-2">
                      <FiMapPin className="text-purple-600" />
                      {item.city}
                    </span>
                    <span className="text-gray-600">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Features */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-8 text-center">{STRINGS.SHIPPING_PAGE.FEATURES_TITLE}</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((item, idx) => (
                <div key={idx} className="bg-white rounded-2xl p-6 text-center">
                  <div className="w-14 h-14 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <item.icon className="text-2xl text-purple-600" />
                  </div>
                  <h3 className="font-bold mb-2">{item.title}</h3>
                  <p className="text-gray-500 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Important Notes */}
          <section className="bg-white rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-6">{STRINGS.SHIPPING_PAGE.IMPORTANT_NOTES_TITLE}</h2>
            <ul className="space-y-4 text-gray-600">
              {STRINGS.SHIPPING_PAGE.IMPORTANT_NOTES.map((note, idx) => (
                <li key={idx} className="flex gap-3">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 flex-shrink-0">
                    •
                  </span>
                  {note}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </>
  );
};

export default ShippingPage;
