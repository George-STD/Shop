import { cache } from 'react';
import { API_URL } from '../constants';

const fetchJsonWithTimeout = async (url, revalidateSeconds = 300, timeoutMs = 4000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      next: { revalidate: revalidateSeconds },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
};

/**
 * Server-Side Homepage Catalog Prefetcher (ISR 300s + Request Deduplication)
 * Delivers pre-rendered HTML for Featured, Bestsellers, New Arrivals, Ready Boxes, Categories, and Occasions.
 */
export const getInitialHomeCatalog = cache(async () => {
  const [featuredRes, bestsellersRes, newRes, readyBoxesRes, categoriesRes, occasionsRes] =
    await Promise.all([
      fetchJsonWithTimeout(`${API_URL}/products/featured?limit=8`, 300),
      fetchJsonWithTimeout(`${API_URL}/products/bestsellers?limit=8`, 300),
      fetchJsonWithTimeout(`${API_URL}/products/new?limit=8`, 300),
      fetchJsonWithTimeout(`${API_URL}/products?isReadyBox=true&limit=8`, 300),
      fetchJsonWithTimeout(`${API_URL}/categories`, 600),
      fetchJsonWithTimeout(`${API_URL}/occasions`, 600),
    ]);

  return {
    featuredProducts: Array.isArray(featuredRes?.data) && featuredRes.data.length > 0 ? featuredRes.data : undefined,
    bestsellers: Array.isArray(bestsellersRes?.data) && bestsellersRes.data.length > 0 ? bestsellersRes.data : undefined,
    newArrivals: Array.isArray(newRes?.data) && newRes.data.length > 0 ? newRes.data : undefined,
    readyBoxes: Array.isArray(readyBoxesRes?.data) && readyBoxesRes.data.length > 0 ? readyBoxesRes.data : undefined,
    categories: Array.isArray(categoriesRes?.data) && categoriesRes.data.length > 0 ? categoriesRes.data : undefined,
    occasions: Array.isArray(occasionsRes?.data) && occasionsRes.data.length > 0 ? occasionsRes.data : undefined,
  };
});

/**
 * Server-Side Products Catalog Prefetcher (ISR 300s)
 */
export const getInitialProductsCatalog = cache(async () => {
  const [productsRes, categoriesRes, occasionsRes] = await Promise.all([
    fetchJsonWithTimeout(`${API_URL}/products?page=1&sort=newest`, 300),
    fetchJsonWithTimeout(`${API_URL}/categories`, 600),
    fetchJsonWithTimeout(`${API_URL}/occasions`, 600),
  ]);

  return {
    productsData: Array.isArray(productsRes?.data) && productsRes.data.length > 0 ? productsRes : undefined,
    categories: Array.isArray(categoriesRes?.data) && categoriesRes.data.length > 0 ? categoriesRes.data : undefined,
    occasions: Array.isArray(occasionsRes?.data) && occasionsRes.data.length > 0 ? occasionsRes.data : undefined,
  };
});
