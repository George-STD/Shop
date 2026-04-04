import AboutPageClient from './AboutPageClient'
import { PAGE_METADATA } from '../../../lib/metadata'

export const metadata = PAGE_METADATA.about

export default function Page() {
  return <AboutPageClient />
}
