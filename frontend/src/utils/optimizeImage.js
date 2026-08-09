/**
 * Cloudinary Image URL Optimizer
 * Automatically applies f_auto (WebP/AVIF), q_auto (smart quality),
 * and responsive width to any Cloudinary URL for massive bandwidth savings.
 *
 * Example:
 *   Input:  https://res.cloudinary.com/xxx/image/upload/v123/img.png
 *   Output: https://res.cloudinary.com/xxx/image/upload/f_auto,q_auto,w_400/v123/img.png
 */

const CLOUDINARY_REGEX = /^(https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(v\d+\/.+)$/;

/**
 * Optimize a Cloudinary image URL with auto-format, auto-quality, and width.
 * Non-Cloudinary URLs are returned unchanged.
 *
 * @param {string} url - The original image URL
 * @param {number} [width=400] - Desired display width in pixels
 * @returns {string} Optimized URL
 */
export function optimizeCloudinaryUrl(url, width = 400) {
  if (!url || typeof url !== 'string') return url;

  const match = url.match(CLOUDINARY_REGEX);
  if (!match) return url;

  const [, base, path] = match;
  return `${base}f_auto,q_auto,w_${width}/${path}`;
}
