const express = require('express');
const router = express.Router();
const Occasion = require('../models/Occasion');

// @route   GET /api/occasions
// @desc    Get all active occasions
// @access  Public
router.get('/', async (req, res) => {
  try {
    const occasions = await Occasion.find({ isActive: true })
      .sort({ order: 1, createdAt: 1 });

    res.json({
      success: true,
      data: occasions
    });
  } catch (error) {
    console.error('Error fetching occasions:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب المناسبات'
    });
  }
});

module.exports = router;
