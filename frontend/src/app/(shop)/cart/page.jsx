import CartPageClient from './CartPageClient'

export const metadata = {
  title: 'سلة التسوق',
  description: 'راجع المنتجات في سلة التسوق وأتمم عملية الشراء.',
  robots: { index: false, follow: false },
}

export default function Page() {
  return <CartPageClient />
}
