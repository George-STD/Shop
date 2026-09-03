const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const Review = require('../models/Review');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { protect, apiLimiter, validateObjectId, clientIp } = require('../middleware/auth');
const { MESSAGES, CONFIG } = require('../constants');
const { sendSuccess, sendError, sendNotFound, sendForbidden, sendBadRequest, sendCreated } = require('../utils/response');

const orderInfoLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  keyGenerator: (req) => clientIp(req),
  message: {
    success: false,
    message: 'تم تجاوز الحد المسموح به لطلبات الاستعلام عن الطلب'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Optional auth helper — verifies token, tokenVersion and active status
const getOptionalUserId = async (req) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    const user = await User.findById(decoded.id).select('isActive tokenVersion');
    if (!user || !user.isActive) return null;
    if (decoded.v !== undefined && user.tokenVersion !== undefined && decoded.v !== user.tokenVersion) {
      return null;
    }
    return decoded.id;
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
  body('guestEmail').optional({ checkFalsy: true }).isEmail().withMessage(MESSAGES.REVIEWS.GUEST_EMAIL_INVALID),
  body('images').optional().isArray().withMessage('يجب أن تكون الصور في صيغة قائمة'),
  body('images.*').optional().isURL({ protocols: ['http', 'https'], require_protocol: true }).withMessage('رابط الصورة غير صالح')
], async (req, res) => {
  try {
    const userId = await getOptionalUserId(req);
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
      isApproved: isVerifiedPurchase
    });

    if (userId) await review.populate('user', 'firstName lastName avatar');

    // Award loyalty points ONLY for verified purchases if loyalty system is enabled
    if (userId && isVerifiedPurchase) {
      try {
        const Settings = require('../models/Settings');
        const { applyLoyaltyDelta } = require('../utils/loyalty');
        const settings = await Settings.getSettings();
        if (settings?.loyalty?.enabled && settings?.loyalty?.pointsPerReview > 0) {
          const rewardReason = `مكافأة تقييم موثوق للمنتج ${productId}`;
          const idempotencyKey = `review:${userId}:${productId}`;
          await applyLoyaltyDelta({
            userId,
            pointsDelta: settings.loyalty.pointsPerReview,
            type: 'EARNED',
            reason: rewardReason,
            idempotencyKey,
            metadata: { productId: productId.toString(), reviewId: review._id.toString() },
          });
        }
      } catch (loyaltyErr) {
        console.error('Loyalty points for review error:', loyaltyErr);
      }
    }

    const reviewSuccessMessage = isVerifiedPurchase
      ? MESSAGES.REVIEWS.CREATED
      : 'تم استلام تقييمك بنجاح وسيتم نشره بعد مراجعة الإدارة.';

    return sendCreated(res, { data: review, message: reviewSuccessMessage });
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
router.put('/:id', protect, validateObjectId('id'), async (req, res) => {
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
    review.title = title !== undefined ? title : review.title;
    review.comment = comment || review.comment;
    review.pros = pros !== undefined ? pros : review.pros;
    review.cons = cons !== undefined ? cons : review.cons;
    review.isEdited = true;

    await review.save();

    return sendSuccess(res, { data: review, message: MESSAGES.REVIEWS.UPDATED });
  } catch (error) {
    return sendError(res, { message: MESSAGES.GENERAL.ERROR });
  }
});

