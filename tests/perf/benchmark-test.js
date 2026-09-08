import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

/**
 * ============================================================================
 * Standardized Backend Performance Benchmark Script (k6)
 * ============================================================================
 * Targets storefront read paths:
 *   1. GET /health (Raw Express event-loop & HTTP overhead)
 *   2. GET /api/products (Database query, serialization & cache layer)
 *
 * Execution Stages:
 *   - Ramp-up:   10 VUs over 30s
 *   - Sustained: 25 VUs for 1m
 *   - Ramp-down: 0 VUs over 30s
 *
 * Thresholds:
 *   - http_req_failed: rate < 1% (< 0.01)
 *   - http_req_duration: p(95) < 500ms
 * ============================================================================
 */

// Custom trend and rate metrics
const productsDuration = new Trend('products_duration', true);
const healthDuration = new Trend('health_duration', true);
const successfulRequests = new Rate('success_rate');

// Base URL configurable via environment variable (default: local backend server)
const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

export const options = {
  stages: [
    { duration: '30s', target: 10 }, // Stage 1: Ramp-up to 10 VUs over 30s
    { duration: '1m', target: 25 },  // Stage 2: Sustain 25 VUs for 1 minute
    { duration: '30s', target: 0 },  // Stage 3: Ramp-down to 0 VUs over 30s
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],    // Error rate must remain under 1%
    http_req_duration: ['p(95)<500'],  // 95th percentile response time under 500ms
    success_rate: ['rate>0.99'],       // 99%+ of checks must succeed
  },
  userAgent: 'k6-benchmark-agent/1.0',
};

export default function () {
  // --------------------------------------------------------------------------
  // 1. Health Endpoint (Baseline HTTP responsiveness)
  // --------------------------------------------------------------------------
  const healthRes = http.get(`${BASE_URL}/health`);
  const healthPassed = check(healthRes, {
    'health check returns 200': (r) => r.status === 200,
    'health response body valid': (r) => r.body && r.body.length > 0,
  });
  healthDuration.add(healthRes.timings.duration);
  successfulRequests.add(healthPassed);

  // Think time between simulated user actions
  sleep(0.5);

  // --------------------------------------------------------------------------
  // 2. Storefront Catalog Endpoint (Data retrieval & API pipeline)
  // --------------------------------------------------------------------------
  const productsRes = http.get(`${BASE_URL}/api/products?page=1&limit=12`, {
    headers: {
      'Accept': 'application/json',
    },
  });

  const productsPassed = check(productsRes, {
    'products endpoint returns 200': (r) => r.status === 200,
    'products response is JSON': (r) => {
      try {
        const data = JSON.parse(r.body);
        return data && data.success === true;
      } catch (_) {
        return false;
      }
    },
  });
  productsDuration.add(productsRes.timings.duration);
  successfulRequests.add(productsPassed);

  // Paced pacing before next iteration (models real browsing behavior)
  sleep(1);
}
