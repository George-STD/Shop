const API_URL = 'https://shop-gx97.onrender.com/api'

export default async function ProductJsonLd({ slug }) {
  try {
    const res = await fetch(`${API_URL}/products/slug/${slug}`, { next: { revalidate: 3600 } })
    if (!res.ok) return null
    const data = await res.json()
    const product = data.data

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description?.replace(/<[^>]+>/g, '').substring(0, 300) || '',
      image: product.images || [],
      sku: product._id,
      url: `https://foryo.me/product/${slug}`,
      brand: {
        '@type': 'Brand',
        name: 'For You - فور يو',
      },
      offers: {
        '@type': 'Offer',
        url: `https://foryo.me/product/${slug}`,
        priceCurrency: 'EGP',
        price: product.salePrice || product.price,
        availability: product.stock > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
        seller: {
          '@type': 'Organization',
          name: 'For You - فور يو',
        },
      },
    }

    // Add aggregate rating if reviews exist
    if (product.ratingsCount > 0) {
      schema.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: product.ratingsAverage || 0,
        reviewCount: product.ratingsCount,
        bestRating: 5,
        worstRating: 1,
      }
    }

    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
    )
  } catch (error) {
    return null
  }
}
