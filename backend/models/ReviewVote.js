const mongoose = require('mongoose');

/**
 * Review Vote Schema
 * Decouples review helpfulness votes from the Review document, eliminating the 16MB BSON limit barrier on viral reviews.
 */
const reviewVoteSchema = new mongoose.Schema(
  {
    review: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Review',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

// Enforce single vote per user per review at the database engine level
reviewVoteSchema.index({ review: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('ReviewVote', reviewVoteSchema);
