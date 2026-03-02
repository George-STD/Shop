import ProductsCategoryClient from './ProductsCategoryClient'

const API_URL = 'https://shop-gx97.onrender.com/api'

export async function generateMetadata({ params }) {
  const { category } = await params
  try {
    const res = await fetch(`${API_URL}/categories/slug/${category}`, { next: { revalidate: 3600 } })
    if (!res.ok) {
      return {
        title: `${decodeURIComponent(category)} - هدايا`,
        description: `تسوق هدايا ${decodeURIComponent(category)} من فور يو - متجر الهدايا الأول في مصر.`,
      }
    }
    const data = await res.json()
    const cat = data.data

    return {
      title: `${cat.name} - تسوق الهدايا`,
      description: cat.description || `تسوق أفضل هدايا ${cat.name} من فور يو. شحن سريع وتغليف مجاني لكل مصر.`,
      alternates: {
        canonical: `https://foryo.me/products/${category}`,
      },
      openGraph: {
        title: `${cat.name} | For You - فور يو`,
        description: cat.description || `تسوق هدايا ${cat.name} من فور يو.`,
        url: `https://foryo.me/products/${category}`,
      },
    }
  } catch (error) {
    return {
      title: 'تسوق الهدايا',
      description: 'تصفح مجموعتنا الكاملة من الهدايا لجميع المناسبات.',
    }
  }
}

export default function Page() {
  return <ProductsCategoryClient />
}
