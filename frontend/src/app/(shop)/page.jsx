import HomePageClient from './HomePageClient'

export const metadata = {
  title: 'For You | فور يو - متجر الهدايا الأول في مصر | هدايا لجميع المناسبات',
  description: 'فور يو - أفضل متجر هدايا اون لاين في مصر. اكتشف تشكيلة واسعة من هدايا أعياد الميلاد، الزواج، التخرج، الخطوبة والمواليد. شحن سريع وتغليف مجاني.',
  alternates: {
    canonical: 'https://foryo.me',
  },
  openGraph: {
    title: 'For You | فور يو - متجر الهدايا الأول في مصر',
    description: 'فور يو - أفضل متجر هدايا اون لاين في مصر. شحن سريع وتغليف مجاني لكل أنحاء مصر.',
    url: 'https://foryo.me',
  },
}

export default function Page() {
  return <HomePageClient />
}
