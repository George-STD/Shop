import { FiGlobe, FiTruck, FiShield, FiClock, FiPackage, FiHeart } from 'react-icons/fi';
import { FaInstagram, FaFacebookF, FaYoutube } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { STRINGS } from '../constants';

const icons = [FiGlobe, FiTruck, FiShield, FiClock, FiPackage, FiHeart];

const StoresPage = () => {
  const features = STRINGS.STORES_PAGE.FEATURES.map((feature, idx) => ({
    ...feature,
    icon: icons[idx],
  }));

  const socialLinks = [
    { icon: FaInstagram, name: 'Instagram', href: 'https://www.instagram.com/foryou._.21' },
    {
      icon: FaFacebookF,
      name: 'Facebook',
      href: 'https://www.facebook.com/share/1BzYfakvLp/?mibextid=wwXIfr',
    },
    { icon: FaYoutube, name: 'YouTube', href: 'https://www.youtube.com/@foryou-l1k' },
  ];
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white py-16">
        <div className="container-custom text-center">
          <FiGlobe className="text-5xl mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-4">{STRINGS.STORES_PAGE.HERO_TITLE}</h1>
          <p className="text-xl opacity-90">
            {STRINGS.STORES_PAGE.HERO_SUBTITLE}
          </p>
        </div>
      </div>

      <div className="container-custom py-12">
        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow text-center"
            >
              <feature.icon className="text-4xl mx-auto mb-4 text-purple-600" />
              <h2 className="text-xl font-bold mb-2">{feature.title}</h2>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="bg-white rounded-2xl p-8 mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">{STRINGS.STORES_PAGE.HOW_IT_WORKS_TITLE}</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {STRINGS.STORES_PAGE.HOW_IT_WORKS_STEPS.map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Social & Contact */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 text-center mb-16">
          <h2 className="text-2xl font-bold mb-2">{STRINGS.STORES_PAGE.SOCIAL_TITLE}</h2>
          <p className="text-gray-600 mb-6">{STRINGS.STORES_PAGE.SOCIAL_DESC}</p>
          <div className="flex justify-center gap-4 mb-6">
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full bg-white shadow-sm hover:shadow-md flex items-center justify-center text-purple-600 hover:text-pink-600 transition-all"
                aria-label={social.name}
              >
                <social.icon className="text-xl" />
              </a>
            ))}
          </div>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-full font-medium transition-colors"
          >
            {STRINGS.STORES_PAGE.CONTACT_US}
          </Link>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">{STRINGS.STORES_PAGE.CTA_TITLE}</h2>
          <p className="text-gray-600 mb-6">{STRINGS.STORES_PAGE.CTA_DESC}</p>
          <Link to="/products" className="btn-primary inline-block">
            {STRINGS.STORES_PAGE.CTA_BUTTON}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StoresPage;
