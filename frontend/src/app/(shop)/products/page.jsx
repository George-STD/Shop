import ProductsPageClient from './ProductsPageClient';
import { PAGE_METADATA } from '../../../lib/metadata';
import { getInitialProductsCatalog } from '../../../lib/serverCatalog';

export const revalidate = 300;
export const metadata = PAGE_METADATA.products;

export default async function Page() {
  const initialData = await getInitialProductsCatalog();
  return <ProductsPageClient initialData={initialData} />;
}
