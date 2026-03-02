import GiftFinderPageClient from './GiftFinderPageClient'

export const metadata = {
  title: 'اختر الهدية المثالية',
  description: 'استخدم أداة اختيار الهدايا الذكية من فور يو. حدد المناسبة والشخص والميزانية واحصل على اقتراحات هدايا مثالية.',
  alternates: {
    canonical: 'https://foryo.me/gift-finder',
  },
  openGraph: {
    title: 'اختر الهدية المثالية | For You - فور يو',
    description: 'أداة ذكية لاختيار أفضل هدية لأي مناسبة. جرّبها الآن!',
    url: 'https://foryo.me/gift-finder',
  },
}

export default function Page() {
  return <GiftFinderPageClient />
}
