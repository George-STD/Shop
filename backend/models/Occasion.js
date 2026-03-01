const mongoose = require('mongoose');

const occasionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'اسم المناسبة مطلوب'],
    unique: true,
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    trim: true
  },
  icon: {
    type: String,
    default: '🎉'
  },
  color: {
    type: String,
    default: 'from-purple-400 to-purple-600'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Auto-generate slug from name
occasionSchema.pre('save', function (next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\u0600-\u06FFa-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .trim();
  }
  next();
});

occasionSchema.index({ isActive: 1, order: 1 });

module.exports = mongoose.model('Occasion', occasionSchema);