// @route   POST /api/reviews/:id/helpful
// @desc    Mark review as helpful (Atomic O(1) voting decoupled via ReviewVote)
// @access  Private
router.post('/:id/helpful', protect, validateObjectId('id'), async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return sendNotFound(res, MESSAGES.REVIEWS.NOT_FOUND);
    }

    const ReviewVote = require('../models/ReviewVote');
    const userId = req.user._id;

    const existingVote = await ReviewVote.findOne({ review: review._id, user: userId });
    if (existingVote) {
      // Toggle vote off
      await ReviewVote.deleteOne({ _id: existingVote._id });
      const updated = await Review.findByIdAndUpdate(
        review._id,
        { $inc: { 'helpful.count': -1 } },
        { new: true }
      );
      return sendSuccess(res, {
        data: { helpful: Math.max(0, updated.helpful.count), userVoted: false },
      });
    }

    try {
      await ReviewVote.create({ review: review._id, user: userId });
      const updated = await Review.findByIdAndUpdate(
        review._id,
        { $inc: { 'helpful.count': 1 } },
        { new: true }
      );
      return sendSuccess(res, { data: { helpful: updated.helpful.count, userVoted: true } });
    } catch (voteErr) {
      if (voteErr.code === 11000) {
        // Toggle vote off on race condition
        await ReviewVote.deleteOne({ review: review._id, user: userId });
        const updated = await Review.findByIdAndUpdate(
          review._id,
          { $inc: { 'helpful.count': -1 } },
          { new: true }
        );
        return sendSuccess(res, {
          data: { helpful: Math.max(0, updated.helpful.count), userVoted: false },
        });
      }
      throw voteErr;
    }
  } catch (error) {
    return sendError(res, { message: MESSAGES.GENERAL.ERROR });
  }
});

