const express = require('express');
const router = express.Router();
const ReceivedEmail = require('../models/ReceivedEmail');

// POST /api/webhooks/resend — Resend inbound email webhook
router.post('/resend', async (req, res) => {
  try {
    const { type, data } = req.body;

    // Only process email.received events
    if (type !== 'email.received') {
      return res.status(200).json({ received: true });
    }

    const { from, to, subject, html, text } = data;

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
    // Always return 200 to prevent Resend from retrying
    res.status(200).json({ received: true });
  }
});

module.exports = router;
