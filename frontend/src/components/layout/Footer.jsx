import { Link } from 'react-router-dom';
import {
  FiFacebook,
  FiInstagram,
  FiYoutube,
  FiMail,
  FiMapPin,
  FiMessageCircle,
  FiHeart,
} from 'react-icons/fi';
import { STRINGS, BUSINESS_CONFIG } from '../../constants';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Newsletter Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600"></div>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-[10%] text-6xl">💌</div>
          <div className="absolute bottom-4 left-[15%] text-5xl">✉️</div>
        </div>
        <div className="container-custom py-14 relative z-10">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm text-white/90 font-medium mb-4 border border-white/20">
              <span>📬</span>
              <span>{STRINGS.FOOTER.NEWSLETTER_BADGE}</span>
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
              {STRINGS.FOOTER.NEWSLETTER_TITLE}
            </h3>
            <p className="text-purple-100 mb-8 text-sm sm:text-base">
              {STRINGS.FOOTER.NEWSLETTER_SUBTITLE}
            </p>
            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder={STRINGS.FOOTER.NEWSLETTER_PLACEHOLDER}
                className="flex-1 px-5 py-3 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-white/50 bg-white/95 backdrop-blur-sm text-sm"
              />
              <button
                type="submit"
                className="bg-white text-purple-700 px-6 py-3 rounded-xl font-bold hover:bg-purple-50 transition-all hover:shadow-lg hover:shadow-white/20 hover:-translate-y-0.5 active:translate-y-0 text-sm whitespace-nowrap"
              >
                {STRINGS.FOOTER.NEWSLETTER_BUTTON} ←
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container-custom py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* About */}
          <div>
            <img
              src="/images/logo.jpeg"
              alt="For You Gift Shop"
              className="h-20 sm:h-24 w-auto mb-5 bg-white rounded-2xl p-2.5 sm:p-3 object-contain"
            />
            <p className="text-gray-400 mb-6 leading-relaxed text-sm">
              {STRINGS.FOOTER.ABOUT_DESC}
            </p>
            <div className="flex gap-3">
              <a
                href="https://www.facebook.com/share/1BzYfakvLp/?mibextid=wwXIfr"
                className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center hover:bg-gradient-to-br hover:from-purple-500 hover:to-pink-500 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 hover:-translate-y-0.5"
                target="_blank"
              >
                <FiFacebook size={16} />
              </a>
              <a
                href="https://www.instagram.com/foryou._.21?igsh=d3llMHFjdmE3Z25w&utm_source=qr"
                className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center hover:bg-gradient-to-br hover:from-purple-500 hover:to-pink-500 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 hover:-translate-y-0.5"
                target="_blank"
              >
                <FiInstagram size={16} />
              </a>
              <a
                href="https://youtube.com/@foryou-l1k?si=wL0zO2sHLypUtE-p"
                className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center hover:bg-gradient-to-br hover:from-purple-500 hover:to-pink-500 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 hover:-translate-y-0.5"
                target="_blank"
              >
                <FiYoutube size={16} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold text-white mb-5 uppercase tracking-wider">
              {STRINGS.FOOTER.QUICK_LINKS}
            </h4>
            <ul className="space-y-3">
              {[
                { to: '/about', label: STRINGS.FOOTER.ABOUT_US },
                { to: '/products', label: STRINGS.NAV.ALL_PRODUCTS },
                { to: '/gift-finder', label: STRINGS.NAV.GIFT_FINDER },
                { to: '/stores', label: STRINGS.NAV.STORES },
                { to: '/contact', label: STRINGS.FOOTER.CONTACT_US },
              ].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help & Support */}
          <div>
            <h4 className="text-sm font-bold text-white mb-5 uppercase tracking-wider">
              {STRINGS.FOOTER.HELP_SUPPORT}
            </h4>
            <ul className="space-y-3">
              {[
                { to: '/faq', label: STRINGS.FOOTER.FAQ },
                { to: '/shipping', label: STRINGS.FOOTER.SHIPPING },
                { to: '/returns', label: STRINGS.FOOTER.RETURNS },
                { to: '/track-order', label: STRINGS.NAV.TRACK_ORDER },
                { to: '/privacy', label: STRINGS.FOOTER.PRIVACY },
                { to: '/terms', label: STRINGS.FOOTER.TERMS },
              ].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 bg-pink-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-sm font-bold text-white mb-5 uppercase tracking-wider">
              {STRINGS.FOOTER.CONTACT_US}
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FiMapPin className="text-pink-400" size={14} />
                </div>
                <span className="text-sm">
                  {BUSINESS_CONFIG.ADDRESS.CITY}{STRINGS.COMMON.COMMA} {BUSINESS_CONFIG.ADDRESS.AREA}
                  <br />
                  {BUSINESS_CONFIG.ADDRESS.STREET}
                </span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FiMail className="text-pink-400" size={14} />
                </div>
                <a
                  href={`mailto:${BUSINESS_CONFIG.EMAIL}`}
                  className="hover:text-white transition-colors text-sm"
                >
                  {BUSINESS_CONFIG.EMAIL}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FiMessageCircle className="text-pink-400" size={14} />
                </div>
                <Link to="/contact" className="hover:text-white transition-colors text-sm">
                  {STRINGS.FOOTER.CONTACT_FORM}
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="border-t border-gray-800">
        <div className="container-custom py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-xs uppercase tracking-wider">{STRINGS.FOOTER.PAYMENT_METHODS}</p>
            <div className="flex items-center gap-4">
              <img
                src="/images/payments/cash.svg"
                alt="Cash on Delivery"
                className="h-7 opacity-60 hover:opacity-100 transition-opacity"
              />
              <img
                src="/images/payments/instapay.svg"
                alt="InstaPay"
                className="h-7 opacity-60 hover:opacity-100 transition-opacity"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-gray-800/50">
        <div className="container-custom py-5">
          <p className="text-center text-gray-500 text-xs flex items-center justify-center gap-1">
            © {currentYear} {BUSINESS_CONFIG.SITE_NAME_EN}. {STRINGS.FOOTER.MADE_WITH}{' '}
            <FiHeart className="text-pink-500 fill-pink-500" size={12} /> {STRINGS.FOOTER.RIGHTS_RESERVED}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
