import { SITE_CONFIG, SOCIAL_LINKS } from '../constants'

export default function JsonLd() {
  const siteUrl = SITE_CONFIG.SITE_URL
  const logoUrl = `${siteUrl}${SITE_CONFIG.LOGO_URL}`

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
      addressCountry: 'EG',
      addressLocality: 'القاهرة',
      addressRegion: 'القاهرة',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '30.0444',
      longitude: '31.2357',
    },
    areaServed: {
      '@type': 'Country',
      name: 'Egypt',
    },
    openingHours: 'Mo-Su 09:00-23:00',
    priceRange: '$$',
    currenciesAccepted: 'EGP',
    paymentAccepted: 'Cash, InstaPay',
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
  }

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
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
    </>
  )
}
