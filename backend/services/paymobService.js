const crypto = require('crypto');

const PAYMOB_BASE_URL = (process.env.PAYMOB_BASE_URL || 'https://accept.paymob.com').replace(/\/+$/, '');

/**
 * Timing-safe hex string comparison for HMAC-SHA512 signatures
 */
const safeTimingEqualHex = (expectedHex, actualHex) => {
  if (!expectedHex || !actualHex) return false;
  const a = Buffer.from(String(expectedHex).trim().toLowerCase(), 'utf8');
  const b = Buffer.from(String(actualHex).trim().toLowerCase(), 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
};

/**
 * Parse numeric Paymob integration IDs from environment variables
 */
const parseIntegrationIds = (paymentMethod = 'paymob_card') => {
  const cardId = Number(process.env.PAYMOB_CARD_INTEGRATION_ID);
  const walletId = Number(process.env.PAYMOB_WALLET_INTEGRATION_ID);
  const listIds = String(process.env.PAYMOB_INTEGRATION_IDS || '')
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n > 0);

  if (paymentMethod === 'paymob_wallet' && Number.isInteger(walletId) && walletId > 0) {
    return [walletId];
  }
  if (paymentMethod === 'paymob_card' && Number.isInteger(cardId) && cardId > 0) {
    return [cardId];
  }

  const combined = new Set();
  if (Number.isInteger(cardId) && cardId > 0) combined.add(cardId);
  if (Number.isInteger(walletId) && walletId > 0) combined.add(walletId);
  for (const id of listIds) combined.add(id);

  return Array.from(combined);
};

/**
 * Checks whether Paymob credentials are configured in the environment
 */
const isPaymobConfigured = () => {
  const hasUnifiedKeys = Boolean(process.env.PAYMOB_SECRET_KEY && process.env.PAYMOB_PUBLIC_KEY);
  const hasClassicKeys = Boolean(process.env.PAYMOB_API_KEY);
  const integrationIds = parseIntegrationIds('paymob');
  return (hasUnifiedKeys || hasClassicKeys) && integrationIds.length > 0;
};

/**
 * Returns public-safe payment gateway configuration for the storefront checkout
 */
const getPublicPaymentConfig = () => {
  const paymobEnabled = isPaymobConfigured();
  const cardIds = parseIntegrationIds('paymob_card');
  const walletId = Number(process.env.PAYMOB_WALLET_INTEGRATION_ID);
  const isLive =
    String(process.env.PAYMOB_SECRET_KEY || '').startsWith('sk_live_') ||
    String(process.env.PAYMOB_PUBLIC_KEY || '').startsWith('pk_live_') ||
    process.env.PAYMOB_LIVE_MODE === 'true';

  return {
    paymobEnabled,
    cardEnabled: paymobEnabled && cardIds.length > 0,
    walletEnabled: paymobEnabled && Number.isInteger(walletId) && walletId > 0,
    mode: isLive ? 'live' : 'test',
  };
};

/**
 * Builds normalized billing_data required by Paymob Accept APIs
 */
const buildBillingData = (order, user = {}) => {
  const addr = order?.shippingAddress || {};
  const firstName = String(addr.firstName || user?.firstName || 'Customer').trim() || 'Customer';
  const lastName = String(addr.lastName || user?.lastName || 'Customer').trim() || 'Customer';
  const email = String(order?.guestEmail || user?.email || 'customer@foryo.me').trim();
  const phone = String(addr.phone || user?.phone || '+201000000000').trim();

  return {
    apartment: String(addr.apartment || 'NA').trim() || 'NA',
    first_name: firstName,
    last_name: lastName,
    street: String(addr.street || 'NA').trim() || 'NA',
    building: String(addr.building || 'NA').trim() || 'NA',
    phone_number: phone,
    city: String(addr.city || addr.governorate || 'Cairo').trim() || 'Cairo',
    country: 'EG',
    email,
    floor: String(addr.floor || 'NA').trim() || 'NA',
    state: String(addr.governorate || 'Cairo').trim() || 'Cairo',
  };
};

/**
 * Creates a Paymob Checkout Session using either Unified Checkout Intention API (v1)
 * or Classic Accept Payment Key API.
 */
