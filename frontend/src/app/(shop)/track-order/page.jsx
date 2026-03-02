import TrackOrderPageClient from './TrackOrderPageClient'

export const metadata = {
  title: 'تتبع الطلب',
  description: 'تتبع حالة طلبك من متجر فور يو للهدايا.',
  robots: { index: false, follow: false },
}

export default function Page() {
  return <TrackOrderPageClient />
}
