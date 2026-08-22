const mongoose = require('mongoose');

/**
 * Product Category Schema
 * Supports hierarchical tree structures (parent-child), box filtering (showInBox), and SEO metadata.
 */
const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'اسم الفئة مطلوب'],
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  description: String,
  image: String,
  icon: String,
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  showInBox: {
    type: Boolean,
    default: false
  },
  productsCount: {
    type: Number,
    default: 0
  },
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String]
  }
}, {
  timestamps: true
});

categorySchema.pre('save', function(next) {
  if (this.parent && this._id && this.parent.equals(this._id)) {
    return next(new Error('لا يمكن أن تكون الفئة أباً لنفسها'));
  }
  next();
});

module.exports = mongoose.model('Category', categorySchema);
