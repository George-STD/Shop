import ReturnsPageClient from './ReturnsPageClient'

export const metadata = {
  title: 'سياسة الإرجاع والاستبدال',
  description: 'سياسة الإرجاع والاستبدال في فور يو (For You). إرجاع سهل خلال 14 يوم من استلام الطلب. رضاك هو أولويتنا.',
  alternates: { canonical: 'https://foryo.me/returns' },
  openGraph: {
    title: 'سياسة الإرجاع | For You - فور يو',
    description: 'إرجاع سهل خلال 14 يوم من استلام الطلب.',
    url: 'https://foryo.me/returns',
  },
}

export default function Page() {
  return <ReturnsPageClient />
}
