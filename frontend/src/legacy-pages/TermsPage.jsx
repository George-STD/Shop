import { Link } from 'react-router-dom';
import { STRINGS } from '../constants';

const TermsPage = () => {
  return (
    <>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto bg-white rounded-2xl p-8 md:p-12 shadow-sm">
            <h1 className="text-3xl font-bold mb-8">{STRINGS.TERMS_PAGE.HERO_TITLE}</h1>
            <p className="text-gray-500 mb-8">{STRINGS.TERMS_PAGE.LAST_UPDATED}</p>

            <div className="prose prose-lg max-w-none text-gray-600">
              {/* Introduction */}
              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">{STRINGS.TERMS_PAGE.SECTIONS[0].title}</h2>
                <p>{STRINGS.TERMS_PAGE.SECTIONS[0].content}</p>
              </section>

              {/* Definitions */}
              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">{STRINGS.TERMS_PAGE.SECTIONS[1].title}</h2>
                <ul className="list-disc list-inside space-y-2">
                  {STRINGS.TERMS_PAGE.SECTIONS[1].listItems.map((item, idx) => (
                    <li key={idx}>
                      <strong>{item.strong}</strong> {item.text}
                    </li>
                  ))}
                </ul>
              </section>

              {/* Eligibility */}
              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">{STRINGS.TERMS_PAGE.SECTIONS[2].title}</h2>
                <p>{STRINGS.TERMS_PAGE.SECTIONS[2].content}</p>
              </section>

              {/* User Account */}
              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">{STRINGS.TERMS_PAGE.SECTIONS[3].title}</h2>
                <ul className="list-disc list-inside space-y-2">
                  {STRINGS.TERMS_PAGE.SECTIONS[3].list.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </section>

              {/* Products and Pricing */}
              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">{STRINGS.TERMS_PAGE.SECTIONS[4].title}</h2>
                <ul className="list-disc list-inside space-y-2">
                  {STRINGS.TERMS_PAGE.SECTIONS[4].list.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </section>

              {/* Orders and Payments */}
              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">{STRINGS.TERMS_PAGE.SECTIONS[5].title}</h2>
                <ul className="list-disc list-inside space-y-2">
                  {STRINGS.TERMS_PAGE.SECTIONS[5].list.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </section>

              {/* Shipping and Delivery */}
              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">{STRINGS.TERMS_PAGE.SECTIONS[6].title}</h2>
                <ul className="list-disc list-inside space-y-2">
                  {STRINGS.TERMS_PAGE.SECTIONS[6].list.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </section>

              {/* Returns and Exchanges */}
              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">{STRINGS.TERMS_PAGE.SECTIONS[7].title}</h2>
                <p className="mb-4">{STRINGS.TERMS_PAGE.SECTIONS[7].intro}</p>
                <ul className="list-disc list-inside space-y-2">
                  {STRINGS.TERMS_PAGE.SECTIONS[7].list.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
                <p className="mt-4">
                  {STRINGS.TERMS_PAGE.SECTIONS[7].outroPrefix}{' '}
                  <Link
                    to="/returns"
                    className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 hover:underline"
                  >
                    {STRINGS.TERMS_PAGE.SECTIONS[7].outroLinkText}
                  </Link>
                  {STRINGS.TERMS_PAGE.SECTIONS[7].outroSuffix}
                </p>
              </section>

              {/* Intellectual Property */}
              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">{STRINGS.TERMS_PAGE.SECTIONS[8].title}</h2>
                <p>{STRINGS.TERMS_PAGE.SECTIONS[8].content}</p>
              </section>

              {/* Prohibited Use */}
              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">{STRINGS.TERMS_PAGE.SECTIONS[9].title}</h2>
                <p className="mb-4">{STRINGS.TERMS_PAGE.SECTIONS[9].intro}</p>
                <ul className="list-disc list-inside space-y-2">
                  {STRINGS.TERMS_PAGE.SECTIONS[9].list.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </section>

              {/* Limitation of Liability */}
              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">{STRINGS.TERMS_PAGE.SECTIONS[10].title}</h2>
                <p>{STRINGS.TERMS_PAGE.SECTIONS[10].content}</p>
              </section>

              {/* Applicable Law */}
              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">{STRINGS.TERMS_PAGE.SECTIONS[11].title}</h2>
                <p>{STRINGS.TERMS_PAGE.SECTIONS[11].content}</p>
              </section>

              {/* Amendments */}
              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">{STRINGS.TERMS_PAGE.SECTIONS[12].title}</h2>
                <p>{STRINGS.TERMS_PAGE.SECTIONS[12].content}</p>
              </section>

              {/* Contact Us */}
              <section>
                <h2 className="text-xl font-bold text-gray-800 mb-4">{STRINGS.TERMS_PAGE.SECTIONS[13].title}</h2>
                <p>{STRINGS.TERMS_PAGE.SECTIONS[13].content}</p>
                <div className="mt-4 bg-gray-50 rounded-xl p-4">
                  <p>
                    <strong>{STRINGS.TERMS_PAGE.SECTIONS[13].contactInfo.addressLabel}</strong> {STRINGS.TERMS_PAGE.SECTIONS[13].contactInfo.address}
                  </p>
                  <p>
                    <strong>{STRINGS.TERMS_PAGE.SECTIONS[13].contactInfo.emailLabel}</strong> {STRINGS.TERMS_PAGE.SECTIONS[13].contactInfo.email}
                  </p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TermsPage;
