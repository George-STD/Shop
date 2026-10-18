import HomePageClient from './HomePageClient';
import HeroSection from '../../components/home/hero/HeroSection';
import { SITE_CONFIG } from '../../constants';
import { getInitialHomeCatalog } from '../../lib/serverCatalog';

const SITE_URL = SITE_CONFIG.SITE_URL;

export const revalidate = 600;

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
    type: 'website',
    locale: SITE_CONFIG.LOCALE,
    siteName: SITE_CONFIG.SITE_NAME,
    title: 'For You - فور يو | متجر الهدايا الأول في مصر',
    description:
      'فور يو (For You) - أفضل متجر هدايا أون لاين في مصر. هدايا لجميع المناسبات مع شحن سريع وتغليف فاخر.',
    url: SITE_URL,
    images: [
      {
        url: `${SITE_URL}${SITE_CONFIG.OG_IMAGE}`,
        width: 1200,
        height: 630,
        alt: `${SITE_CONFIG.SITE_NAME} | ${SITE_CONFIG.SITE_TAGLINE}`,
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'For You - فور يو | متجر الهدايا الأول في مصر',
    description:
      'فور يو (For You) - أفضل متجر هدايا أون لاين في مصر. هدايا لجميع المناسبات مع شحن سريع وتغليف فاخر.',
    images: [`${SITE_URL}${SITE_CONFIG.OG_IMAGE}`],
  },
};

export default async function Page() {
  const initialData = await getInitialHomeCatalog();

  return (
    <>
      <HeroSection />
      <HomePageClient initialData={initialData} />
    </>
  );
}
