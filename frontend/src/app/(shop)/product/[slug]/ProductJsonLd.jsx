import { API_URL, SITE_CONFIG } from '../../../../constants';

const SITE_URL = SITE_CONFIG.SITE_URL;

export default async function ProductJsonLd({ slug }) {
  try {
    const res = await fetch(`${API_URL}/products/slug/${slug}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = await res.json();
    const product = data.data;

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description?.replace(/<[^>]+>/g, '').substring(0, 300) || '',
      image: product.images?.map((img) => img.url) || [],
      sku: product._id,
      url: `${SITE_URL}/product/${slug}`,
      brand: {
        '@type': 'Brand',
        name: 'For You - فور يو',
      },
      offers: {
        '@type': 'Offer',
        url: `${SITE_URL}/product/${slug}`,
        priceCurrency: 'EGP',
        price: product.salePrice || product.price,
        availability:
          product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        seller: {
          '@type': 'Organization',
          name: 'For You - فور يو',
        },
      },
    };

    // Add aggregate rating if reviews exist
    if (product.rating?.count > 0) {
      schema.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: product.rating?.average || 0,
        reviewCount: product.rating?.count,
        bestRating: 5,
        worstRating: 1,
      };
    }

    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'الرئيسية',
          item: SITE_URL,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'المنتجات',
          item: `${SITE_URL}/products`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: product.name,
          item: `${SITE_URL}/product/${slug}`,
        },
      ],
    };

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
      </>
    );
  } catch (error) {
    return null;
  }
}
