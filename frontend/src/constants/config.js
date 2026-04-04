/**
 * Site configuration constants for For You Gift Shop
 * Centralized configuration for easy maintenance
 */

// Environment-based API URL
const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    // Client-side
    return process.env.NEXT_PUBLIC_API_URL || 'https://shop-gx97.onrender.com/api';
  }
  // Server-side
  return process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://shop-gx97.onrender.com/api';
};

export const API_URL = getApiUrl();

// Site Information
export const SITE_CONFIG = {
  // URLs
  SITE_URL: 'https://foryo.me',
  API_URL: API_URL,
  
  // Site Identity
  SITE_NAME: 'For You - فور يو',
  SITE_NAME_EN: 'For You',
  SITE_NAME_AR: 'فور يو',
  SITE_TAGLINE: 'متجر الهدايا الأول في مصر',
  
  // SEO Defaults
  DEFAULT_TITLE: 'For You | فور يو - متجر الهدايا الأول في مصر | هدايا لجميع المناسبات',
  DEFAULT_DESCRIPTION: 'فور يو (For You) - متجر الهدايا الأول في مصر | تشكيلة واسعة من هدايا أعياد الميلاد، الزواج، التخرج وجميع المناسبات. شحن سريع وتغليف مجاني لكل أنحاء مصر.',
  
  // Images
  LOGO_URL: '/images/logo.jpeg',
  OG_IMAGE: '/images/logo.jpeg',
  PLACEHOLDER_IMAGE: '/images/placeholder.jpg',
  
  // Theme
  THEME_COLOR: '#a855f7',
  
  // Locale
  LOCALE: 'ar_EG',
  DIRECTION: 'rtl',
  LANGUAGE: 'ar',
};

// Business Configuration
export const BUSINESS_CONFIG = {
  // Currency
  CURRENCY: 'EGP',
  CURRENCY_SYMBOL: 'ج.م',
  CURRENCY_POSITION: 'after', // 'before' or 'after'
  
  // Shipping
  SHIPPING_COST: 60,
  FREE_SHIPPING_THRESHOLD: 500,
  
  // Contact Information
  PHONE: '+20 12 86153004',
  PHONE_RAW: '+201286153004',
  EMAIL: 'support@foryo.me',
  WHATSAPP_LINK: 'https://wa.me/201286153004',
  INSTAPAY: '01286153004',
  
  // Address
  ADDRESS: {
    CITY: 'القاهرة',
    AREA: 'المقطم',
    STREET: 'شارع 9',
    FULL: 'القاهرة، المقطم، شارع 9',
  },
  
  // Social Media
  SOCIAL: {
    FACEBOOK: 'https://www.facebook.com/share/1BzYfakvLp/?mibextid=wwXIfr',
    INSTAGRAM: 'https://www.instagram.com/foryou._.21?igsh=d3llMHFjdmE3Z25w&utm_source=qr',
    YOUTUBE: 'https://youtube.com/@foryou-l1k?si=wL0zO2sHLypUtE-p',
    TWITTER: '@foryou._.21',
  },
  
  // Working Hours
  WORKING_HOURS: 'متاحين على مدار الساعة',
};

// Pagination Defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  PRODUCTS_PER_PAGE: 12,
  ORDERS_PER_PAGE: 10,
  REVIEWS_PER_PAGE: 10,
};

// Local Storage Keys
export const STORAGE_KEYS = {
  CART: 'cart-storage',
  AUTH: 'auth-storage',
  WISHLIST: 'wishlist-storage',
  TOKEN: 'token',
};

// Routes
export const ROUTES = {
  HOME: '/',
  PRODUCTS: '/products',
  PRODUCT: '/product', // + /:slug
  CART: '/cart',
  CHECKOUT: '/checkout',
  ACCOUNT: '/account',
  WISHLIST: '/wishlist',
  GIFT_FINDER: '/gift-finder',
  TRACK_ORDER: '/track-order',
  CONTACT: '/contact',
  ABOUT: '/about',
  FAQ: '/faq',
  SHIPPING: '/shipping',
  RETURNS: '/returns',
  STORES: '/stores',
  PRIVACY: '/privacy',
  TERMS: '/terms',
  ADMIN: '/admin',
};

// SEO Keywords
export const SEO_KEYWORDS = [
  'foryo', 'for you', 'foryou', 'for you gift shop', 'foryo giftshop',
  'foryo gifts', 'foryou gifts', 'foryo egypt', 'foryou egypt',
  'foryo.me', 'for you gifts egypt', 'for you هدايا',
  'فور يو', 'فوريو', 'فور يو هدايا', 'فور يو للهدايا', 'متجر فور يو',
  'for you store', 'foryo store', 'foryou store',
  'هدايا', 'متجر هدايا', 'هدايا اون لاين', 'شراء هدايا', 'هدايا مصر',
  'هدايا عيد ميلاد', 'هدايا زواج', 'هدايا تخرج', 'هدايا خطوبة',
  'هدايا مواليد', 'هدايا رجالي', 'هدايا حريمي', 'هدايا اطفال',
  'gift shop egypt', 'gifts egypt', 'online gift shop egypt',
  'هدايا فالنتاين', 'هدايا عيد الام', 'تغليف هدايا', 'توصيل هدايا',
  'هدايا اونلاين مصر', 'أفضل متجر هدايا',
];

// Social Media Links (for structured data)
export const SOCIAL_LINKS = {
  FACEBOOK: 'https://www.facebook.com/share/1BzYfakvLp/?mibextid=wwXIfr',
  INSTAGRAM: 'https://www.instagram.com/foryou._.21',
  YOUTUBE: 'https://www.youtube.com/@foryou-l1k',
};

export default SITE_CONFIG;
