import ProductsPageClient from './ProductsPageClient'
import { PAGE_METADATA } from '../../../lib/metadata'

export const metadata = PAGE_METADATA.products

export default function Page() {
  return <ProductsPageClient />
}
