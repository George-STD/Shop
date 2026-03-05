import ShippingPageClient from './ShippingPageClient'

export const metadata = {
  title: 'الشحن والتوصيل',
  description: 'معلومات عن خدمات الشحن والتوصيل في فور يو (For You). شحن سريع لجميع محافظات مصر. توصيل مجاني للطلبات فوق 500 جنيه مع إمكانية تتبع الطلب.',
  alternates: { canonical: 'https://foryo.me/shipping' },
  openGraph: {
    title: 'الشحن والتوصيل | For You - فور يو',
    description: 'شحن سريع لجميع محافظات مصر مع توصيل مجاني.',
    url: 'https://foryo.me/shipping',
  },
}

export default function Page() {
  return <ShippingPageClient />
}
