/**
 * Centralized configuration constants for the Gift Shop API
 * All configurable values should be defined here
 */

const CONFIG = {
  // =====================================================
  // CORS SETTINGS
  // =====================================================
  CORS: {
    ALLOWED_ORIGINS: process.env.CORS_ORIGINS 
      ? process.env.CORS_ORIGINS.split(',') 
      : ['https://www.foryo.me', 'https://foryo.me'],
    METHODS: ['GET', 'POST', 'PUT', 'DELETE'],
    CREDENTIALS: true,
  },

  // =====================================================
  // RATE LIMITING
  // =====================================================
  RATE_LIMIT: {
    API: {
      WINDOW_MS: 15 * 60 * 1000, // 15 minutes
      MAX_REQUESTS: 100,
    },
    ADMIN: {
      WINDOW_MS: 15 * 60 * 1000, // 15 minutes
      MAX_REQUESTS: 50,
    },
    LOGIN: {
      WINDOW_MS: 60 * 60 * 1000, // 1 hour
      MAX_REQUESTS: 5,
    },
    VERIFY: {
      WINDOW_MS: 15 * 60 * 1000, // 15 minutes
      MAX_REQUESTS: 5,
    },
    REGISTER: {
      WINDOW_MS: 60 * 60 * 1000, // 1 hour
      MAX_REQUESTS: 5,
    },
  },

  // =====================================================
  // AUTHENTICATION
  // =====================================================
  AUTH: {
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    BCRYPT_SALT_ROUNDS: 12,
    VERIFICATION_CODE_LENGTH: 6,
    VERIFICATION_CODE_EXPIRY_MS: 10 * 60 * 1000, // 10 minutes
    PASSWORD_RESET_EXPIRY_MS: 10 * 60 * 1000, // 10 minutes
  },

  // =====================================================
  // PAGINATION
  // =====================================================
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 12,
    MAX_LIMIT: 100,
    PRODUCTS_LIMIT: 12,
    ORDERS_LIMIT: 10,
    REVIEWS_LIMIT: 10,
    USERS_LIMIT: 20,
  },

  // =====================================================
  // BUSINESS RULES
  // =====================================================
  BUSINESS: {
    SHIPPING_COST_EGP: Number(process.env.SHIPPING_COST) || 60,
    FREE_SHIPPING_THRESHOLD_EGP: Number(process.env.FREE_SHIPPING_THRESHOLD) || 500,
    CURRENCY: 'EGP',
    CURRENCY_SYMBOL: 'ج.م',
  },

  // =====================================================
  // ORDER STATUSES
  // =====================================================
  ORDER_STATUS: {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PROCESSING: 'processing',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
  },

  // Statuses array for validation
  ORDER_STATUSES: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],

  // =====================================================
  // ALLOWED ORDER STATUSES FOR CANCELLATION
  // =====================================================
  CANCELLABLE_STATUSES: ['pending', 'confirmed'],

  // =====================================================
  // PAYMENT METHODS
  // =====================================================
  PAYMENT_METHOD: {
    COD: 'cod',
    INSTAPAY: 'instapay',
  },

  PAYMENT_METHODS: ['cod', 'instapay'],

  // =====================================================
  // USER ROLES
  // =====================================================
  USER_ROLE: {
    CUSTOMER: 'customer',
    ADMIN: 'admin',
  },

  USER_ROLES: ['customer', 'admin'],

  // =====================================================
  // RECIPIENTS (Gift recipients)
  // =====================================================
  RECIPIENTS: [
    'زوجة',
    'زوج',
    'أم',
    'أب',
    'أخت',
    'أخ',
    'صديقة',
    'صديق',
    'أطفال',
    'عروسين',
  ],

  // =====================================================
  // BUDGET RANGES
  // =====================================================
  BUDGET_RANGES: [
    'under-100',
    '100-300',
    '300-500',
    '500-1000',
    'above-1000',
  ],

  // =====================================================
  // FEATURED PRODUCTS LIMITS
  // =====================================================
  LIMITS: {
    FEATURED_PRODUCTS: 8,
    BESTSELLER_PRODUCTS: 8,
    NEW_ARRIVALS: 8,
    RELATED_PRODUCTS: 4,
    SEARCH_SUGGESTIONS: 5,
    BY_OCCASION: 12,
    BY_RECIPIENT: 12,
    SITEMAP_PRODUCTS: 1000,
  },

  // =====================================================
  // VALIDATION PATTERNS
  // =====================================================
  PATTERNS: {
    MONGODB_ID: /^[0-9a-fA-F]{24}$/,
    PHONE_EG: /^(\+?20)?[0-9]{10,11}$/,
  },

  // =====================================================
  // VALIDATION LIMITS
  // =====================================================
  VALIDATION: {
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 50,
    PASSWORD_MIN_LENGTH: 6,
    VERIFICATION_CODE_LENGTH: 6,
    REVIEW_MIN_LENGTH: 10,
    REVIEW_MAX_LENGTH: 1000,
  },

  // =====================================================
  // TIMEOUTS
  // =====================================================
  TIMEOUTS: {
    SITEMAP_FETCH_MS: 10000,
    EMAIL_SEND_MS: 30000,
  },
};

module.exports = CONFIG;
