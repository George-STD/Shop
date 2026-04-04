import CartPageClient from './CartPageClient'
import { PAGE_METADATA } from '../../../lib/metadata'

export const metadata = {
  ...PAGE_METADATA.cart,
  robots: { index: false, follow: false },
}

export default function Page() {
  return <CartPageClient />
}
