const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const addressSchema = new mongoose.Schema({
  label: { type: String, default: 'المنزل', maxlength: 50 },
  firstName: { type: String, maxlength: 50 },
  lastName: { type: String, maxlength: 50 },
  phone: { type: String, maxlength: 20 },
  governorate: { type: String, maxlength: 100 },
  city: { type: String, maxlength: 100 },
  area: { type: String, maxlength: 100 },
  street: { type: String, maxlength: 200 },
  building: { type: String, maxlength: 50 },
  floor: { type: String, maxlength: 50 },
  apartment: { type: String, maxlength: 50 },
  landmark: { type: String, maxlength: 200 },
  isDefault: { type: Boolean, default: false }
});

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
    maxlength: 100
  },
  phone: {
    type: String,
    required: [true, 'رقم الهاتف مطلوب'],
    maxlength: 20
  },
  password: {
    type: String,
    required: [true, 'كلمة المرور مطلوبة'],
    minlength: 6,
    select: false
  },
  avatar: String,
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
    balance: { type: Number, default: 0 },
    transactions: [{
      type: { type: String, enum: ['credit', 'debit'] },
      amount: Number,
      description: String,
      date: { type: Date, default: Date.now }
    }]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationCode: String,
  emailVerificationExpires: Date,
  lastLogin: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  pendingEmail: String,
  emailChangeCode: String,
  emailChangeExpires: Date
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

module.exports = mongoose.model('User', userSchema);
