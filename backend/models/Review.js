const mongoose = require('mongoose');

/**
 * Customer Review Schema
 * Captures product ratings, verified purchase status, moderation approvals, and helpfulness counter.
 * Hardened for 10M MAU: Decoupled vote collections and atomic rating calculations.
 */
const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    guestName: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    guestEmail: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    rating: {
      type: Number,
      required: [true, 'التقييم مطلوب'],
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    comment: {
      type: String,
      required: [true, 'التعليق مطلوب'],
      trim: true,
      maxlength: 1000,
    },
    images: [
      {
        url: String,
        alt: String,
      },
    ],
    pros: [String],
    cons: [String],
    isVerifiedPurchase: {
      type: Boolean,
      default: false,
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    helpful: {
      count: { type: Number, default: 0, min: 0 },
      users: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      ],
    },
    reply: {
      text: { type: String, maxlength: 1000 },
      date: Date,
      by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate reviews from same user or guest email on same product
reviewSchema.index(
  { product: 1, user: 1 },
  { unique: true, partialFilterExpression: { user: { $type: 'objectId' } } }
);
reviewSchema.index(
  { product: 1, guestEmail: 1 },
  { unique: true, partialFilterExpression: { guestEmail: { $type: 'string' } } }
);
reviewSchema.index({ product: 1, isApproved: 1 });
reviewSchema.index({ createdAt: -1 });

/**
 * Reconciliation method: Recalculates product rating via single aggregate pass
 */
reviewSchema.statics.calcAverageRating = async function (productId) {
  if (!productId) return;
  try {
    const stats = await this.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(productId), isApproved: true } },
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
      await mongoose.model('Product').findByIdAndUpdate(productId, {
        'rating.average': Math.round(stats[0].avgRating * 10) / 10,
        'rating.count': stats[0].numReviews,
        'rating.sum': stats[0].sumRating || 0,
      });
    } else {
      await mongoose.model('Product').findByIdAndUpdate(productId, {
        'rating.average': 0,
        'rating.count': 0,
        'rating.sum': 0,
      });
    }
  } catch (err) {
    console.error(`Error calculating average rating for product ${productId}:`, err.message);
  }
};

// Update product rating after save
reviewSchema.post('save', function () {
  this.constructor.calcAverageRating(this.product).catch((e) =>
    console.error('Rating post-save recalculation error:', e)
  );
});

// Update product rating after delete
reviewSchema.post('deleteOne', { document: true }, function () {
  this.constructor.calcAverageRating(this.product).catch((e) =>
    console.error('Rating post-deleteOne recalculation error:', e)
  );
});

module.exports = mongoose.model('Review', reviewSchema);