/**
 * API Constants and Endpoints for For You Gift Shop
 */

// API Base URL - configurable via environment variable
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://shop-gx97.onrender.com/api';

// API Endpoints
export const ENDPOINTS = {
  // Health
  HEALTH: '/health',
  
  // Auth
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    VERIFY_EMAIL: '/auth/verify-email',
    RESEND_CODE: '/auth/resend-code',
    FORGOT_PASSWORD: '/auth/forgot-password',
    VERIFY_RESET_CODE: '/auth/verify-reset-code',
    RESET_PASSWORD: '/auth/reset-password',
    ME: '/auth/me',
    UPDATE_PROFILE: '/auth/update-profile',
    CHANGE_PASSWORD: '/auth/change-password',
    WISHLIST: '/auth/wishlist', // + /:productId
  },
  
  // Products
  PRODUCTS: {
    BASE: '/products',
    FEATURED: '/products/featured',
    BESTSELLERS: '/products/bestsellers',
    NEW: '/products/new',
    BY_SLUG: '/products/slug', // + /:slug
    BY_OCCASION: '/products/by-occasion', // + /:occasion
    BY_RECIPIENT: '/products/by-recipient', // + /:recipient
    RELATED: '/related', // /products/:id/related
  },
  
  // Categories
  CATEGORIES: {
    BASE: '/categories',
    TREE: '/categories/tree',
    MAIN: '/categories/main',
    BY_SLUG: '/categories/slug', // + /:slug
    SUBCATEGORIES: '/subcategories', // /categories/:id/subcategories
  },
  
  // Orders
  ORDERS: {
    BASE: '/orders',
    TRACK: '/orders/track', // + /:orderNumber
    CANCEL: '/cancel', // /orders/:id/cancel
  },
  
  // Reviews
  REVIEWS: {
    BASE: '/reviews',
    BY_PRODUCT: '/reviews/product', // + /:productId
    HELPFUL: '/helpful', // /reviews/:id/helpful
  },
  
  // Occasions
  OCCASIONS: {
    BASE: '/occasions',
  },
  
  // Admin
  ADMIN: {
    BASE: '/admin',
    STATS: '/admin/stats',
    USERS: '/admin/users',
    PRODUCTS: '/admin/products',
    ORDERS: '/admin/orders',
    CATEGORIES: '/admin/categories',
    REVIEWS: '/admin/reviews',
    OCCASIONS: '/admin/occasions',
    EMAILS: '/admin/emails',
  },
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
};

// Request Defaults
export const REQUEST_DEFAULTS = {
  TIMEOUT: 30000, // 30 seconds
  HEADERS: {
    'Content-Type': 'application/json',
  },
};

// Query Params Defaults
export const QUERY_DEFAULTS = {
  PRODUCTS_LIMIT: 12,
  FEATURED_LIMIT: 8,
  BESTSELLERS_LIMIT: 8,
  NEW_ARRIVALS_LIMIT: 8,
  RELATED_LIMIT: 4,
  BY_OCCASION_LIMIT: 12,
  BY_RECIPIENT_LIMIT: 12,
};

export default ENDPOINTS;
