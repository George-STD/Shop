import { FiRefreshCw, FiCheckCircle, FiXCircle, FiAlertCircle } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { STRINGS } from '../constants';

const ReturnsPage = () => {
  const steps = STRINGS.RETURNS_PAGE.STEPS;

  const eligibleProducts = STRINGS.RETURNS_PAGE.ELIGIBLE_PRODUCTS;

  const nonEligibleProducts = STRINGS.RETURNS_PAGE.NON_ELIGIBLE_PRODUCTS;

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Hero */}
        <div className="bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white py-16">
          <div className="container-custom text-center">
            <FiRefreshCw className="text-5xl mx-auto mb-4" />
            <h1 className="text-4xl font-bold mb-4">{STRINGS.RETURNS_PAGE.HERO_TITLE}</h1>
            <p className="text-xl opacity-90">{STRINGS.RETURNS_PAGE.HERO_SUBTITLE}</p>
          </div>
        </div>

        <div className="container-custom py-12">
          {/* Return Policy Overview */}
          <section className="bg-white rounded-2xl p-8 mb-12">
            <h2 className="text-2xl font-bold mb-6">{STRINGS.RETURNS_PAGE.POLICY_OVERVIEW_TITLE}</h2>
            <p className="text-gray-600 text-lg leading-relaxed mb-6">
              {STRINGS.RETURNS_PAGE.POLICY_OVERVIEW_DESC}{' '}
              <strong>{STRINGS.RETURNS_PAGE.POLICY_OVERVIEW_DAYS}</strong> {STRINGS.RETURNS_PAGE.POLICY_OVERVIEW_DESC_CONT}
            </p>
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 flex items-center gap-3">
              <FiAlertCircle className="text-purple-600 text-2xl flex-shrink-0" />
              <p className="text-purple-800">
                {STRINGS.RETURNS_PAGE.POLICY_ALERT}
              </p>
            </div>
          </section>

          {/* Steps */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-8 text-center">{STRINGS.RETURNS_PAGE.STEPS_TITLE}</h2>
            <div className="grid md:grid-cols-4 gap-6">
              {steps.map((item) => (
                <div key={item.step} className="bg-white rounded-2xl p-6 text-center relative">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="font-bold mb-2">{item.title}</h3>
                  <p className="text-gray-500 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Eligible vs Non-Eligible */}
          <section className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <FiCheckCircle className="text-green-600 text-xl" />
                </div>
                <h2 className="text-xl font-bold">{STRINGS.RETURNS_PAGE.ELIGIBLE_TITLE}</h2>
              </div>
              <ul className="space-y-3">
                {eligibleProducts.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-gray-600">
                    <FiCheckCircle className="text-green-500 flex-shrink-0 mt-1" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <FiXCircle className="text-red-600 text-xl" />
                </div>
                <h2 className="text-xl font-bold">{STRINGS.RETURNS_PAGE.NON_ELIGIBLE_TITLE}</h2>
              </div>
              <ul className="space-y-3">
                {nonEligibleProducts.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-gray-600">
                    <FiXCircle className="text-red-500 flex-shrink-0 mt-1" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Refund Info */}
          <section className="bg-white rounded-2xl p-8 mb-12">
            <h2 className="text-2xl font-bold mb-6">{STRINGS.RETURNS_PAGE.REFUND_INFO_TITLE}</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-bold mb-3">{STRINGS.RETURNS_PAGE.REFUND_METHOD_TITLE}</h3>
                <p className="text-gray-600">
                  {STRINGS.RETURNS_PAGE.REFUND_METHOD_DESC}
                </p>
              </div>
              <div>
                <h3 className="font-bold mb-3">{STRINGS.RETURNS_PAGE.REFUND_DURATION_TITLE}</h3>
                <p className="text-gray-600">
                  {STRINGS.RETURNS_PAGE.REFUND_DURATION_DESC}
                </p>
              </div>
            </div>
          </section>

          {/* Exchange */}
          <section className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 mb-12">
            <h2 className="text-2xl font-bold mb-4">{STRINGS.RETURNS_PAGE.EXCHANGE_TITLE}</h2>
            <p className="text-gray-700 mb-4">
              {STRINGS.RETURNS_PAGE.EXCHANGE_P1}
            </p>
            <p className="text-gray-600">
              <strong>{STRINGS.RETURNS_PAGE.EXCHANGE_P2_NOTE}</strong> {STRINGS.RETURNS_PAGE.EXCHANGE_P2}
            </p>
          </section>

          {/* Contact CTA */}
          <section className="text-center">
            <h2 className="text-2xl font-bold mb-4">{STRINGS.RETURNS_PAGE.NEED_HELP_TITLE}</h2>
            <p className="text-gray-600 mb-6">{STRINGS.RETURNS_PAGE.NEED_HELP_DESC}</p>
            <Link to="/contact" className="btn-primary inline-block">
              {STRINGS.RETURNS_PAGE.CONTACT_US}
            </Link>
          </section>
        </div>
      </div>
    </>
  );
};

export default ReturnsPage;
