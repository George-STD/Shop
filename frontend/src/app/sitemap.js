import { API_BASE_URL } from '../constants';
import { SITE_CONFIG } from '../constants/config';

// Generate sitemap dynamically on each request, not at build time
export const revalidate = 86400; // Cache for 24 hours

export default async function sitemap() {
  const baseUrl = SITE_CONFIG.SITE_URL;

  // Static pages
  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/gift-finder`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    { url: `${baseUrl}/faq`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    {
      url: `${baseUrl}/shipping`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/returns`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/stores`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ];

  // Dynamic product pages (paginated up to 2,000 products to cover full catalog)
  let productPages = [];
  try {
    const MAX_PAGES = 20;
    for (let page = 1; page <= MAX_PAGES; page++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`${API_BASE_URL}/products?limit=100&page=${page}`, {
        signal: controller.signal,
        next: { revalidate: 86400 },
      }).catch(() => null);
      clearTimeout(timeoutId);

      if (!res || !res.ok) break;
      const data = await res.json().catch(() => ({}));
      const products = data.data || [];
      if (products.length === 0) break;

      productPages.push(
        ...products.map((product) => ({
          url: `${baseUrl}/product/${product.slug}`,
          lastModified: new Date(product.updatedAt || product.createdAt),
          changeFrequency: 'weekly',
          priority: 0.8,
        }))
      );

      if (products.length < 100) break;
    }
  } catch (error) {
    console.error('Sitemap: Error fetching products:', error.message);
  }

  // Dynamic category pages
  let categoryPages = [];
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${API_BASE_URL}/categories`, { signal: controller.signal, next: { revalidate: 86400 } }).catch(() => null);
    clearTimeout(timeoutId);
    if (res && res.ok) {
      const data = await res.json().catch(() => ({}));
      const categories = data.data || [];
      categoryPages = categories.map((cat) => ({
        url: `${baseUrl}/products?category=${cat.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      }));
    }
  } catch (_) {}

  return [...staticPages, ...categoryPages, ...productPages];
}
