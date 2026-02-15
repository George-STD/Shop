const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const Review = require('../models/Review');
const Order = require('../models/Order');

// Auth middleware helper
const getUser = async (req) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
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
    const { page = 1, limit = 10, sort = 'newest' } = req.query;

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
          product: require('mongoose').Types.ObjectId(req.params.productId),
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
    res.status(500).json({
      success: false,
      message: 'حدث خطأ'
    });
  }
});

// @route   POST /api/reviews
// @desc    Create a review
// @access  Private
router.post('/', [
  body('productId').notEmpty().withMessage('معرف المنتج مطلوب'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('التقييم يجب أن يكون بين 1 و 5'),
  body('comment').trim().isLength({ min: 10 }).withMessage('التعليق يجب أن يكون 10 أحرف على الأقل')
], async (req, res) => {
  try {
    const userId = await getUser(req);
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'يجب تسجيل الدخول لإضافة تقييم'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { productId, rating, title, comment, pros, cons, images, orderId } = req.body;

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      product: productId,
      user: userId
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'لقد قمت بتقييم هذا المنتج مسبقاً'
      });
    }

    // Check if this is a verified purchase
    let isVerifiedPurchase = false;
    const userOrders = await Order.find({
      user: userId,
      status: 'delivered',
      'items.product': productId
    });
    
    if (userOrders.length > 0) {
      isVerifiedPurchase = true;
    }

    const review = await Review.create({
      product: productId,
      user: userId,
      order: orderId,
      rating,
      title,
      comment,
      pros,
      cons,
      images,
      isVerifiedPurchase,
      isApproved: true // Auto-approve for now
    });

    await review.populate('user', 'firstName lastName avatar');

    res.status(201).json({
      success: true,
      message: 'تم إضافة التقييم بنجاح',
      data: review
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ'
    });
  }
});

// @route   PUT /api/reviews/:id
// @desc    Update a review
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const userId = await getUser(req);
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'غير مصرح'
      });
    }

    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'التقييم غير موجود'
      });
    }

    if (review.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح'
      });
    }

    const { rating, title, comment, pros, cons } = req.body;

    review.rating = rating || review.rating;
    review.title = title || review.title;
    review.comment = comment || review.comment;
    review.pros = pros || review.pros;
    review.cons = cons || review.cons;
    review.isEdited = true;

    await review.save();

    res.json({
      success: true,
      message: 'تم تحديث التقييم',
      data: review
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'حدث خطأ'
    });
  }
});

// @route   DELETE /api/reviews/:id
// @desc    Delete a review
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const userId = await getUser(req);
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'غير مصرح'
      });
    }

    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'التقييم غير موجود'
      });
    }

    if (review.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح'
      });
    }

    await review.remove();

    res.json({
      success: true,
      message: 'تم حذف التقييم'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'حدث خطأ'
    });
  }
});

// @route   POST /api/reviews/:id/helpful
// @desc    Mark review as helpful
// @access  Private
router.post('/:id/helpful', async (req, res) => {
  try {
    const userId = await getUser(req);
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'يجب تسجيل الدخول'
      });
    }

    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'التقييم غير موجود'
      });
    }

    // Check if user already marked as helpful
    if (review.helpful.users.includes(userId)) {
      // Remove helpful
      review.helpful.users = review.helpful.users.filter(
        id => id.toString() !== userId
      );
      review.helpful.count -= 1;
    } else {
      // Add helpful
      review.helpful.users.push(userId);
      review.helpful.count += 1;
    }

    await review.save();

    res.json({
      success: true,
      data: { helpful: review.helpful.count }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'حدث خطأ'
    });
  }
});

module.exports = router;
