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
 * Parse pagination query params with sensible defaults.
 * @param {Object}  query            - Express req.query
 * @param {number} [defaultLimit=20] - Default items per page
 * @returns {{ page: number, limit: number, skip: number }}
 */
const parsePagination = (query, defaultLimit = 20) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.max(1, parseInt(query.limit, 10) || defaultLimit);
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

module.exports = {
  escapeRegex,
  parsePagination,
  buildPaginationMeta,
};
