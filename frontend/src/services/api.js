import axios from 'axios'
import { API_BASE_URL, QUERY_DEFAULTS, ROUTES } from '../constants'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = ROUTES.ACCOUNT
    }
    return Promise.reject(error)
  }
)

// Products API
export const productsAPI = {
  getAll: (params) => api.get('/products', { params }),
  getFeatured: (limit = QUERY_DEFAULTS.FEATURED_LIMIT) => api.get('/products/featured', { params: { limit } }),
  getBestsellers: (limit = QUERY_DEFAULTS.BESTSELLERS_LIMIT) => api.get('/products/bestsellers', { params: { limit } }),
  getNew: (limit = QUERY_DEFAULTS.NEW_ARRIVALS_LIMIT) => api.get('/products/new', { params: { limit } }),
  getBySlug: (slug) => api.get(`/products/slug/${slug}`),
  getById: (id) => api.get(`/products/${id}`),
  getRelated: (id) => api.get(`/products/${id}/related`),
  getByOccasion: (occasion, limit = QUERY_DEFAULTS.BY_OCCASION_LIMIT) => api.get(`/products/by-occasion/${occasion}`, { params: { limit } }),
  getByRecipient: (recipient, limit = QUERY_DEFAULTS.BY_RECIPIENT_LIMIT) => api.get(`/products/by-recipient/${recipient}`, { params: { limit } }),
}

// Categories API
export const categoriesAPI = {
  getAll: () => api.get('/categories'),
  getTree: () => api.get('/categories/tree'),
  getMain: () => api.get('/categories/main'),
  getBySlug: (slug) => api.get(`/categories/slug/${slug}`),
  getById: (id) => api.get(`/categories/${id}`),
  getSubcategories: (id) => api.get(`/categories/${id}/subcategories`),
}

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  verifyEmail: (data) => api.post('/auth/verify-email', data),
  resendCode: (data) => api.post('/auth/resend-code', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  verifyResetCode: (data) => api.post('/auth/verify-reset-code', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/update-profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  addToWishlist: (productId) => api.post(`/auth/wishlist/${productId}`),
  removeFromWishlist: (productId) => api.delete(`/auth/wishlist/${productId}`),
}

// Orders API
export const ordersAPI = {
  create: (data) => api.post('/orders', data),
  getAll: (params) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  track: (orderNumber) => api.get(`/orders/track/${orderNumber}`),
  cancel: (id, reason) => api.put(`/orders/${id}/cancel`, { reason }),
}

// Reviews API
export const reviewsAPI = {
  getByProduct: (productId, params) => api.get(`/reviews/product/${productId}`, { params }),
  create: (data) => api.post('/reviews', data),
  update: (id, data) => api.put(`/reviews/${id}`, data),
  delete: (id) => api.delete(`/reviews/${id}`),
  markHelpful: (id) => api.post(`/reviews/${id}/helpful`),
}

// Occasions API
export const occasionsAPI = {
  getAll: () => api.get('/occasions'),
}

// Admin API
export const adminAPI = {
  // Dashboard
  getStats: () => api.get('/admin/stats'),
  
  // Users
  getUsers: (params) => api.get('/admin/users', { params }),
  getUser: (id) => api.get(`/admin/users/${id}`),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  
  // Products
  createProduct: (data) => api.post('/admin/products', data),
  updateProduct: (id, data) => api.put(`/admin/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/admin/products/${id}`),
  
  // Orders
  getOrders: (params) => api.get('/admin/orders', { params }),
  getOrder: (id) => api.get(`/admin/orders/${id}`),
  updateOrderStatus: (id, data) => api.put(`/admin/orders/${id}/status`, data),
  
  // Categories
  createCategory: (data) => api.post('/admin/categories', data),
  updateCategory: (id, data) => api.put(`/admin/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/admin/categories/${id}`),
  
  // Reviews
  getReviews: (params) => api.get('/admin/reviews', { params }),
  approveReview: (id, isApproved) => api.put(`/admin/reviews/${id}/approve`, { isApproved }),
  deleteReview: (id) => api.delete(`/admin/reviews/${id}`),
  
  // Occasions
  getOccasions: () => api.get('/admin/occasions'),
  createOccasion: (data) => api.post('/admin/occasions', data),
  updateOccasion: (id, data) => api.put(`/admin/occasions/${id}`, data),
  deleteOccasion: (id) => api.delete(`/admin/occasions/${id}`),

  // Emails
  getEmails: (params) => api.get('/admin/emails', { params }),
  getEmail: (id) => api.get(`/admin/emails/${id}`),
  deleteEmail: (id) => api.delete(`/admin/emails/${id}`),
}

export default api

