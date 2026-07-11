import { Link } from 'react-router-dom';
import { FiHome, FiSearch, FiArrowRight } from 'react-icons/fi';
import { STRINGS } from '../constants';

const NotFoundPage = () => {
  return (
    <>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
        <div className="container-custom">
          <div className="max-w-lg mx-auto text-center">
            {/* 404 Illustration */}
            <div className="text-9xl font-bold text-purple-200 mb-4">404</div>

            <div className="text-6xl mb-6">🎁</div>

            <h1 className="text-3xl font-bold text-gray-800 mb-4">{STRINGS.NOT_FOUND_PAGE.TITLE}</h1>

            <p className="text-gray-600 text-lg mb-8">
              {STRINGS.NOT_FOUND_PAGE.MESSAGE}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/" className="btn-primary flex items-center justify-center gap-2">
                <FiHome />
                {STRINGS.NOT_FOUND_PAGE.GO_HOME}
              </Link>
              <Link to="/products" className="btn-secondary flex items-center justify-center gap-2">
                <FiSearch />
                {STRINGS.NOT_FOUND_PAGE.BROWSE_PRODUCTS}
              </Link>
            </div>

            {/* Helpful Links */}
            <div className="mt-12 pt-8 border-t">
              <h2 className="text-lg font-bold mb-4">{STRINGS.NOT_FOUND_PAGE.HELPFUL_LINKS_TITLE}</h2>
              <div className="flex flex-wrap justify-center gap-4">
                {STRINGS.NOT_FOUND_PAGE.HELPFUL_LINKS.map((link) => (
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
  );
};

export default NotFoundPage;