const createPaymobCheckoutSession = async (order, user = {}) => {
  if (!isPaymobConfigured()) {
    throw new Error('بوابة الدفع الإلكتروني Paymob غير مفعلة حالياً في إعدادات الخادم');
  }

  const amountCents = Math.max(100, Math.round((Number(order.total) || 0) * 100));
  const integrationIds = parseIntegrationIds(order.paymentMethod);
  const billingData = buildBillingData(order, user);
  const specialReference = String(order.orderNumber || order._id);
  const frontendUrl = (process.env.FRONTEND_URL || 'https://www.foryo.me').replace(/\/+$/, '');
  const redirectionUrl = `${frontendUrl}/account/orders?success=true&order=${encodeURIComponent(specialReference)}`;

  // Path 1: Modern Unified Checkout Intention API (Secret Key + Public Key)
  if (process.env.PAYMOB_SECRET_KEY && process.env.PAYMOB_PUBLIC_KEY) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15_000);
    try {
      const response = await fetch(`${PAYMOB_BASE_URL}/v1/intention/`, {
        method: 'POST',
        headers: {
          Authorization: `Token ${process.env.PAYMOB_SECRET_KEY.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amountCents,
          currency: 'EGP',
          payment_methods: integrationIds,
          items: [
            {
              name: `Order #${specialReference}`.slice(0, 50),
              amount: amountCents,
              description: `For You Gift Shop Order #${specialReference} (${(order.items || []).length} items)`.slice(0, 100),
              quantity: 1,
            },
          ],
          billing_data: billingData,
          special_reference: specialReference,
          redirection_url: redirectionUrl,
          extras: {
            orderId: String(order._id),
            orderNumber: specialReference,
          },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        throw new Error(`Paymob Intention API error (${response.status}): ${errText.slice(0, 200)}`);
      }

      const data = await response.json();
      const clientSecret = data.client_secret;
      if (!clientSecret) {
        throw new Error('Paymob Intention response missing client_secret');
      }

      const publicKey = process.env.PAYMOB_PUBLIC_KEY.trim();
      const paymentUrl = `${PAYMOB_BASE_URL}/unifiedcheckout/?publicKey=${encodeURIComponent(publicKey)}&clientSecret=${encodeURIComponent(clientSecret)}`;

      return {
        gateway: 'paymob',
        intentionId: data.id ? String(data.id) : undefined,
        paymobOrderId: data.intention_order_id ? String(data.intention_order_id) : undefined,
        paymentUrl,
      };
    } finally {
      clearTimeout(timer);
    }
  }

  // Path 2: Classic Paymob Accept 3-Step Flow (API Key + Iframe ID)
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    // Step 1: Auth Token
    const authRes = await fetch(`${PAYMOB_BASE_URL}/api/auth/tokens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: process.env.PAYMOB_API_KEY.trim() }),
      signal: controller.signal,
    });
    if (!authRes.ok) throw new Error(`Paymob Auth failed (${authRes.status})`);
    const { token: authToken } = await authRes.json();

    // Step 2: Order Registration
    const orderRes = await fetch(`${PAYMOB_BASE_URL}/api/ecommerce/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auth_token: authToken,
        delivery_needed: 'false',
        amount_cents: String(amountCents),
        currency: 'EGP',
        merchant_order_id: specialReference,
        items: [],
      }),
      signal: controller.signal,
    });
    if (!orderRes.ok) throw new Error(`Paymob Order Registration failed (${orderRes.status})`);
    const orderReg = await orderRes.json();

    // Step 3: Payment Key
    const keyRes = await fetch(`${PAYMOB_BASE_URL}/api/acceptance/payment_keys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auth_token: authToken,
        amount_cents: String(amountCents),
        expiration: 3600,
        order_id: orderReg.id,
        billing_data: billingData,
        currency: 'EGP',
        integration_id: integrationIds[0],
        lock_order_when_paid: 'true',
      }),
      signal: controller.signal,
    });
    if (!keyRes.ok) throw new Error(`Paymob Payment Key failed (${keyRes.status})`);
    const { token: paymentToken } = await keyRes.json();

    const iframeId = process.env.PAYMOB_IFRAME_ID || '';
    const paymentUrl = `${PAYMOB_BASE_URL}/api/acceptance/iframes/${encodeURIComponent(iframeId)}?payment_token=${encodeURIComponent(paymentToken)}`;

    return {
      gateway: 'paymob',
      paymobOrderId: String(orderReg.id),
      paymentUrl,
    };
  } finally {
    clearTimeout(timer);
  }
};

/**
 * Computes Paymob's canonical 20-field lexicographical HMAC-SHA512 digest
 * Specification: https://developers.paymob.com/paymob-docs/developers/webhook-callbacks-and-hmac-itha-kan-al-rabt-b-api
 */
const computePaymobHmac = (txObj = {}, hmacSecret = process.env.PAYMOB_HMAC_SECRET) => {
  if (!hmacSecret || !txObj || typeof txObj !== 'object') return null;

  const orderId =
    txObj.order && typeof txObj.order === 'object'
      ? txObj.order.id
      : txObj.order ?? '';

  const fields = [
    txObj.amount_cents,
    txObj.created_at,
    txObj.currency,
    txObj.error_occured,
    txObj.has_parent_transaction,
    txObj.id,
    txObj.integration_id,
    txObj.is_3d_secure,
    txObj.is_auth,
    txObj.is_capture,
    txObj.is_refunded,
    txObj.is_standalone_payment,
    txObj.is_voided,
    orderId,
    txObj.owner,
    txObj.pending,
    txObj.source_data?.pan,
    txObj.source_data?.sub_type,
    txObj.source_data?.type,
    txObj.success,
  ];

  const concatenated = fields
    .map((val) => {
      if (val === undefined || val === null) return '';
      if (typeof val === 'boolean') return val ? 'true' : 'false';
      return String(val);
    })
    .join('');

  return crypto.createHmac('sha512', String(hmacSecret).trim()).update(concatenated).digest('hex');
};

/**
 * Verifies an incoming Paymob transaction webhook HMAC-SHA512 signature
 */
const verifyPaymobHmac = (txObj, receivedHmac, hmacSecret = process.env.PAYMOB_HMAC_SECRET) => {
  if (!hmacSecret || !receivedHmac || !txObj) return false;
  const expected = computePaymobHmac(txObj, hmacSecret);
  if (!expected) return false;
  return safeTimingEqualHex(expected, receivedHmac);
};

module.exports = {
  isPaymobConfigured,
  getPublicPaymentConfig,
  parseIntegrationIds,
  createPaymobCheckoutSession,
  computePaymobHmac,
  verifyPaymobHmac,
};
