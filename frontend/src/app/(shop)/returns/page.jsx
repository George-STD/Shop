import ReturnsPageClient from './ReturnsPageClient'

export const metadata = {
  title: 'سياسة الإرجاع والاستبدال',
  description: 'تعرف على سياسة الإرجاع والاستبدال في فور يو. إرجاع سهل خلال 14 يوم من استلام الطلب.',
  alternates: {
    canonical: 'https://foryo.me/returns',
  },
}

export default function Page() {
  return <ReturnsPageClient />
}
