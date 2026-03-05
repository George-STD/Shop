import ProductPageClient from './ProductPageClient'
import ProductJsonLd from './ProductJsonLd'

const API_URL = 'https://shop-gx97.onrender.com/api'

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
    const image = product.images?.[0]?.url || 'https://foryo.me/images/og-image.jpg'
    const price = product.salePrice || product.price

    return {
      title,
      description,
      alternates: {
        canonical: `https://foryo.me/product/${slug}`,
      },
      openGraph: {
        title: `${product.name} | For You - فور يو`,
        description,
        url: `https://foryo.me/product/${slug}`,
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
  return (
    <>
      <ProductJsonLd slug={slug} />
      <ProductPageClient />
    </>
  )
}
