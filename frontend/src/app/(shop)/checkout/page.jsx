import CheckoutPageClient from './CheckoutPageClient'

export const metadata = {
  title: 'إتمام الطلب',
  description: 'أتمم طلبك بأمان من متجر فور يو للهدايا.',
  robots: { index: false, follow: false },
}

export default function Page() {
  return <CheckoutPageClient />
}
