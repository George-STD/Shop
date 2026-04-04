import ContactPageClient from './ContactPageClient'
import { PAGE_METADATA } from '../../../lib/metadata'

export const metadata = PAGE_METADATA.contact

export default function Page() {
  return <ContactPageClient />
}
