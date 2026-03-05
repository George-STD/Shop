const express = require('express');
const router = express.Router();
const { Webhook } = require('svix');
const ReceivedEmail = require('../models/ReceivedEmail');

// POST /api/webhooks/resend — Resend inbound email webhook
router.post('/resend', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const secret = process.env.RESEND_WEBHOOK_SECRET;
    if (!secret) {
      console.error('RESEND_WEBHOOK_SECRET not set');
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    // Verify signature
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

    const { from, to, subject, html, text } = event.data;

    // Only accept emails sent to support@foryo.me
    const recipients = Array.isArray(to) ? to : [to];
    const isForSupport = recipients.some(
      (addr) => addr.toLowerCase().includes('support@foryo.me')
    );
    if (!isForSupport) {
      return res.status(200).json({ received: true, ignored: true });
    }

    await ReceivedEmail.create({
      from: Array.isArray(from) ? from.join(', ') : from,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject: subject || '(بدون عنوان)',
      html: html || '',
      text: text || '',
    });

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(200).json({ received: true });
  }
});

module.exports = router;
