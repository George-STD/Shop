const express = require('express');
const router = express.Router();
const { Webhook } = require('svix');
const ReceivedEmail = require('../models/ReceivedEmail');
const { webhookLimiter } = require('../middleware/auth');

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

      const { from, to, subject, html, text } = event.data || {};

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

      const plainText = String(text || '').trim() || htmlToPlainText(html || '');

      try {
        await ReceivedEmail.create({
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

module.exports = router;
