const express = require('express');
const router = express.Router();
const Occasion = require('../models/Occasion');
const { MESSAGES } = require('../constants');
const { sendSuccess, sendError } = require('../utils/response');

// @route   GET /api/occasions
// @desc    Get all active occasions
// @access  Public
router.get('/', async (req, res) => {
  try {
    const occasions = await Occasion.find({ isActive: true })
      .sort({ order: 1, createdAt: 1 });

    sendSuccess(res, { data: occasions });
  } catch (error) {
    console.error('Error fetching occasions:', error);
    sendError(res, MESSAGES.OCCASIONS.FETCH_ERROR);
  }
});

module.exports = router;
