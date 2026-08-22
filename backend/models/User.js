const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * Address Sub-schema for customer shipping and billing
 */
const addressSchema = new mongoose.Schema({
  label: { type: String, default: 'المنزل', maxlength: 50 },
  firstName: { type: String, maxlength: 50, trim: true },
  lastName: { type: String, maxlength: 50, trim: true },
  phone: { type: String, maxlength: 20, trim: true },
  governorate: { type: String, maxlength: 100, trim: true },
  city: { type: String, maxlength: 100, trim: true },
  area: { type: String, maxlength: 100, trim: true },
  street: { type: String, maxlength: 200, trim: true },
  building: { type: String, maxlength: 50, trim: true },
  floor: { type: String, maxlength: 50, trim: true },
  apartment: { type: String, maxlength: 50, trim: true },
  landmark: { type: String, maxlength: 200, trim: true },
  isDefault: { type: Boolean, default: false }
}, { _id: true });

/**
 * Wallet Transaction Sub-schema
 */
const walletTransactionSchema = new mongoose.Schema({
  type: { type: String, enum: ['credit', 'debit'], required: true },
  amount: { type: Number, required: true, min: 0 },
  description: { type: String, maxlength: 250 },
  date: { type: Date, default: Date.now }
}, { _id: true });

/**
 * Points History Sub-schema (Append-only audit trail for loyalty points)
 */
const pointsHistorySchema = new mongoose.Schema({
  points: { type: Number, required: true },
  reason: { type: String, required: true, maxlength: 250 },
  type: { type: String, enum: ['EARNED', 'REDEEMED', 'REFUNDED', 'DEDUCTED'], required: true },
  createdAt: { type: Date, default: Date.now }
}, { _id: true });

/**
 * Master User Schema
 */
const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'الاسم الأول مطلوب'],
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: [true, 'الاسم الأخير مطلوب'],
    trim: true,
    maxlength: 50
  },
  email: {
    type: String,
    required: [true, 'البريد الإلكتروني مطلوب'],
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: 100
  },
  phone: {
    type: String,
    required: [true, 'رقم الهاتف مطلوب'],
    trim: true,
    maxlength: 20
  },
  password: {
    type: String,
    required: [true, 'كلمة المرور مطلوبة'],
    minlength: 6,
    select: false
  },
  pendingPassword: {
    type: String,
    select: false
  },
  avatar: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  addresses: [addressSchema],
  wishlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  wallet: {
    balance: {
      type: Number,
      default: 0,
      min: 0
    },
    transactions: [walletTransactionSchema]
  },
  loyaltyPoints: {
    type: Number,
    default: 0,
    min: 0
  },
  pointsHistory: [pointsHistorySchema],
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationCode: {
    type: String,
    select: false
  },
  emailVerificationExpires: {
    type: Date,
    select: false
  },
  lastLogin: {
    type: Date
  },
  resetPasswordToken: {
    type: String,
    select: false
  },
  resetPasswordExpires: {
    type: Date,
    select: false
  },
  pendingEmail: {
    type: String,
    lowercase: true,
    trim: true,
    select: false
  },
  emailChangeCode: {
    type: String,
    select: false
  },
  emailChangeExpires: {
    type: Date,
    select: false
  },
  tokenVersion: {
    type: Number,
    default: 0
  },
  passwordChangedAt: {
    type: Date
  }
}, {
  timestamps: true
});

/**
 * Pre-save Middleware: Hash password before persistence and track passwordChangedAt
 */
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  if (!this.isNew) {
    this.passwordChangedAt = new Date(Date.now() - 1000);
  }
  next();
});

/**
 * Instance Method: Compare candidate password with stored hash
 * @param {string} candidatePassword
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * Virtual: Full Name of User
 */
userSchema.virtual('fullName').get(function() {
  return `${this.firstName || ''} ${this.lastName || ''}`.trim();
});

// Primary compound indices for performance
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ 'pointsHistory.reason': 1 });

module.exports = mongoose.model('User', userSchema);
