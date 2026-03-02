import AboutPageClient from './AboutPageClient'

export const metadata = {
  title: 'من نحن',
  description: 'تعرف على فور يو - متجر الهدايا الأول في مصر. نقدم أفضل تشكيلة هدايا لجميع المناسبات مع خدمة تغليف مجانية وتوصيل سريع.',
  alternates: {
    canonical: 'https://foryo.me/about',
  },
}

export default function Page() {
  return <AboutPageClient />
}
