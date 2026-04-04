import PrivacyPageClient from './PrivacyPageClient'
import { PAGE_METADATA } from '../../../lib/metadata'

export const metadata = PAGE_METADATA.privacy

export default function Page() {
  return <PrivacyPageClient />
}
