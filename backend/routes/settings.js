const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const {
  getLoyaltySettings,
  updateLoyaltySettings
} = require('../controllers/admin/settingsController');
const { rememberGet } = require('../middleware/cache');

// Public / User endpoint to fetch current loyalty settings
router.get('/loyalty', rememberGet('settings', 60_000), getLoyaltySettings);

// Admin endpoint to update loyalty settings
router.put('/admin/loyalty', protect, admin, updateLoyaltySettings);

module.exports = router;
