/**
 * Analytics utility for tracking user events
 * Can be extended to integrate with Google Analytics, Facebook Pixel, etc.
 */

import { SITE_CONFIG } from '../constants'

// Event categories
export const EVENT_CATEGORIES = {
  PRODUCT: 'product',
  CART: 'cart',
  CHECKOUT: 'checkout',
  USER: 'user',
  NAVIGATION: 'navigation',
  SEARCH: 'search',
  WISHLIST: 'wishlist',
  ENGAGEMENT: 'engagement',
}

// Event actions
export const EVENT_ACTIONS = {
  // Product events
  VIEW_PRODUCT: 'view_product',
  VIEW_CATEGORY: 'view_category',
  
  // Cart events
  ADD_TO_CART: 'add_to_cart',
  REMOVE_FROM_CART: 'remove_from_cart',
  UPDATE_CART_QUANTITY: 'update_cart_quantity',
  VIEW_CART: 'view_cart',
  
  // Checkout events
  BEGIN_CHECKOUT: 'begin_checkout',
  ADD_SHIPPING_INFO: 'add_shipping_info',
  PURCHASE: 'purchase',
  
  // User events
  SIGN_UP: 'sign_up',
  LOGIN: 'login',
  LOGOUT: 'logout',
  
  // Search events
  SEARCH: 'search',
  FILTER: 'filter',
  SORT: 'sort',
  
  // Wishlist events
  ADD_TO_WISHLIST: 'add_to_wishlist',
  REMOVE_FROM_WISHLIST: 'remove_from_wishlist',
  
  // Engagement events
  SHARE: 'share',
  CONTACT: 'contact',
  CLICK_SOCIAL: 'click_social',
}

/**
 * Check if analytics is enabled and available
 */
const isAnalyticsEnabled = () => {
  // Check for Google Analytics
  if (typeof window !== 'undefined') {
    return typeof window.gtag === 'function' || typeof window.dataLayer !== 'undefined'
  }
  return false
}

/**
 * Track a custom event
 * @param {string} action - Event action name
 * @param {string} category - Event category
 * @param {object} data - Additional event data
 */
export const trackEvent = (action, category, data = {}) => {
  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics]', { action, category, ...data })
  }

  // Send to Google Analytics 4 if available
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', action, {
      event_category: category,
      ...data,
    })
  }

  // Add other analytics providers here (Facebook Pixel, etc.)
}

/**
 * Track page view
 * @param {string} pagePath - Page path
 * @param {string} pageTitle - Page title
 */
export const trackPageView = (pagePath, pageTitle) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics] Page View:', { pagePath, pageTitle })
  }

  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', 'page_view', {
      page_path: pagePath,
      page_title: pageTitle,
    })
  }
}

// ==================== E-commerce Tracking ====================

/**
 * Track product view
 */
export const trackProductView = (product) => {
  trackEvent(EVENT_ACTIONS.VIEW_PRODUCT, EVENT_CATEGORIES.PRODUCT, {
    item_id: product._id || product.id,
    item_name: product.name,
    item_category: product.category?.name || product.category,
    price: product.price,
    currency: 'EGP',
  })
}

/**
 * Track add to cart
 */
export const trackAddToCart = (product, quantity = 1) => {
  trackEvent(EVENT_ACTIONS.ADD_TO_CART, EVENT_CATEGORIES.CART, {
    item_id: product._id || product.id,
    item_name: product.name,
    item_category: product.category?.name || product.category,
    price: product.price,
    quantity,
    currency: 'EGP',
    value: product.price * quantity,
  })
}

/**
 * Track remove from cart
 */
export const trackRemoveFromCart = (product, quantity = 1) => {
  trackEvent(EVENT_ACTIONS.REMOVE_FROM_CART, EVENT_CATEGORIES.CART, {
    item_id: product._id || product.id,
    item_name: product.name,
    price: product.price,
    quantity,
    currency: 'EGP',
  })
}

/**
 * Track begin checkout
 */
export const trackBeginCheckout = (cartItems, totalValue) => {
  const items = cartItems.map(item => ({
    item_id: item._id || item.id,
    item_name: item.name,
    price: item.price,
    quantity: item.quantity,
  }))

  trackEvent(EVENT_ACTIONS.BEGIN_CHECKOUT, EVENT_CATEGORIES.CHECKOUT, {
    items,
    value: totalValue,
    currency: 'EGP',
  })
}

/**
 * Track purchase completion
 */
export const trackPurchase = (orderId, items, totalValue, shippingCost) => {
  trackEvent(EVENT_ACTIONS.PURCHASE, EVENT_CATEGORIES.CHECKOUT, {
    transaction_id: orderId,
    value: totalValue,
    currency: 'EGP',
    shipping: shippingCost,
    items: items.map(item => ({
      item_id: item._id || item.id,
      item_name: item.name,
      price: item.price,
      quantity: item.quantity,
    })),
  })
}

// ==================== Search Tracking ====================

/**
 * Track search query
 */
export const trackSearch = (searchTerm, resultsCount) => {
  trackEvent(EVENT_ACTIONS.SEARCH, EVENT_CATEGORIES.SEARCH, {
    search_term: searchTerm,
    results_count: resultsCount,
  })
}

/**
 * Track filter usage
 */
export const trackFilter = (filterType, filterValue) => {
  trackEvent(EVENT_ACTIONS.FILTER, EVENT_CATEGORIES.SEARCH, {
    filter_type: filterType,
    filter_value: filterValue,
  })
}

// ==================== User Tracking ====================

/**
 * Track user signup
 */
export const trackSignUp = (method = 'email') => {
  trackEvent(EVENT_ACTIONS.SIGN_UP, EVENT_CATEGORIES.USER, {
    method,
  })
}

/**
 * Track user login
 */
export const trackLogin = (method = 'email') => {
  trackEvent(EVENT_ACTIONS.LOGIN, EVENT_CATEGORIES.USER, {
    method,
  })
}

// ==================== Wishlist Tracking ====================

/**
 * Track add to wishlist
 */
export const trackAddToWishlist = (product) => {
  trackEvent(EVENT_ACTIONS.ADD_TO_WISHLIST, EVENT_CATEGORIES.WISHLIST, {
    item_id: product._id || product.id,
    item_name: product.name,
    price: product.price,
    currency: 'EGP',
  })
}

// ==================== Engagement Tracking ====================

/**
 * Track social link click
 */
export const trackSocialClick = (platform) => {
  trackEvent(EVENT_ACTIONS.CLICK_SOCIAL, EVENT_CATEGORIES.ENGAGEMENT, {
    social_platform: platform,
  })
}

/**
 * Track share action
 */
export const trackShare = (contentType, contentId, method) => {
  trackEvent(EVENT_ACTIONS.SHARE, EVENT_CATEGORIES.ENGAGEMENT, {
    content_type: contentType,
    content_id: contentId,
    method,
  })
}

/**
 * Track contact action
 */
export const trackContact = (method) => {
  trackEvent(EVENT_ACTIONS.CONTACT, EVENT_CATEGORIES.ENGAGEMENT, {
    contact_method: method,
  })
}

export default {
  trackEvent,
  trackPageView,
  trackProductView,
  trackAddToCart,
  trackRemoveFromCart,
  trackBeginCheckout,
  trackPurchase,
  trackSearch,
  trackFilter,
  trackSignUp,
  trackLogin,
  trackAddToWishlist,
  trackSocialClick,
  trackShare,
  trackContact,
  EVENT_CATEGORIES,
  EVENT_ACTIONS,
}
