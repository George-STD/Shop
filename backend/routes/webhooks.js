const express = require('express');
const router = express.Router();
const { Webhook } = require('svix');
const ReceivedEmail = require('../models/ReceivedEmail');
const Order = require('../models/Order');
const OrderDailyStats = require('../models/OrderDailyStats');
const { webhookLimiter } = require('../middleware/auth');
const { fetchReceivedEmailContent } = require('../utils/resendInbound');
const { verifyPaymobHmac } = require('../services/paymobService');
const { bustCatalog } = require('../middleware/cache');

/**
 * ReDoS-Safe bounded plain-text extractor
 * Non-nested, bounded regular expressions to prevent event-loop stalls
 */
const htmlToPlainText = (html = '') => {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/?[a-z][^>]{0,200}>/gi, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
};

// POST /api/webhooks/resend — Resend inbound email webhook with 512KB raw limit
router.post(
  '/resend',
  webhookLimiter,
  express.raw({ type: 'application/json', limit: '512kb' }),
  async (req, res) => {
    try {
      const secret = process.env.RESEND_WEBHOOK_SECRET;
      if (!secret) {
        console.error('RESEND_WEBHOOK_SECRET not set');
        return res.status(500).json({ error: 'Webhook secret not configured' });
      }

      // Verify Svix signature
      const wh = new Webhook(secret);
      const payload = req.body.toString();
      const headers = {
        'svix-id': req.headers['svix-id'],
        'svix-timestamp': req.headers['svix-timestamp'],
        'svix-signature': req.headers['svix-signature'],
      };

      let event;
      try {
        event = wh.verify(payload, headers);
      } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(401).json({ error: 'Invalid signature' });
      }

      // Only process email.received events
      if (event.type !== 'email.received') {
        return res.status(200).json({ received: true });
      }

      const emailData = event.data || {};
      const emailId = emailData.email_id || emailData.id || '';
      let { from, to, subject, html, text } = emailData;

      // Only accept emails sent to support@foryo.me
      const recipients = (Array.isArray(to) ? to : [to])
        .map((addr) => String(addr || '').toLowerCase())
        .filter(Boolean);

      const isForSupport = recipients.some(
        (addr) => addr === 'support@foryo.me' || addr.includes('<support@foryo.me>')
      );

      if (!isForSupport) {
        return res.status(200).json({ received: true, ignored: true });
      }

      // Resend inbound webhooks only send metadata (no body). Fetch content via API if missing.
      if (!text && !html && emailId) {
        try {
          const fullEmail = await fetchReceivedEmailContent(emailId);
          if (fullEmail) {
            text = fullEmail.text || '';
            html = fullEmail.html || '';
          }
        } catch (fetchErr) {
          console.error('Failed to fetch full email body from Resend in webhook:', fetchErr.message);
        }
      }

      const plainText = String(text || '').trim() || htmlToPlainText(html || '');

      try {
        await ReceivedEmail.create({
          emailId: emailId || '',
          from: Array.isArray(from) ? from.join(', ') : from,
          to: Array.isArray(to) ? to.join(', ') : to,
          subject: subject || '(بدون عنوان)',
          html: '', // Keep HTML empty for safety
          text: plainText,
        });
      } catch (persistErr) {
        console.error('Failed to persist received email (poison pill prevented):', persistErr);
      }

      // Return 200 OK after signature is verified to stop Svix retry storm
      res.status(200).json({ received: true });
    } catch (error) {
      console.error('Webhook fatal processing error:', error);
      res.status(500).json({ error: 'Failed to process webhook' });
    }
  }
);

