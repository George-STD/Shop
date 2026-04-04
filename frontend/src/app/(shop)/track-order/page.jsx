import TrackOrderPageClient from './TrackOrderPageClient'
import { PAGE_METADATA } from '../../../lib/metadata'

export const metadata = {
  ...PAGE_METADATA.trackOrder,
  robots: { index: false, follow: false },
}

export default function Page() {
  return <TrackOrderPageClient />
}
