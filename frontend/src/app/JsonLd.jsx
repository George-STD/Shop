export default function JsonLd() {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: 'For You - فور يو',
    alternateName: 'فور يو للهدايا',
    url: 'https://foryo.me',
    logo: 'https://foryo.me/images/logo.jpeg',
    image: 'https://foryo.me/images/og-image.jpg',
    description:
      'فور يو - متجر الهدايا الأول في مصر. تشكيلة واسعة من هدايا أعياد الميلاد، الزواج، التخرج وجميع المناسبات.',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'EG',
      addressLocality: 'القاهرة',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '30.0444',
      longitude: '31.2357',
    },
    openingHours: 'Mo-Su 09:00-23:00',
    priceRange: '$$',
    currenciesAccepted: 'EGP',
    paymentAccepted: 'Cash, Credit Card, Fawry, Vodafone Cash',
    sameAs: [
      'https://facebook.com/foryoegypt',
      'https://instagram.com/foryoegypt',
      'https://tiktok.com/@foryoegypt',
    ],
  }

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'For You - فور يو',
    alternateName: 'فور يو للهدايا',
    url: 'https://foryo.me',
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
