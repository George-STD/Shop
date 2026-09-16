import HomePageClient from './HomePageClient';
import { SITE_CONFIG } from '../../constants';

const SITE_URL = SITE_CONFIG.SITE_URL;

export const metadata = {
  title: {
    absolute: 'For You - فور يو | متجر الهدايا الأول في مصر | هدايا لجميع المناسبات',
  },
  description:
    'فور يو (For You / ForYo) - أفضل متجر هدايا أون لاين في مصر. اكتشف تشكيلة واسعة من هدايا أعياد الميلاد، الزواج، التخرج، الخطوبة، والمواليد مع إمكانية تصميم بوكس هديتك بنفسك وشحن سريع لجميع المحافظات.',
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: 'For You - فور يو | متجر الهدايا الأول في مصر',
    description:
      'فور يو (For You) - أفضل متجر هدايا أون لاين في مصر. هدايا لجميع المناسبات مع شحن سريع وتغليف مجاني فاخر.',
    url: SITE_URL,
  },
};

export default function Page() {
  return <HomePageClient />;
}
