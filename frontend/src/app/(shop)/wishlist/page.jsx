import WishlistPageClient from './WishlistPageClient'
import { PAGE_METADATA } from '../../../lib/metadata'

export const metadata = {
  ...PAGE_METADATA.wishlist,
  robots: { index: false, follow: false },
}

export default function Page() {
  return <WishlistPageClient />
}
