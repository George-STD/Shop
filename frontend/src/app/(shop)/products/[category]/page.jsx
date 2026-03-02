import { redirect } from 'next/navigation'

// Redirect old /products/CATEGORY URLs to /products?category=CATEGORY
export default async function Page({ params }) {
  const { category } = await params
  redirect(`/products?category=${encodeURIComponent(category)}`)
}
