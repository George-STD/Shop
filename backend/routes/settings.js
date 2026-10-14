const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { protect, admin, apiLimiter } = require('../middleware/auth');
const {
  getLoyaltySettings,
  updateLoyaltySettings
} = require('../controllers/admin/settingsController');
const { rememberGet } = require('../middleware/cache');
const ReceivedEmail = require('../models/ReceivedEmail');
const asyncHandler = require('../utils/asyncHandler');
const { getPublicPaymentConfig } = require('../services/paymobService');

// Public / User endpoint to fetch current loyalty settings
router.get('/loyalty', rememberGet('settings', 60_000), getLoyaltySettings);

// Public endpoint to fetch active online payment gateway configuration (Paymob status)
router.get('/payment', (req, res) => {
  res.json({
    success: true,
    data: getPublicPaymentConfig(),
  });
});

// Public endpoint to submit Contact Us form into ReceivedEmail (Admin Inbox)
router.post(
  '/contact',
  apiLimiter,
  [
    body('name').trim().notEmpty().withMessage('الاسم مطلوب').isLength({ max: 100 }),
    body('email').trim().isEmail().withMessage('البريد الإلكتروني غير صالح').isLength({ max: 150 }),
    body('subject').trim().notEmpty().withMessage('الموضوع مطلوب').isLength({ max: 200 }),
    body('message').trim().notEmpty().withMessage('الرسالة مطلوبة').isLength({ max: 5000 }),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg, errors: errors.array() });
    }
    const { name, email, subject, message } = req.body;
    const subjectLabels = {
      inquiry: 'استفسار عام',
      order: 'استفسار عن طلب',
      complaint: 'شكوى',
      suggestion: 'اقتراح',
      corporate: 'طلبات الشركات',
    };
    const readableSubject = subjectLabels[subject] || subject;
    await ReceivedEmail.create({
      from: `${name} <${email}>`,
      to: 'support@foryo.me',
      subject: `[تواصل معنا: ${readableSubject}] من ${name}`,
      text: `المرسل: ${name}\nالبريد الإلكتروني: ${email}\nالموضوع: ${readableSubject}\n\nالرسالة:\n${message}`,
      authStatus: 'verified',
    });
    return res.status(201).json({ success: true, message: 'تم إرسال رسالتك بنجاح! سنقوم بالرد عليك قريباً.' });
  }, 'حدث خطأ أثناء إرسال الرسالة')
);

// Admin endpoint to update loyalty settings
router.put('/admin/loyalty', protect, admin, updateLoyaltySettings);

module.exports = router;
