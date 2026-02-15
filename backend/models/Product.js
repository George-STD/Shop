const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'اسم المنتج مطلوب'],
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    required: [true, 'وصف المنتج مطلوب']
  },
  shortDescription: {
    type: String
  },
  price: {
    type: Number,
    required: [true, 'السعر مطلوب'],
    min: 0
  },
  oldPrice: {
    type: Number,
    default: null
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  images: [{
    url: String,
    alt: String
  }],
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  subcategory: {
    type: String
  },
  tags: [String],
  occasions: [{
    type: String,
    enum: ['birthday', 'wedding', 'graduation', 'valentine', 'mothers-day', 'ramadan', 'eid', 'newborn', 'anniversary', 'get-well', 'thank-you', 'congratulations']
  }],
  recipients: [{
    type: String,
    enum: ['wife', 'husband', 'mother', 'father', 'friend', 'colleague', 'child', 'boyfriend', 'girlfriend', 'boss', 'teacher', 'anyone']
  }],
  budgetRange: {
    type: String,
    enum: ['under-100', '100-300', '300-500', '500-1000', 'above-1000']
  },
  stock: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  sku: {
    type: String,
    unique: true
  },
  sizes: [{
    name: String,
    price: Number
  }],
  colors: [{
    name: String,
    hex: String,
    image: String
  }],
  addons: [{
    name: String,
    price: Number,
    image: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isNewArrival: {
    type: Boolean,
    default: false
  },
  isBestseller: {
    type: Boolean,
    default: false
  },
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 }
  },
  salesCount: {
    type: Number,
    default: 0
  },
  views: {
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

// Index for search
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ price: 1 });
productSchema.index({ category: 1 });
productSchema.index({ occasions: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Product', productSchema);
