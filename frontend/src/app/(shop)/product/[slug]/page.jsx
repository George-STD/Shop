import ProductPageClient from './ProductPageClient';
import ProductJsonLd from './ProductJsonLd';
import { notFound } from 'next/navigation';
import { SITE_CONFIG } from '../../../../constants';
import { getProductBySlug } from '../../../../lib/getProductBySlug';

const SITE_URL = SITE_CONFIG.SITE_URL;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  try {
    const { product, notFound: isNotFound, error } = await getProductBySlug(slug);
    if (isNotFound || error || !product) {
      return {
        title: 'هدايا فور يو',
        description: 'اكتشف مجموعتنا من الهدايا المميزة لجميع المناسبات.',
      };
    }

    const title = product.name;
    const description = product.description
      ? product.description.replace(/<[^>]+>/g, '').substring(0, 160)
      : `اشترِ ${product.name} من فور يو - متجر الهدايا الأول في مصر`;
    const image = product.images?.[0]?.url || `${SITE_URL}/images/og-image.jpg`;
    const price = product.salePrice || product.price;

    return {
      title,
      description,
      alternates: {
        canonical: `${SITE_URL}/product/${slug}`,
      },
      openGraph: {
        title: `${product.name} | For You - فور يو`,
        description,
        url: `${SITE_URL}/product/${slug}`,
        type: 'product',
        images: [{ url: image, width: 800, height: 800, alt: product.name }],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${product.name} | For You - فور يو`,
        description,
        images: [image],
      },
      other: {
        'product:price:amount': String(price),
        'product:price:currency': 'EGP',
      },
    };
  } catch (_) {
    return {
      title: 'هدايا فور يو',
      description: 'اكتشف مجموعتنا من الهدايا المميزة لجميع المناسبات.',
    };
  }
}

export default async function Page({ params }) {
  const { slug } = await params;
  const { product, notFound: isNotFound, error } = await getProductBySlug(slug);

  if (isNotFound) {
    notFound();
  }

  // If backend is sleeping/cold or error occurred, let the client component take over with retry
  if (error || !product) {
    return <ProductPageClient />;
  }

  return (
    <>
      <ProductJsonLd product={product} slug={slug} />
      <ProductPageClient />
    </>
  );
}
