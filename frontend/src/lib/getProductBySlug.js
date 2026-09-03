import { cache } from 'react';
import { API_URL } from '../constants';

/**
 * Server-Side Product Fetcher with Request-Level Deduplication (React cache)
 * and cold-start timeout safeguard (8s AbortController).
 */
export const getProductBySlug = cache(async (slug) => {
  if (!slug) return { error: true };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(`${API_URL}/products/slug/${slug}`, {
      next: { revalidate: 3600 },
      signal: controller.signal,
    });

    if (res.status === 404) {
      return { notFound: true };
    }
    if (!res.ok) {
      return { error: true };
    }

    const data = await res.json();
    return { product: data.data };
  } catch {
    // Network error or timeout during cold start
    return { error: true, coldStart: true };
  } finally {
    clearTimeout(timeoutId);
  }
});
