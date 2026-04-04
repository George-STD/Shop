import GiftFinderPageClient from './GiftFinderPageClient'
import { PAGE_METADATA } from '../../../lib/metadata'

export const metadata = PAGE_METADATA.giftFinder

export default function Page() {
  return <GiftFinderPageClient />
}
