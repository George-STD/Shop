import AboutPageClient from './AboutPageClient'

export const metadata = {
  title: 'من نحن - تعرف على فور يو',
  description: 'تعرف على فور يو (For You) - متجر الهدايا الأول في مصر. نقدم أفضل تشكيلة هدايا لجميع المناسبات مع خدمة تغليف مجانية وتوصيل سريع.',
  alternates: { canonical: 'https://foryo.me/about' },
  openGraph: {
    title: 'من نحن | For You - فور يو',
    description: 'تعرف على فور يو - متجر الهدايا الأول في مصر.',
    url: 'https://foryo.me/about',
  },
}

export default function Page() {
  return <AboutPageClient />
}
