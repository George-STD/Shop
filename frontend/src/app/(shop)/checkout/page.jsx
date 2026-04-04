import CheckoutPageClient from './CheckoutPageClient'
import { PAGE_METADATA } from '../../../lib/metadata'

export const metadata = {
  ...PAGE_METADATA.checkout,
  robots: { index: false, follow: false },
}

export default function Page() {
  return <CheckoutPageClient />
}
