import ProductsPageClient from './ProductsPageClient';
import { PAGE_METADATA } from '../../../lib/metadata';
import { getInitialProductsCatalog } from '../../../lib/serverCatalog';
import { SITE_CONFIG } from '../../../constants';

const SITE_URL = SITE_CONFIG.SITE_URL;

export const revalidate = 300;
export const metadata = PAGE_METADATA.products;

export default async function Page() {
  const initialData = await getInitialProductsCatalog();
  const products = initialData?.productsData?.data || [];

  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${SITE_URL}/products#collection`,
    name: 'جميع الهدايا والمنتجات | For You - فور يو',
    description: PAGE_METADATA.products.description,
    url: `${SITE_URL}/products`,
    inLanguage: 'ar',
    isPartOf: { '@id': `${SITE_URL}/#website` },
    ...(products.length > 0 && {
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: products.slice(0, 20).map((product, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          url: `${SITE_URL}/product/${product.slug || product._id}`,
          name: product.name,
        })),
      },
    }),
  };

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
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(collectionSchema).replace(/</g, '\\u003c'),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema).replace(/</g, '\\u003c'),
        }}
      />
      <ProductsPageClient initialData={initialData} />
    </>
  );
}
