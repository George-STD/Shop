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
        robots: isNotFound ? { index: false, follow: true } : undefined,
      };
    }

    const canonicalSlug = product.slug || slug;
    const title = product.seo?.metaTitle || product.name;
    const description =
      product.seo?.metaDescription ||
      product.shortDescription ||
      (product.description
        ? product.description.replace(/<[^>]+>/g, '').substring(0, 160)
        : `اشترِ ${product.name} من فور يو (For You) - متجر الهدايا الأول في مصر مع توصيل سريع وتغليف فاخر.`);
    const ogImages =
      product.images?.length > 0
        ? product.images.map((img) => ({
            url: img.url,
            width: 800,
            height: 800,
            alt: img.alt || product.name,
          }))
        : [{ url: `${SITE_URL}${SITE_CONFIG.OG_IMAGE}`, width: 1200, height: 630, alt: product.name }];
    const price = product.salePrice || product.price;
    const isAvailable =
      product.stock === null ||
      product.stock === undefined ||
      product.stock === '' ||
      Number(product.stock) > 0;
    const keywords = [
      ...(Array.isArray(product.seo?.keywords) ? product.seo.keywords : []),
      ...(Array.isArray(product.tags) ? product.tags : []),
      product.name,
      'فور يو',
      'For You',
      'هدايا',
    ].filter(Boolean);

    return {
      title,
      description,
      keywords,
      alternates: {
        canonical: `${SITE_URL}/product/${canonicalSlug}`,
      },
      openGraph: {
        title: `${title} | ${SITE_CONFIG.SITE_NAME}`,
        description,
        url: `${SITE_URL}/product/${canonicalSlug}`,
        siteName: SITE_CONFIG.SITE_NAME,
        locale: SITE_CONFIG.LOCALE,
        type: 'website',
        images: ogImages,
      },
      twitter: {
        card: 'summary_large_image',
        title: `${title} | ${SITE_CONFIG.SITE_NAME}`,
        description,
        images: [ogImages[0].url],
      },
      other: {
        'product:price:amount': String(price),
        'product:price:currency': 'EGP',
        'product:availability': isAvailable ? 'in stock' : 'out of stock',
        'product:condition': 'new',
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
  const { product, notFound: isNotFound } = await getProductBySlug(slug);

  if (isNotFound) {
    notFound();
  }

  return (
    <>
      {product && <ProductJsonLd product={product} slug={slug} />}
      <ProductPageClient initialProduct={product} slug={slug} />
    </>
  );
}
