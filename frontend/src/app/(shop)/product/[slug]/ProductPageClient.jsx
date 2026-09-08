'use client';

import dynamic from 'next/dynamic';

const ProductPage = dynamic(() => import('../../../../legacy-pages/ProductPage'), {
  ssr: true,
  loading: () => <div className="container-custom min-h-[800px] py-8" aria-label="Loading product" />,
});

export default function ProductPageClient({ initialProduct, slug }) {
  return <ProductPage initialProduct={initialProduct} slug={slug} />;
}