// POST /api/webhooks/paymob — Paymob Accept Transaction Processed Callback with HMAC-SHA512 Verification
router.post(
  '/paymob',
  webhookLimiter,
  express.json({ limit: '512kb' }),
  async (req, res) => {
    try {
      const hmacSecret = process.env.PAYMOB_HMAC_SECRET;
      if (!hmacSecret) {
        console.error('PAYMOB_HMAC_SECRET is not configured');
        return res.status(500).json({ success: false, message: 'Paymob webhook secret not configured' });
      }

      const receivedHmac = req.query?.hmac || req.headers['x-paymob-hmac'];
      const txObj = req.body?.obj || req.body;

      if (!receivedHmac || !txObj || typeof txObj !== 'object') {
        return res.status(400).json({ success: false, message: 'Invalid Paymob webhook payload' });
      }

      if (!verifyPaymobHmac(txObj, receivedHmac, hmacSecret)) {
        return res.status(401).json({ success: false, message: 'Invalid Paymob HMAC signature' });
      }

      // Security Fix (Critical #1): Resolve order strictly by HMAC-signed order.id (paymobOrderId).
      // Never look up by unsigned merchant_order_id / special_reference to prevent cross-order payment spoofing.
      const paymobOrderId = txObj.order?.id ? String(txObj.order.id) : null;
      if (!paymobOrderId) {
        return res.status(400).json({ success: false, message: 'Missing signed Paymob order ID' });
      }

      const order = await Order.findOne({ 'paymentDetails.paymobOrderId': paymobOrderId });

      if (!order) {
        return res.status(200).json({ received: true, matched: false });
      }

      // Cross-check merchant_order_id if provided against the resolved order's orderNumber
      const merchantOrderRef = txObj.order?.merchant_order_id || txObj.special_reference;
      if (merchantOrderRef && order.orderNumber && String(merchantOrderRef).trim() !== String(order.orderNumber).trim()) {
        return res.status(400).json({ success: false, message: 'Paymob order reference mismatch' });
      }

      // Strictly verify signed amount_cents and currency against order.total
      const expectedAmountCents = Math.round((Number(order.total) || 0) * 100);
      const actualAmountCents = Number(txObj.amount_cents);
      const txCurrency = String(txObj.currency || '').trim().toUpperCase();

      if (
        !Number.isFinite(actualAmountCents) ||
        actualAmountCents !== expectedAmountCents ||
        txCurrency !== 'EGP'
      ) {
        return res.status(400).json({
          success: false,
          message: 'Paymob transaction amount or currency mismatch',
        });
      }

      const transactionId = txObj.id ? String(txObj.id) : undefined;
      const isSuccess = txObj.success === true && txObj.pending === false;
      const isRefunded = txObj.is_refunded === true || txObj.is_voided === true;
      const isFailed = txObj.success === false && txObj.pending === false;

      if (!order.paymentDetails) {
        order.paymentDetails = {};
      }
      order.paymentDetails.gateway = 'paymob';
      if (transactionId) order.paymentDetails.transactionId = transactionId;
      if (paymobOrderId) order.paymentDetails.paymobOrderId = paymobOrderId;

      if (isRefunded) {
        order.paymentStatus = 'refunded';
        order.statusHistory.push({
          status: order.status,
          date: new Date(),
          note: `تم استرداد المبلغ عبر Paymob (عملية رقم #${transactionId || 'N/A'})`,
        });
      } else if (isSuccess && order.paymentStatus !== 'paid') {
        order.paymentStatus = 'paid';
        order.paymentDetails.paidAt = new Date();
        if (order.status === 'pending') {
          order.status = 'confirmed';
          order.statusHistory.push({
            status: 'confirmed',
            date: new Date(),
            note: `تم تأكيد الدفع الإلكتروني تلقائياً عبر Paymob (عملية رقم #${transactionId || 'N/A'})`,
          });
        }

        // Update daily confirmed revenue rollup
        const dateKey = new Date(order.createdAt || Date.now()).toISOString().slice(0, 10);
        OrderDailyStats.updateOne(
          { date: dateKey },
          { $inc: { confirmedRevenue: Number(order.total) || 0 } },
          { upsert: true }
        ).catch(() => {});
      } else if (isFailed && order.paymentStatus === 'pending') {
        order.paymentStatus = 'failed';
        order.statusHistory.push({
          status: order.status,
          date: new Date(),
          note: `فشلت محاولة الدفع عبر Paymob (عملية رقم #${transactionId || 'N/A'})`,
        });
      }

      await order.save();
      bustCatalog('admin-stats');

      return res.status(200).json({ received: true, matched: true, paymentStatus: order.paymentStatus });
    } catch (error) {
      console.error('Paymob webhook processing error:', error);
      return res.status(500).json({ success: false, message: 'Failed to process Paymob webhook' });
    }
  }
);

module.exports = router;
