import http from 'k6/http';
import { check } from 'k6';
import { Counter } from 'k6/metrics';

/**
 * ============================================================================
 * Inventory Race Condition & Concurrency Test (k6)
 * ============================================================================
 * Scenario:
 *   - Initial Product Stock in Database: 5 units.
 *   - 20 Virtual Users simultaneously submit orders for 1 unit at the exact
 *     same microsecond.
 *
 * Expected Atomic Outcome:
 *   - Exactly 5 orders must be created (HTTP 201 Created).
 *   - Exactly 15 orders must be rejected with Insufficient Stock (HTTP 400).
 *   - Remaining database stock must be exactly 0 (never negative).
 * ============================================================================
 */

// Custom counters for outcome categorization
const ordersCreated = new Counter('orders_created');
const outOfStockErrors = new Counter('out_of_stock_errors');
const unexpectedErrors = new Counter('unexpected_errors');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';
const PRODUCT_ID = __ENV.PRODUCT_ID;
const AUTH_TOKEN = __ENV.AUTH_TOKEN;

export const options = {
  scenarios: {
    race_condition_burst: {
      executor: 'per-vu-iterations',
      vus: 20,
      iterations: 1,
      maxDuration: '15s',
    },
  },
  thresholds: {
    // Strict threshold: Exactly 5 orders created, 15 rejected, 0 unexpected
    orders_created: ['count==5'],
    out_of_stock_errors: ['count==15'],
    unexpected_errors: ['count==0'],
  },
};

export default function () {
  const payload = JSON.stringify({
    items: [
      {
        productId: PRODUCT_ID,
        quantity: 1,
      },
    ],
    shippingAddress: {
      firstName: 'محاكاة',
      lastName: 'تست',
      street: 'شارع التحرير',
      city: 'القاهرة',
      governorate: 'القاهرة',
      phone: '01012345678',
    },
    paymentMethod: 'cod',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AUTH_TOKEN}`,
    },
  };

  const res = http.post(`${BASE_URL}/api/orders`, payload, params);

  if (res.status === 201) {
    ordersCreated.add(1);
    check(res, {
      'Order created successfully (201)': (r) => r.status === 201,
    });
  } else if (res.status === 400) {
    outOfStockErrors.add(1);
    check(res, {
      'Rejected due to out of stock (400)': (r) => {
        try {
          const body = JSON.parse(r.body);
          const msg = (body && body.message) ? body.message : '';
          return msg.includes('غير متوفرة') || msg.includes('غير كافية') || msg.toLowerCase().includes('stock');
        } catch (_) {
          return false;
        }
      },
    });
  } else {
    unexpectedErrors.add(1);
    console.error(`Unexpected HTTP response: status=${res.status}, body=${res.body}`);
  }
}
