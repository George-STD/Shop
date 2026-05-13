import HomePageClient from './HomePageClient'
import { SITE_CONFIG } from '../../constants'

const SITE_URL = SITE_CONFIG.SITE_URL

export const metadata = {
  title: 'For You | فور يو - متجر الهدايا الأول في مصر | هدايا لجميع المناسبات',
  description: 'فور يو (ForYo / For You) - أفضل متجر هدايا اون لاين في مصر. اكتشف تشكيلة واسعة من هدايا أعياد الميلاد، الزواج، التخرج، الخطوبة والمواليد. شحن سريع وتغليف مجاني لكل أنحاء مصر.',
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: 'For You | فور يو - متجر الهدايا الأول في مصر',
    description: 'فور يو (ForYo) - أفضل متجر هدايا اون لاين في مصر. هدايا لجميع المناسبات مع شحن سريع وتغليف مجاني.',
    url: SITE_URL,
  },
}

export default function Page() {
  return <HomePageClient />
}
