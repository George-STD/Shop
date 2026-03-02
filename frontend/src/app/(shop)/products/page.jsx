import ProductsPageClient from './ProductsPageClient'

export const metadata = {
  title: 'تسوق جميع الهدايا',
  description: 'تصفح مجموعتنا الكاملة من الهدايا لجميع المناسبات. هدايا أعياد ميلاد، زواج، تخرج، خطوبة ومواليد مع شحن سريع لكل مصر.',
  alternates: {
    canonical: 'https://foryo.me/products',
  },
  openGraph: {
    title: 'تسوق جميع الهدايا | For You - فور يو',
    description: 'تصفح مجموعتنا الكاملة من الهدايا لجميع المناسبات مع شحن سريع وتغليف مجاني.',
    url: 'https://foryo.me/products',
  },
}

export default function Page() {
  return <ProductsPageClient />
}
