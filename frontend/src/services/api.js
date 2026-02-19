import axios from 'axios'

const API_URL = 'https://shop-gx97.onrender.com/api'

const api = axios.create({
  baseURL: API_URL,
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
      window.location.href = '/account'
    }
    return Promise.reject(error)
  }
)

// Products API
export const productsAPI = {
  getAll: (params) => api.get('/products', { params }),
  getFeatured: (limit = 8) => api.get('/products/featured', { params: { limit } }),
  getBestsellers: (limit = 8) => api.get('/products/bestsellers', { params: { limit } }),
  getNew: (limit = 8) => api.get('/products/new', { params: { limit } }),
  getBySlug: (slug) => api.get(`/products/slug/${slug}`),
  getById: (id) => api.get(`/products/${id}`),
  getRelated: (id) => api.get(`/products/${id}/related`),
  getByOccasion: (occasion, limit = 12) => api.get(`/products/by-occasion/${occasion}`, { params: { limit } }),
  getByRecipient: (recipient, limit = 12) => api.get(`/products/by-recipient/${recipient}`, { params: { limit } }),
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
  updateOrderStatus: (id, status) => api.put(`/admin/orders/${id}/status`, { status }),
  
  // Categories
  createCategory: (data) => api.post('/admin/categories', data),
  updateCategory: (id, data) => api.put(`/admin/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/admin/categories/${id}`),
  
  // Reviews
  getReviews: (params) => api.get('/admin/reviews', { params }),
  approveReview: (id, isApproved) => api.put(`/admin/reviews/${id}/approve`, { isApproved }),
  deleteReview: (id) => api.delete(`/admin/reviews/${id}`),
}

export default api

