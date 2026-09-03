import { SITE_CONFIG } from '../../../../constants';
import { getProductBySlug } from '../../../../lib/getProductBySlug';

const SITE_URL = SITE_CONFIG.SITE_URL;

export default async function ProductJsonLd({ product: initialProduct, slug }) {
  try {
    let product = initialProduct;
    if (!product) {
      const res = await getProductBySlug(slug);
      product = res.product;
    }
    if (!product) return null;

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description?.replace(/<[^>]+>/g, '').substring(0, 300) || '',
      image: product.images?.map((img) => img.url) || [],
      sku: product.sku || product._id,
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
        priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        itemCondition: 'https://schema.org/NewCondition',
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
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema).replace(/</g, '\\u003c') }}
        />
      </>
    );
  } catch (error) {
    return null;
  }
}
