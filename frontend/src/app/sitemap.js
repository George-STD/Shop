import { API_BASE_URL, QUERY_DEFAULTS } from '../constants'
import { SITE_CONFIG } from '../constants/config'

// Generate sitemap dynamically on each request, not at build time
export const dynamic = 'force-dynamic'
export const revalidate = 3600 // Cache for 1 hour

export default async function sitemap() {
  const baseUrl = SITE_CONFIG.SITE_URL

  // Static pages
  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/products`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/gift-finder`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/faq`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/shipping`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/returns`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/stores`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ]

  // Dynamic product pages
  let productPages = []
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    const res = await fetch(`${API_BASE_URL}/products?limit=1000`, { signal: controller.signal })
    clearTimeout(timeoutId)
    if (res.ok) {
      const data = await res.json()
      const products = data.data || []
      productPages = products.map((product) => ({
        url: `${baseUrl}/product/${product.slug}`,
        lastModified: new Date(product.updatedAt || product.createdAt),
        changeFrequency: 'weekly',
        priority: 0.8,
      }))
    }
  } catch (error) {
    console.error('Sitemap: Error fetching products:', error.message)
  }

  // Dynamic category pages
  let categoryPages = []
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    const res = await fetch(`${API_BASE_URL}/categories`, { signal: controller.signal })
    clearTimeout(timeoutId)
    if (res.ok) {
      const data = await res.json()
      const categories = data.data || []
      categoryPages = categories.map((category) => ({
        url: `${baseUrl}/products?category=${category.slug}`,
        lastModified: new Date(category.updatedAt || category.createdAt),
        changeFrequency: 'weekly',
        priority: 0.7,
      }))
    }
  } catch (error) {
    console.error('Sitemap: Error fetching categories:', error.message)
  }

  // Dynamic occasion pages
  let occasionPages = []
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    const res = await fetch(`${API_BASE_URL}/occasions`, { signal: controller.signal })
    clearTimeout(timeoutId)
    if (res.ok) {
      const data = await res.json()
      const occasions = data.data || []
      occasionPages = occasions.map((occasion) => ({
        url: `${baseUrl}/products?occasion=${occasion._id}`,
        lastModified: new Date(occasion.updatedAt || occasion.createdAt),
        changeFrequency: 'weekly',
        priority: 0.7,
      }))
    }
  } catch (error) {
    console.error('Sitemap: Error fetching occasions:', error.message)
  }

  return [...staticPages, ...productPages, ...categoryPages, ...occasionPages]
}
