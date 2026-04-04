import TermsPageClient from './TermsPageClient'
import { PAGE_METADATA } from '../../../lib/metadata'

export const metadata = PAGE_METADATA.terms

export default function Page() {
  return <TermsPageClient />
}
