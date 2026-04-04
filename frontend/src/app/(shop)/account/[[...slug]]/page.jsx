import AccountPageClient from './AccountPageClient'
import { PAGE_METADATA } from '../../../../lib/metadata'

export const metadata = {
  ...PAGE_METADATA.account,
  robots: { index: false, follow: false },
}

export default function Page() {
  return <AccountPageClient />
}
