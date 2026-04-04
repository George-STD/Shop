import ReturnsPageClient from './ReturnsPageClient'
import { PAGE_METADATA } from '../../../lib/metadata'

export const metadata = PAGE_METADATA.returns

export default function Page() {
  return <ReturnsPageClient />
}
