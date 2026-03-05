export default function JsonLd() {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    '@id': 'https://foryo.me/#organization',
    name: 'For You - فور يو',
    alternateName: ['فور يو للهدايا', 'ForYo', 'ForYou', 'For You Gift Shop', 'فور يو', 'فوريو', 'متجر فور يو'],
    url: 'https://foryo.me',
    logo: {
      '@type': 'ImageObject',
      url: 'https://foryo.me/images/logo.jpeg',
      width: 512,
      height: 512,
    },
    image: 'https://foryo.me/images/logo.jpeg',
    description:
      'فور يو (For You) - متجر الهدايا الأول في مصر. تشكيلة واسعة من هدايا أعياد الميلاد، الزواج، التخرج وجميع المناسبات. شحن سريع وتغليف مجاني.',
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
    sameAs: [
      'https://www.facebook.com/share/1BzYfakvLp/?mibextid=wwXIfr',
      'https://www.instagram.com/foryou._.21',
      'https://www.youtube.com/@foryou-l1k',
    ],
  }

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': 'https://foryo.me/#website',
    name: 'For You - فور يو',
    alternateName: ['ForYo', 'ForYou', 'For You Gift Shop', 'فور يو', 'فوريو', 'فور يو للهدايا'],
    url: 'https://foryo.me',
    publisher: { '@id': 'https://foryo.me/#organization' },
    inLanguage: 'ar',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://foryo.me/products?search={search_term_string}',
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
