const mongoose = require('mongoose');
const { roundTo2Decimals } = require('../utils/money');

/**
 * Master Product Schema
 * Represents standalone gift items, pre-assembled ready boxes (isReadyBox), and customizable boxes (isCustomBox).
 * Hardened for 10M MAU: Integer stock validation, variant-level SKU stock, IEEE-754 money precision, and query-aligned ESR indexes.
 */
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'اسم المنتج مطلوب'],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'وصف المنتج مطلوب'],
      trim: true,
    },
    shortDescription: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'السعر مطلوب'],
      min: 0,
      set: (v) => (v === null || v === undefined ? v : roundTo2Decimals(v)),
    },
    oldPrice: {
      type: Number,
      default: null,
      min: [0, 'السعر الأصلي لا يمكن أن يكون سالباً'],
      set: (v) => (v === null || v === undefined ? v : roundTo2Decimals(v)),
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    images: [
      {
        url: String,
        alt: String,
        variantTags: {
          type: Map,
          of: String,
        },
      },
    ],
    category: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
      },
    ],
    subcategory: {
      type: String,
    },
    tags: [String],
    occasions: [
      {
        type: String,
      },
    ],
    recipients: [
      {
        type: String,
        enum: ['زوجة', 'زوج', 'أم', 'أب', 'أخت', 'أخ', 'صديقة', 'صديق', 'أطفال', 'عروسين'],
      },
    ],
    budgetRange: {
      type: String,
      enum: ['under-100', '100-300', '300-500', '500-1000', 'above-1000'],
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} يجب أن يكون عدداً صحيحاً للمخزون',
      },
    },
    isReadyBox: {
      type: Boolean,
      default: false,
    },
    autoCalculatePrice: {
      type: Boolean,
      default: true,
    },
    includedProducts: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
          validate: {
            validator: Number.isInteger,
            message: '{VALUE} يجب أن تكون كمية صحيحة',
          },
        },
      },
    ],
    sku: {
      type: String,
      unique: true,
      sparse: true,
    },
    sizes: [
      {
        name: String,
        price: {
          type: Number,
          min: [0, 'سعر المقاس لا يمكن أن يكون سالباً'],
          set: (v) => (v === null || v === undefined ? v : roundTo2Decimals(v)),
        },
        stock: {
          type: Number,
          min: [0, 'مخزون المقاس لا يمكن أن يكون سالباً'],
          default: null,
        },
        sku: {
          type: String,
          trim: true,
        },
      },
    ],
    colors: [
      {
        name: String,
        hex: String,
        image: String,
        stock: {
          type: Number,
          min: [0, 'مخزون اللون لا يمكن أن يكون سالباً'],
          default: null,
        },
        sku: {
          type: String,
          trim: true,
        },
      },
    ],
    shapes: [
      {
        name: String,
        images: [String],
        stock: {
          type: Number,
          min: [0, 'مخزون الشكل لا يمكن أن يكون سالباً'],
          default: null,
        },
      },
    ],
    addons: [
      {
        name: String,
        price: {
          type: Number,
          min: [0, 'سعر الإضافة لا يمكن أن يكون سالباً'],
          set: (v) => (v === null || v === undefined ? v : roundTo2Decimals(v)),
        },
        image: String,
      },
    ],
    variantGroups: [
      {
        name: String,
        replaceMainImage: { type: Boolean, default: false },
        defaultOption: String,
        options: [
          {
            name: String,
            thumbnail: String,
            stock: {
              type: Number,
              min: [0, 'مخزون الخيار لا يمكن أن يكون سالباً'],
              default: null,
            },
            priceDelta: {
              type: Number,
              default: 0,
              set: (v) => (v === null || v === undefined ? 0 : roundTo2Decimals(v)),
            },
            sku: {
              type: String,
              trim: true,
            },
          },
        ],
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isNewArrival: {
      type: Boolean,
      default: false,
    },
    isBestseller: {
      type: Boolean,
      default: false,
    },
    isCustomBox: {
      type: Boolean,
      default: false,
    },
    boxSlots: [
      {
        slotLabel: { type: String, required: true },
        required: { type: Boolean, default: true },
        options: [
          {
            name: String,
            images: [String],
          },
        ],
      },
    ],
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0, min: 0 },
      sum: { type: Number, default: 0, min: 0 },
    },
    canBeAddedToBox: {
      type: Boolean,
      default: false,
    },
    boxDiscount: {
      type: Number,
      default: 25,
      min: 0,
      max: 100,
    },
    salesCount: {
      type: Number,
      default: 0,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} يجب أن يكون عدداً صحيحاً',
      },
    },
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Sourcing Memory (Procurement suggestions)
    lastKnownCost: {
      type: Number,
      min: 0,
      default: null,
      set: (v) => (v === null || v === undefined ? v : roundTo2Decimals(v)),
    },
    lastKnownVendor: {
      type: String,
      trim: true,
      default: '',
    },
    seo: {
      metaTitle: String,
      metaDescription: String,
      keywords: [String],
    },
  },
  {
    timestamps: true,
  }
);

productSchema.pre('save', function (next) {
  if (this.oldPrice && this.oldPrice > this.price && this.price >= 0) {
    this.discount = Math.min(100, Math.max(0, Math.round(((this.oldPrice - this.price) / this.oldPrice) * 100)));
  } else if (this.oldPrice !== undefined && (!this.oldPrice || this.oldPrice <= this.price) && !this.isModified('discount')) {
    this.discount = 0;
  }
  next();
});

// -----------------------------------------------------------------------------
// Index Topology (Aligned with Query ESR: Equality, Sort, Range)
// -----------------------------------------------------------------------------
productSchema.index(
  { name: 'text', description: 'text', tags: 'text', shortDescription: 'text' },
  {
    name: 'product_text',
    default_language: 'none',
    weights: { name: 10, tags: 5, shortDescription: 3, description: 1 },
  }
);

productSchema.index({ isActive: 1, isFeatured: 1, createdAt: -1 });
productSchema.index({ isActive: 1, isBestseller: 1, salesCount: -1 });
productSchema.index({ isActive: 1, category: 1, price: 1 });
productSchema.index({ isActive: 1, isReadyBox: 1 });
productSchema.index({ isActive: 1, occasions: 1 });
productSchema.index({ isActive: 1, recipients: 1 });
productSchema.index({ isActive: 1, createdAt: -1 });
productSchema.index({ isActive: 1, 'rating.average': -1 });
productSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Product', productSchema);

