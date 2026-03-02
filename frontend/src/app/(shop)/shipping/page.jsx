import ShippingPageClient from './ShippingPageClient'

export const metadata = {
  title: 'الشحن والتوصيل',
  description: 'معلومات عن خدمات الشحن والتوصيل في فور يو. شحن سريع لجميع محافظات مصر مع إمكانية تتبع الطلب.',
  alternates: {
    canonical: 'https://foryo.me/shipping',
  },
}

export default function Page() {
  return <ShippingPageClient />
}
