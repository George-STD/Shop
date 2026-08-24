const http = require('http');

const product = {
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

const send = (response, status, body) => {
  const payload = JSON.stringify(body);
  response.writeHead(status, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) });
  response.end(payload);
};

const server = http.createServer((request, response) => {
  const url = new URL(request.url, 'http://127.0.0.1:4010');
  if (request.method === 'GET' && url.pathname === '/api/health') return send(response, 200, { success: true });
  if (request.method === 'GET' && url.pathname === '/api/products') return send(response, 200, { success: true, data: [product], pagination: { total: 1, pages: 1, page: 1 } });
  if (request.method === 'GET' && url.pathname === `/api/products/slug/${product.slug}`) return send(response, 200, { success: true, data: product });
  if (request.method === 'GET' && url.pathname === `/api/products/${product._id}/related`) return send(response, 200, { success: true, data: [] });
  if (request.method === 'GET' && url.pathname.startsWith('/api/categories')) return send(response, 200, { success: true, data: [] });
  if (request.method === 'GET' && url.pathname.startsWith('/api/occasions')) return send(response, 200, { success: true, data: [] });
  if (request.method === 'GET' && url.pathname === '/api/settings/loyalty') return send(response, 200, { success: true, data: { enabled: false, egpPerPointRedeemed: 0.1 } });
  if (request.method === 'GET' && url.pathname.startsWith('/api/reviews/product/')) return send(response, 200, { success: true, data: [], pagination: { total: 0 } });
  if (request.method === 'POST' && url.pathname === '/api/orders') return send(response, 200, { success: true, data: { orderNumber: 'E2E-1001', total: 595 } });
  if (url.pathname.startsWith('/api/auth/wishlist/')) return send(response, request.method === 'DELETE' ? 204 : 200, { success: true });
  return send(response, 404, { success: false, message: 'Mock endpoint not found' });
});

server.listen(4010, '127.0.0.1', () => console.log('E2E mock API listening on http://127.0.0.1:4010'));
