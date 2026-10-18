import { API_URL, SITE_CONFIG } from '../../../../constants';
import { getProductBySlug } from '../../../../lib/getProductBySlug';

const SITE_URL = SITE_CONFIG.SITE_URL;

async function fetchApprovedReviews(productId) {
  if (!productId) return [];
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);
  try {
    const res = await fetch(`${API_URL}/reviews/product/${productId}?limit=5`, {
      next: { revalidate: 3600 },
      signal: controller.signal,
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.data) ? data.data : [];
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

export default async function ProductJsonLd({ product: initialProduct, slug }) {
  try {
    let product = initialProduct;
    if (!product) {
      const res = await getProductBySlug(slug);
      product = res.product;
    }
    if (!product) return null;

    const reviews = await fetchApprovedReviews(product._id);
    const canonicalSlug = product.slug || slug;
    const primaryCategory = Array.isArray(product.category)
      ? product.category.find(Boolean)
      : product.category;

    const isAvailable =
      product.stock === null ||
      product.stock === undefined ||
      product.stock === '' ||
      Number(product.stock) > 0;

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      '@id': `${SITE_URL}/product/${canonicalSlug}#product`,
      name: product.name,
      description:
        product.seo?.metaDescription ||
        product.shortDescription ||
        product.description?.replace(/<[^>]+>/g, '').substring(0, 500) ||
        '',
      image: product.images?.map((img) => img.url).filter(Boolean) || [],
      sku: product.sku || String(product._id),
      mpn: product.sku || String(product._id),
      url: `${SITE_URL}/product/${canonicalSlug}`,
      ...(primaryCategory?.name ? { category: primaryCategory.name } : {}),
      brand: {
        '@type': 'Brand',
        name: SITE_CONFIG.SITE_NAME,
      },
      offers: {
        '@type': 'Offer',
        url: `${SITE_URL}/product/${canonicalSlug}`,
        priceCurrency: 'EGP',
        price: product.salePrice || product.price,
        priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        itemCondition: 'https://schema.org/NewCondition',
        availability: isAvailable ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        seller: {
          '@type': 'Organization',
          name: SITE_CONFIG.SITE_NAME,
          '@id': `${SITE_URL}/#organization`,
        },
        shippingDetails: [
          {
            '@type': 'OfferShippingDetails',
            shippingRate: {
              '@type': 'MonetaryAmount',
              value: 95,
              currency: 'EGP',
            },
            shippingDestination: {
              '@type': 'DefinedRegion',
              addressCountry: 'EG',
              addressRegion: 'القاهرة',
            },
            deliveryTime: {
              '@type': 'ShippingDeliveryTime',
              handlingTime: {
                '@type': 'QuantitativeValue',
                minValue: 0,
                maxValue: 1,
                unitCode: 'DAY',
              },
              transitTime: {
                '@type': 'QuantitativeValue',
                minValue: 1,
                maxValue: 2,
                unitCode: 'DAY',
              },
            },
          },
          {
            '@type': 'OfferShippingDetails',
            shippingRate: {
              '@type': 'MonetaryAmount',
              value: 125,
              currency: 'EGP',
            },
            shippingDestination: {
              '@type': 'DefinedRegion',
              addressCountry: 'EG',
            },
            deliveryTime: {
              '@type': 'ShippingDeliveryTime',
              handlingTime: {
                '@type': 'QuantitativeValue',
                minValue: 0,
                maxValue: 1,
                unitCode: 'DAY',
              },
              transitTime: {
                '@type': 'QuantitativeValue',
                minValue: 2,
                maxValue: 5,
                unitCode: 'DAY',
              },
            },
          },
        ],
        hasMerchantReturnPolicy: {
          '@type': 'MerchantReturnPolicy',
          applicableCountry: 'EG',
          returnPolicyCountry: 'EG',
          returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
          merchantReturnDays: 14,
          returnMethod: 'https://schema.org/ReturnByMail',
          returnFees: 'https://schema.org/ReturnShippingFees',
        },
      },
    };

    if (product.rating?.count > 0) {
      schema.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: Number(product.rating.average || 5).toFixed(1),
        reviewCount: product.rating.count,
        bestRating: 5,
        worstRating: 1,
      };
    }

    if (reviews.length > 0) {
      schema.review = reviews.map((rev) => ({
        '@type': 'Review',
        author: {
          '@type': 'Person',
          name: rev.user?.firstName || rev.guestName || 'عميل فور يو',
        },
        datePublished: rev.createdAt
          ? new Date(rev.createdAt).toISOString().split('T')[0]
          : undefined,
        name: rev.title || product.name,
        reviewBody: rev.comment || '',
        reviewRating: {
          '@type': 'Rating',
          ratingValue: rev.rating || 5,
          bestRating: 5,
          worstRating: 1,
        },
      }));
    }

    const breadcrumbItems = [
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
    ];

    if (primaryCategory?.name && primaryCategory?.slug) {
      breadcrumbItems.push({
        '@type': 'ListItem',
        position: 3,
        name: primaryCategory.name,
        item: `${SITE_URL}/products?category=${encodeURIComponent(primaryCategory.slug)}`,
      });
    }

    breadcrumbItems.push({
      '@type': 'ListItem',
      position: breadcrumbItems.length + 1,
      name: product.name,
      item: `${SITE_URL}/product/${canonicalSlug}`,
    });

    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbItems,
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
