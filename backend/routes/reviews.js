const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const Review = require('../models/Review');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { protect, apiLimiter } = require('../middleware/auth');
const { MESSAGES, CONFIG } = require('../constants');
const { sendSuccess, sendError, sendNotFound, sendForbidden, sendBadRequest, sendCreated } = require('../utils/response');

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
    if (!mongoose.Types.ObjectId.isValid(req.params.productId)) {
      return sendBadRequest(res, MESSAGES.GENERAL.INVALID_ID);
    }

    const { page = 1, limit = CONFIG.PAGINATION.REVIEWS_LIMIT, sort = 'newest' } = req.query;
    const pageNumber = Math.max(1, Number(page) || 1);
    const limitNumber = Math.min(
      CONFIG.PAGINATION.MAX_LIMIT,
      Math.max(1, Number(limit) || CONFIG.PAGINATION.REVIEWS_LIMIT)
    );

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
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber);

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
        current: pageNumber,
        pages: Math.ceil(total / limitNumber),
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
  body('product').isMongoId().withMessage(MESSAGES.REVIEWS.PRODUCT_REQUIRED),
  body('rating').toInt().isInt({ min: 1, max: 5 }).withMessage(MESSAGES.REVIEWS.RATING_INVALID),
  body('comment')
    .trim()
    .isLength({ min: 10 })
    .withMessage(MESSAGES.REVIEWS.COMMENT_TOO_SHORT)
    .isLength({ max: 1000 })
    .withMessage(MESSAGES.REVIEWS.COMMENT_TOO_LONG),
  body('guestName').optional({ checkFalsy: true }).trim().notEmpty().withMessage(MESSAGES.REVIEWS.GUEST_NAME_REQUIRED),
  body('guestEmail').optional({ checkFalsy: true }).isEmail().withMessage(MESSAGES.REVIEWS.GUEST_EMAIL_INVALID)
], async (req, res) => {
  try {
    const userId = getOptionalUserId(req);
    const { product, rating, title, comment, pros, cons, images, orderId, guestName, guestEmail } = req.body;
    const productId = String(product);
    const normalizedGuestEmail = guestEmail ? String(guestEmail).toLowerCase().trim() : undefined;

    // If not logged in, require guestName and guestEmail
    if (!userId && (!guestName || !guestEmail)) {
      return sendBadRequest(res, MESSAGES.REVIEWS.GUEST_INFO_REQUIRED);
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendBadRequest(res, MESSAGES.GENERAL.VALIDATION_ERROR, errors.array());
    }

    const existingProduct = await Product.findById(productId).select('_id');
    if (!existingProduct) {
      return sendNotFound(res, MESSAGES.REVIEWS.PRODUCT_NOT_FOUND);
    }

    // Check for duplicate review by user or guest
    let existingReview = null;
    if (userId) {
      existingReview = await Review.findOne({ product: productId, user: userId });
    } else {
      existingReview = await Review.findOne({ product: productId, guestEmail: normalizedGuestEmail });
    }

    if (existingReview) {
      return sendBadRequest(res, MESSAGES.REVIEWS.ALREADY_REVIEWED);
    }

    // Check if this is a verified purchase (only for logged in)
    let isVerifiedPurchase = false;
    if (userId) {
      isVerifiedPurchase = Boolean(await Order.exists({
        user: userId,
        status: 'delivered',
        'items.product': productId
      }));
    }

    const review = await Review.create({
      product: productId,
      user: userId || undefined,
      guestName: !userId ? String(guestName).trim() : undefined,
      guestEmail: !userId ? normalizedGuestEmail : undefined,
      order: orderId,
      rating,
      title: title ? String(title).trim() : undefined,
      comment,
      pros,
      cons,
      images,
      isVerifiedPurchase,
      isApproved: true
    });

    if (userId) await review.populate('user', 'firstName lastName avatar');

    return sendCreated(res, { data: review, message: MESSAGES.REVIEWS.CREATED });
  } catch (error) {
    if (error?.code === 11000) {
      return sendBadRequest(res, MESSAGES.REVIEWS.ALREADY_REVIEWED);
    }

    console.error('Error creating review:', error);
    return sendError(res, { message: MESSAGES.GENERAL.ERROR });
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

    if (!review.user || review.user.toString() !== req.user._id.toString()) {
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

    return sendSuccess(res, { data: review, message: MESSAGES.REVIEWS.UPDATED });
  } catch (error) {
    return sendError(res, { message: MESSAGES.GENERAL.ERROR });
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

    if (!review.user || review.user.toString() !== req.user._id.toString()) {
      return sendForbidden(res, MESSAGES.AUTH.FORBIDDEN);
    }

    await review.deleteOne();

    return sendSuccess(res, { message: MESSAGES.REVIEWS.DELETED });
  } catch (error) {
    return sendError(res, { message: MESSAGES.GENERAL.ERROR });
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
    const alreadyMarkedHelpful = review.helpful.users.some((id) => id.toString() === userId);

    // Check if user already marked as helpful
    if (alreadyMarkedHelpful) {
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

    return sendSuccess(res, { data: { helpful: review.helpful.count } });
  } catch (error) {
    return sendError(res, { message: MESSAGES.GENERAL.ERROR });
  }
});

module.exports = router;