// @route   DELETE /api/reviews/:id
// @desc    Delete a review
// @access  Private
router.delete('/:id', protect, validateObjectId('id'), async (req, res) => {
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

// Helper to mask email address for privacy (e.g. ma***@gmail.com)
const maskEmail = (email) => {
  if (!email || typeof email !== 'string' || !email.includes('@')) return '';
  const [name, domain] = email.split('@');
  if (name.length <= 2) return `${name[0] || '*'}***@${domain}`;
  return `${name.slice(0, 2)}***@${domain}`;
};

// @route   GET /api/reviews/order-info/:orderNumber
// @desc    Get order info for review page (with masked email for privacy)
// @access  Public
router.get('/order-info/:orderNumber', orderInfoLimiter, async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const order = await Order.findOne({
      $or: [{ orderNumber: orderNumber }, { _id: mongoose.Types.ObjectId.isValid(orderNumber) ? orderNumber : null }]
    }).populate('items.product', 'name images price slug').populate('user', 'email firstName');

    if (!order) {
      return sendNotFound(res, 'الطلب غير موجود');
    }

    const rawEmail = order.guestEmail || order.shippingAddress?.email || order.user?.email || '';

    return res.json({
      success: true,
      data: {
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        status: order.status,
        customerName: `${order.shippingAddress?.firstName || ''} ${order.shippingAddress?.lastName || ''}`.trim() || order.user?.firstName || 'عميلنا العزيز',
        customerEmail: maskEmail(rawEmail),
        items: order.items.map(item => ({
          productId: item.product?._id || item.product,
          name: item.name || item.product?.name,
          image: item.image || item.product?.images?.[0]?.url || '/images/placeholder.jpg',
          price: item.price,
          quantity: item.quantity
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching order info for review:', error);
    sendError(res, { message: 'حدث خطأ في جلب بيانات الطلب' });
  }
});

// @route   POST /api/reviews/batch-order-review
// @desc    Submit a review that applies to all products in an order
// @access  Public
router.post('/batch-order-review', apiLimiter, [
  body('orderNumber').notEmpty().withMessage('رقم الطلب مطلوب'),
  body('rating').toInt().isInt({ min: 1, max: 5 }).withMessage('التقييم يجب أن يكون بين 1 و 5'),
  body('comment').trim().notEmpty().withMessage('تعليق التقييم مطلوب')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendBadRequest(res, MESSAGES.GENERAL.VALIDATION_ERROR, errors.array());
    }

    const { orderNumber, rating = 5, comment = 'ممتاز جداً', title, guestName, guestEmail } = req.body;
    const userId = await getOptionalUserId(req);

    const order = await Order.findOne({
      $or: [{ orderNumber: orderNumber }, { _id: mongoose.Types.ObjectId.isValid(orderNumber) ? orderNumber : null }]
    }).populate('items.product').populate('user', 'email firstName');

    if (!order) {
      return sendNotFound(res, 'الطلب غير موجود');
    }

    // Verify order ownership: must match logged-in user OR submitted guestEmail must match order's email
    const orderEmails = [
      order.guestEmail,
      order.shippingAddress?.email,
      order.user?.email
    ].filter(Boolean).map(e => e.toLowerCase().trim());

    const orderUserId = order.user?._id ? order.user._id.toString() : order.user ? order.user.toString() : null;
    const isUserOwner = userId && orderUserId && orderUserId === userId.toString();
    const submittedEmail = (guestEmail || '').toLowerCase().trim();
    const isEmailMatched = submittedEmail && orderEmails.includes(submittedEmail);
    const isMaskedMatched = submittedEmail && orderEmails.some(oe => maskEmail(oe).toLowerCase() === submittedEmail);

    if (!isUserOwner && !isEmailMatched && !isMaskedMatched && submittedEmail) {
      return sendForbidden(res, 'البريد الإلكتروني المكتوب لا يطابق بيانات صاحب الطلب');
    }

    const customerEmail = (isEmailMatched ? submittedEmail : null) || orderEmails[0] || order.user?.email || order.guestEmail;
    const customerName = guestName || `${order.shippingAddress?.firstName || ''} ${order.shippingAddress?.lastName || ''}`.trim() || order.user?.firstName || 'عميل محدد';

    const productIds = order.items
      .map((i) => i.product?._id || i.product)
      .filter(Boolean);

    if (productIds.length === 0) {
      return sendBadRequest(res, 'لا توجد منتجات صالحة للتقييم في هذا الطلب');
    }

    // 1. Fetch existing reviews for all products in this order in a single query
    const existingFilter = { product: { $in: productIds } };
    if (userId) {
      existingFilter.user = userId;
    } else if (customerEmail) {
      existingFilter.guestEmail = customerEmail.toLowerCase().trim();
    } else {
      existingFilter.order = order._id;
    }

    const existingReviews = await Review.find(existingFilter);
    const existingByProduct = new Map(existingReviews.map((r) => [String(r.product), r]));
    const createdReviews = [];

    // 2. Perform updates or creations
    for (const productId of productIds) {
      const pIdStr = String(productId);
      const existingReview = existingByProduct.get(pIdStr);

      if (existingReview) {
        existingReview.rating = rating;
        existingReview.comment = comment;
        if (title) existingReview.title = title;
        existingReview.isApproved = true;
        await existingReview.save();
        createdReviews.push(existingReview);
      } else {
        const newReview = await Review.create({
          product: productId,
          user: userId || undefined,
          guestName: !userId ? customerName : undefined,
          guestEmail: !userId && customerEmail ? customerEmail.toLowerCase().trim() : undefined,
          order: order._id,
          rating,
          title: title || 'تقييم الطلب',
          comment,
          isVerifiedPurchase: true,
          isApproved: true,
        });
        createdReviews.push(newReview);
      }
    }

    // 3. Recalculate average ratings with a single aggregate pipeline instead of N round-trips
    try {
      const stats = await Review.aggregate([
        { $match: { product: { $in: productIds }, isApproved: true } },
        {
          $group: {
            _id: '$product',
            avgRating: { $avg: '$rating' },
            numReviews: { $sum: 1 },
            sumRating: { $sum: '$rating' },
          },
        },
      ]);

      if (stats.length > 0) {
        const bulkProductOps = stats.map((s) => ({
          updateOne: {
            filter: { _id: s._id },
            update: {
              'rating.average': Math.round(s.avgRating * 10) / 10,
              'rating.count': s.numReviews,
              'rating.sum': s.sumRating,
            },
          },
        }));
        await Product.bulkWrite(bulkProductOps);
      }
    } catch (err) {
      console.error('Error batch recalculating ratings for products:', err);
    }

    return sendSuccess(res, {
      message: 'تم إضافة تقييمك بنجاح لجميع منتجات الطلب! شكراً لك ❤️',
      count: createdReviews.length
    });
  } catch (error) {
    console.error('Error submitting batch order review:', error);
    return sendError(res, { message: 'حدث خطأ أثناء حفظ التقييم' });
  }
});

module.exports = router;