const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const Review = require('../models/Review');
const Order = require('../models/Order');
const { protect, apiLimiter } = require('../middleware/auth');
const { MESSAGES, CONFIG } = require('../constants');
const { sendSuccess, sendError, sendNotFound, sendForbidden, sendCreated, sendPaginated } = require('../utils/response');

// Optional auth helper — returns userId or null (for guest reviews)
const getOptionalUserId = (req) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET).id;
  } catch {
    return null;
  }
};

// @route   GET /api/reviews/product/:productId
// @desc    Get reviews for a product
// @access  Public
router.get('/product/:productId', async (req, res) => {
  try {
    const { page = 1, limit = CONFIG.LIMITS.REVIEWS_PER_PAGE, sort = 'newest' } = req.query;

    let sortOption = { createdAt: -1 };
    if (sort === 'oldest') sortOption = { createdAt: 1 };
    if (sort === 'highest') sortOption = { rating: -1 };
    if (sort === 'lowest') sortOption = { rating: 1 };
    if (sort === 'helpful') sortOption = { 'helpful.count': -1 };

    const reviews = await Review.find({ 
      product: req.params.productId,
      isApproved: true 
    })
      .populate('user', 'firstName lastName avatar')
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Review.countDocuments({ 
      product: req.params.productId,
      isApproved: true 
    });

    // Get rating distribution
    const ratingStats = await Review.aggregate([
      { 
        $match: { 
          product: new mongoose.Types.ObjectId(req.params.productId),
          isApproved: true 
        } 
      },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      }
    ]);

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratingStats.forEach(stat => {
      distribution[stat._id] = stat.count;
    });

    res.json({
      success: true,
      data: reviews,
      ratingDistribution: distribution,
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    sendError(res, MESSAGES.GENERAL.ERROR);
  }
});

// @route   POST /api/reviews
// @desc    Create a review
// @access  Private
router.post('/', apiLimiter, [
  body('product').notEmpty().withMessage(MESSAGES.REVIEWS.PRODUCT_REQUIRED),
  body('rating').isInt({ min: 1, max: 5 }).withMessage(MESSAGES.REVIEWS.RATING_INVALID),
  body('comment').trim().isLength({ min: 10 }).withMessage(MESSAGES.REVIEWS.COMMENT_TOO_SHORT),
  body('guestName').optional().trim().notEmpty().withMessage(MESSAGES.REVIEWS.GUEST_NAME_REQUIRED),
  body('guestEmail').optional().isEmail().withMessage(MESSAGES.REVIEWS.GUEST_EMAIL_INVALID)
], async (req, res) => {
  try {
    const userId = getOptionalUserId(req);
    const { product, rating, title, comment, pros, cons, images, orderId, guestName, guestEmail } = req.body;
    
    const productId = product;

    // If not logged in, require guestName and guestEmail
    if (!userId && (!guestName || !guestEmail)) {
      return res.status(400).json({
        success: false,
        message: MESSAGES.REVIEWS.GUEST_INFO_REQUIRED
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Check for duplicate review by user or guest
    let existingReview = null;
    if (userId) {
      existingReview = await Review.findOne({ product: productId, user: userId });
    } else {
      existingReview = await Review.findOne({ product: productId, guestEmail });
    }
    
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: MESSAGES.REVIEWS.ALREADY_REVIEWED
      });
    }

    // Check if this is a verified purchase (only for logged in)
    let isVerifiedPurchase = false;
    if (userId) {
      const userOrders = await Order.find({
        user: userId,
        status: 'delivered',
        'items.product': productId
      });
      if (userOrders.length > 0) {
        isVerifiedPurchase = true;
      }
    }

    const review = await Review.create({
      product: productId,
      user: userId || undefined,
      guestName: !userId ? guestName : undefined,
      guestEmail: !userId ? guestEmail : undefined,
      order: orderId,
      rating,
      title,
      comment,
      pros,
      cons,
      images,
      isVerifiedPurchase,
      isApproved: true
    });

    if (userId) await review.populate('user', 'firstName lastName avatar');

    sendCreated(res, review, MESSAGES.REVIEWS.CREATED);
  } catch (error) {
    console.error('Error creating review:', error);
    sendError(res, MESSAGES.GENERAL.ERROR);
  }
});

// @route   PUT /api/reviews/:id
// @desc    Update a review
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return sendNotFound(res, MESSAGES.REVIEWS.NOT_FOUND);
    }

    if (review.user.toString() !== req.user._id.toString()) {
      return sendForbidden(res, MESSAGES.AUTH.FORBIDDEN);
    }

    const { rating, title, comment, pros, cons } = req.body;

    review.rating = rating || review.rating;
    review.title = title || review.title;
    review.comment = comment || review.comment;
    review.pros = pros || review.pros;
    review.cons = cons || review.cons;
    review.isEdited = true;

    await review.save();

    sendSuccess(res, { data: review, message: MESSAGES.REVIEWS.UPDATED });
  } catch (error) {
    sendError(res, MESSAGES.GENERAL.ERROR);
  }
});

// @route   DELETE /api/reviews/:id
// @desc    Delete a review
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return sendNotFound(res, MESSAGES.REVIEWS.NOT_FOUND);
    }

    if (review.user.toString() !== req.user._id.toString()) {
      return sendForbidden(res, MESSAGES.AUTH.FORBIDDEN);
    }

    await review.deleteOne();

    sendSuccess(res, { message: MESSAGES.REVIEWS.DELETED });
  } catch (error) {
    sendError(res, MESSAGES.GENERAL.ERROR);
  }
});

// @route   POST /api/reviews/:id/helpful
// @desc    Mark review as helpful
// @access  Private
router.post('/:id/helpful', protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return sendNotFound(res, MESSAGES.REVIEWS.NOT_FOUND);
    }

    const userId = req.user._id.toString();

    // Check if user already marked as helpful
    if (review.helpful.users.includes(req.user._id)) {
      // Remove helpful
      review.helpful.users = review.helpful.users.filter(
        id => id.toString() !== userId
      );
      review.helpful.count -= 1;
    } else {
      // Add helpful
      review.helpful.users.push(req.user._id);
      review.helpful.count += 1;
    }

    await review.save();

    sendSuccess(res, { data: { helpful: review.helpful.count } });
  } catch (error) {
    sendError(res, MESSAGES.GENERAL.ERROR);
  }
});

module.exports = router;