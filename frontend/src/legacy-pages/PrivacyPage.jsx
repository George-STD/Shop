import { STRINGS } from '../constants';

const PrivacyPage = () => {
  return (
    <>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto bg-white rounded-2xl p-8 md:p-12 shadow-sm">
            <h1 className="text-3xl font-bold mb-8">{STRINGS.PRIVACY_PAGE.HERO_TITLE}</h1>
            <p className="text-gray-500 mb-8">{STRINGS.PRIVACY_PAGE.LAST_UPDATED}</p>

            <div className="prose prose-lg max-w-none text-gray-600">
              {/* Introduction */}
              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">{STRINGS.PRIVACY_PAGE.SECTIONS[0].title}</h2>
                <p>{STRINGS.PRIVACY_PAGE.SECTIONS[0].content}</p>
              </section>

              {/* Information We Collect */}
              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">{STRINGS.PRIVACY_PAGE.SECTIONS[1].title}</h2>
                <h3 className="font-bold text-gray-700 mb-2">{STRINGS.PRIVACY_PAGE.SECTIONS[1].subtitles[0]}</h3>
                <ul className="list-disc list-inside mb-4 space-y-2">
                  {STRINGS.PRIVACY_PAGE.SECTIONS[1].lists[0].map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>

                <h3 className="font-bold text-gray-700 mb-2">{STRINGS.PRIVACY_PAGE.SECTIONS[1].subtitles[1]}</h3>
                <ul className="list-disc list-inside space-y-2">
                  {STRINGS.PRIVACY_PAGE.SECTIONS[1].lists[1].map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </section>

              {/* How We Use Your Information */}
              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">{STRINGS.PRIVACY_PAGE.SECTIONS[2].title}</h2>
                <ul className="list-disc list-inside space-y-2">
                  {STRINGS.PRIVACY_PAGE.SECTIONS[2].list.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </section>

              {/* Information Sharing */}
              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">{STRINGS.PRIVACY_PAGE.SECTIONS[3].title}</h2>
                <p className="mb-4">{STRINGS.PRIVACY_PAGE.SECTIONS[3].intro}</p>
                <ul className="list-disc list-inside space-y-2">
                  {STRINGS.PRIVACY_PAGE.SECTIONS[3].listItems.map((item, idx) => (
                    <li key={idx}>
                      <strong>{item.strong}</strong> {item.text}
                    </li>
                  ))}
                </ul>
                <p className="mt-4">
                  <strong>{STRINGS.PRIVACY_PAGE.SECTIONS[3].outro}</strong>
                </p>
              </section>

              {/* Cookies */}
              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  {STRINGS.PRIVACY_PAGE.SECTIONS[4].title}
                </h2>
                <p className="mb-4">{STRINGS.PRIVACY_PAGE.SECTIONS[4].intro}</p>
                <ul className="list-disc list-inside space-y-2">
                  {STRINGS.PRIVACY_PAGE.SECTIONS[4].list.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
                <p className="mt-4">{STRINGS.PRIVACY_PAGE.SECTIONS[4].outro}</p>
              </section>

              {/* Data Security */}
              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">{STRINGS.PRIVACY_PAGE.SECTIONS[5].title}</h2>
                <p>{STRINGS.PRIVACY_PAGE.SECTIONS[5].content}</p>
              </section>

              {/* Your Rights */}
              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">{STRINGS.PRIVACY_PAGE.SECTIONS[6].title}</h2>
                <p className="mb-4">{STRINGS.PRIVACY_PAGE.SECTIONS[6].intro}</p>
                <ul className="list-disc list-inside space-y-2">
                  {STRINGS.PRIVACY_PAGE.SECTIONS[6].list.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </section>

              {/* Data Retention */}
              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">{STRINGS.PRIVACY_PAGE.SECTIONS[7].title}</h2>
                <p>{STRINGS.PRIVACY_PAGE.SECTIONS[7].content}</p>
              </section>

              {/* Policy Changes */}
              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">{STRINGS.PRIVACY_PAGE.SECTIONS[8].title}</h2>
                <p>{STRINGS.PRIVACY_PAGE.SECTIONS[8].content}</p>
              </section>

              {/* Contact Us */}
              <section>
                <h2 className="text-xl font-bold text-gray-800 mb-4">{STRINGS.PRIVACY_PAGE.SECTIONS[9].title}</h2>
                <p>{STRINGS.PRIVACY_PAGE.SECTIONS[9].content}</p>
                <div className="mt-4 bg-gray-50 rounded-xl p-4">
                  <p>
                    <strong>{STRINGS.PRIVACY_PAGE.SECTIONS[9].contactInfo.emailLabel}</strong> {STRINGS.PRIVACY_PAGE.SECTIONS[9].contactInfo.email}
                  </p>
                  <p>
                    <strong>{STRINGS.PRIVACY_PAGE.SECTIONS[9].contactInfo.addressLabel}</strong> {STRINGS.PRIVACY_PAGE.SECTIONS[9].contactInfo.address}
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

export default PrivacyPage;
