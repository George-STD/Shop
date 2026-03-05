import ShippingPageClient from './ShippingPageClient'

export const metadata = {
  title: 'الشحن والتوصيل',
  description: 'معلومات عن خدمات الشحن والتوصيل في فور يو (For You). شحن لجميع محافظات مصر بسعر موحد 60 جنيه مع إمكانية تتبع الطلب.',
  alternates: { canonical: 'https://foryo.me/shipping' },
  openGraph: {
    title: 'الشحن والتوصيل | For You - فور يو',
    description: 'شحن لجميع محافظات مصر بسعر موحد 60 جنيه.',
    url: 'https://foryo.me/shipping',
  },
}

export default function Page() {
  return <ShippingPageClient />
}
