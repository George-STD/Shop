/**
 * Shared helper utilities used across multiple controllers.
 */

/**
 * Escape regex special characters to prevent ReDoS attacks.
 * @param {string} str - Raw user input
 * @returns {string} Escaped string safe for use in RegExp
 */
const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Normalize Arabic text by stripping tashkeel/tatweel and unifying common letter variants.
 * @param {string} str
 * @returns {string}
 */
const normalizeArabicText = (str) =>
  String(str || '')
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .trim();

/**
 * Build a safe, case-insensitive regex pattern string that matches Arabic character equivalence classes
 * (أ/إ/آ/ا, ة/ه, ى/ي/ئ, ؤ/و) and ignores optional diacritics.
 * @param {string} str - Raw user search token
 * @returns {string} Regex pattern string
 */
const buildArabicSearchRegex = (str) => {
  const cleaned = String(str || '')
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .trim();
  const escaped = escapeRegex(cleaned);
  return escaped
    .replace(/[أإآا]/g, '[أإآا]')
    .replace(/[ةه]/g, '[ةه]')
    .replace(/[ىيئ]/g, '[ىيئ]')
    .replace(/[ؤو]/g, '[ؤو]');
};

/**
 * Parse pagination query params with sensible defaults.
 * @param {Object}  query            - Express req.query
 * @param {number} [defaultLimit=20] - Default items per page
 * @returns {{ page: number, limit: number, skip: number }}
 */
const parsePagination = (query, defaultLimit = 20) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(Math.max(1, parseInt(query.limit, 10) || defaultLimit), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

/**
 * Build a paginated JSON response envelope.
 * @param {{ page: number, limit: number, total: number }} opts
 * @returns {{ current: number, pages: number, total: number, limit: number }}
 */
const buildPaginationMeta = ({ page, limit, total }) => ({
  current: page,
  pages: Math.ceil(total / limit),
  total,
  limit,
});

/**
 * Safe fetch wrapper with timeout via AbortSignal.timeout
 * @param {string} url - Request target URL
 * @param {Object} [options={}] - Standard fetch options
 * @param {number} [timeoutMs=8000] - Request timeout in milliseconds
 * @returns {Promise<Response>}
 */
const fetchWithTimeout = async (url, options = {}, timeoutMs = 8000) => {
  const signal = options.signal || AbortSignal.timeout(timeoutMs);
  return fetch(url, { ...options, signal });
};

module.exports = {
  escapeRegex,
  normalizeArabicText,
  buildArabicSearchRegex,
  parsePagination,
  buildPaginationMeta,
  fetchWithTimeout,
};

