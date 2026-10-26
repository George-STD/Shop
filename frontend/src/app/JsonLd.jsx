import { SITE_CONFIG, SOCIAL_LINKS } from '../constants';

export default function JsonLd() {
  const siteUrl = SITE_CONFIG.SITE_URL;
  const logoUrl = `${siteUrl}${SITE_CONFIG.LOGO_URL}`;

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    '@id': `${siteUrl}/#organization`,
    name: SITE_CONFIG.SITE_NAME,
    alternateName: [
      SITE_CONFIG.SITE_NAME_AR,
      SITE_CONFIG.SITE_NAME_EN,
      'ForYo',
      'ForYou',
      'For You Gift Shop',
      'فور يو',
      'فوريو',
      'متجر فور يو',
      'فور يو للهدايا',
    ],
    url: siteUrl,
    logo: {
      '@type': 'ImageObject',
      url: logoUrl,
      width: 512,
      height: 512,
    },
    image: logoUrl,
    description: SITE_CONFIG.DEFAULT_DESCRIPTION,
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'المقطم، شارع 9',
      addressLocality: 'القاهرة',
      addressRegion: 'القاهرة',
      postalCode: '11571',
      addressCountry: 'EG',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'support@foryo.me',
      areaServed: 'EG',
      availableLanguage: ['Arabic', 'English'],
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 30.0119,
      longitude: 31.2859,
    },
    areaServed: {
      '@type': 'Country',
      name: 'Egypt',
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: [
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
          'Sunday',
        ],
        opens: '09:00',
        closes: '23:00',
      },
    ],
    priceRange: '$$',
    currenciesAccepted: 'EGP',
    paymentAccepted: 'Cash on Delivery, InstaPay, Credit Card, Mobile Wallet',
    hasMerchantReturnPolicy: {
      '@type': 'MerchantReturnPolicy',
      applicableCountry: 'EG',
      returnPolicyCountry: 'EG',
      returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
      merchantReturnDays: 14,
      returnMethod: 'https://schema.org/ReturnByMail',
      returnFees: 'https://schema.org/ReturnShippingFees',
      returnShippingFeesAmount: {
        '@type': 'MonetaryAmount',
        value: 95,
        currency: 'EGP',
      },
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'هدايا فور يو',
      itemListElement: [
        { '@type': 'OfferCatalog', name: 'هدايا عيد ميلاد' },
        { '@type': 'OfferCatalog', name: 'هدايا زواج' },
        { '@type': 'OfferCatalog', name: 'هدايا تخرج' },
        { '@type': 'OfferCatalog', name: 'هدايا خطوبة' },
        { '@type': 'OfferCatalog', name: 'هدايا مواليد' },
      ],
    },
    sameAs: Object.values(SOCIAL_LINKS),
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${siteUrl}/#website`,
    name: SITE_CONFIG.SITE_NAME,
    alternateName: [
      SITE_CONFIG.SITE_NAME_EN,
      SITE_CONFIG.SITE_NAME_AR,
      'ForYo',
      'ForYou',
      'For You Gift Shop',
      'فور يو',
      'فوريو',
      'فور يو للهدايا',
    ],
    url: siteUrl,
    publisher: { '@id': `${siteUrl}/#organization` },
    inLanguage: 'ar',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/products?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <>
      <script
        id="json-ld-organization"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema).replace(/</g, '\\u003c') }}
      />
      <script
        id="json-ld-website"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema).replace(/</g, '\\u003c') }}
      />
    </>
  );
}
