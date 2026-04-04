import ShippingPageClient from './ShippingPageClient'
import { PAGE_METADATA } from '../../../lib/metadata'

export const metadata = PAGE_METADATA.shipping

export default function Page() {
  return <ShippingPageClient />
}
