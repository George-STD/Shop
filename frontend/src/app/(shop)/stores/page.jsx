import StoresPageClient from './StoresPageClient'
import { PAGE_METADATA } from '../../../lib/metadata'

export const metadata = PAGE_METADATA.stores

export default function Page() {
  return <StoresPageClient />
}
