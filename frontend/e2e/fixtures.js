const API_PREFIX = 'http://localhost:4010/api/**';

const PRODUCT = {
  _id: '507f1f77bcf86cd799439011',
  name: 'E2E Gift Box',
  slug: 'e2e-gift-box',
  price: 450,
  oldPrice: 500,
  stock: 8,
  images: [{ url: '/images/logo.jpeg', alt: 'E2E Gift Box' }],
  category: [{ _id: 'category-1', name: 'هدايا', slug: 'gifts' }],
  rating: { average: 4.8, count: 12 },
  isNewArrival: true,
};

const USER = {
  _id: 'user-1',
  firstName: 'اختبار',
  lastName: 'المستخدم',
  email: 'e2e@example.com',
  phone: '01012345678',
  role: 'user',
  loyaltyPoints: 0,
};

async function installAuthenticatedSession(page) {
  await page.addInitScript(({ user }) => {
    localStorage.setItem('token', 'e2e-token');
    localStorage.setItem('auth-storage', JSON.stringify({
      state: { user, isAuthenticated: true },
      version: 1,
    }));
    localStorage.setItem('cart-storage', JSON.stringify({ state: { items: [] }, version: 1 }));
    localStorage.setItem('wishlist-storage', JSON.stringify({ state: { items: [] }, version: 1 }));
    sessionStorage.removeItem('hadaya:checkout:idempotency-key');
  }, { user: USER });
}

async function installApiFixtures(page, { wishlistMode = 'success', wishlistDelay = 0, orderMode = 'success', orderDelay = 0 } = {}) {
  await page.route(API_PREFIX, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;

    if (request.method() === 'GET' && path === '/api/products') {
      return route.fulfill({ json: { success: true, data: [PRODUCT], pagination: { total: 1, pages: 1, page: 1 } } });
    }
    if (request.method() === 'GET' && path === `/api/products/slug/${PRODUCT.slug}`) {
      return route.fulfill({ json: { success: true, data: PRODUCT } });
    }
    if (request.method() === 'GET' && path === `/api/products/${PRODUCT._id}/related`) {
      return route.fulfill({ json: { success: true, data: [] } });
    }
    if (request.method() === 'GET' && path.startsWith('/api/categories')) {
      return route.fulfill({ json: { success: true, data: [] } });
    }
    if (request.method() === 'GET' && path.startsWith('/api/occasions')) {
      return route.fulfill({ json: { success: true, data: [] } });
    }
    if (request.method() === 'GET' && path === '/api/settings/loyalty') {
      return route.fulfill({ json: { success: true, data: { enabled: false, egpPerPointRedeemed: 0.1 } } });
    }
    if (request.method() === 'GET' && path.includes('/api/reviews/product/')) {
      return route.fulfill({ json: { success: true, data: [], pagination: { total: 0 } } });
    }
    if (path.startsWith('/api/auth/wishlist/')) {
      if (wishlistDelay) await new Promise((resolve) => setTimeout(resolve, wishlistDelay));
      if (wishlistMode === 'failure') {
        return route.fulfill({ status: 503, json: { success: false, message: 'Wishlist unavailable' } });
      }
      return route.fulfill({ status: request.method() === 'DELETE' ? 204 : 200, body: request.method() === 'DELETE' ? '' : JSON.stringify({ success: true }) });
    }
    if (request.method() === 'POST' && path === '/api/orders') {
      if (orderDelay) await new Promise((resolve) => setTimeout(resolve, orderDelay));
      if (orderMode === 'failure') {
        return route.fulfill({ status: 409, json: { success: false, message: 'Order already processed' } });
      }
      return route.fulfill({ json: { success: true, data: { orderNumber: 'E2E-1001', total: 595 } } });
    }

    return route.continue();
  });
}

module.exports = { PRODUCT, USER, installAuthenticatedSession, installApiFixtures };
