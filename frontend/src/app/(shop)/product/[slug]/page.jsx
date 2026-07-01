import ProductPageClient from './ProductPageClient'
import ProductJsonLd from './ProductJsonLd'
import { notFound } from 'next/navigation'
import { API_URL, SITE_CONFIG } from '../../../../constants'

const SITE_URL = SITE_CONFIG.SITE_URL

export async function generateMetadata({ params }) {
  const { slug } = await params
  try {
    const res = await fetch(`${API_URL}/products/slug/${slug}`, { next: { revalidate: 3600 } })
    if (!res.ok) return { title: 'المنتج غير موجود' }
    const data = await res.json()
    const product = data.data

    const title = product.name
    const description = product.description
      ? product.description.replace(/<[^>]+>/g, '').substring(0, 160)
      : `اشترِ ${product.name} من فور يو - متجر الهدايا الأول في مصر`
    const image = product.images?.[0]?.url || `${SITE_URL}/images/og-image.jpg`
    const price = product.salePrice || product.price

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
        type: 'website',
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
    }
  } catch (error) {
    return {
      title: 'هدايا فور يو',
      description: 'اكتشف مجموعتنا من الهدايا المميزة لجميع المناسبات.',
    }
  }
}

export default async function Page({ params }) {
  const { slug } = await params
  const res = await fetch(`${API_URL}/products/slug/${slug}`, { next: { revalidate: 3600 } })

  if (res.status === 404) {
    notFound()
  }
  if (!res.ok) {
    throw new Error(`Failed to fetch product metadata for slug: ${slug}`)
  }

  return (
    <>
      <ProductJsonLd slug={slug} />
      <ProductPageClient />
    </>
  )
}
