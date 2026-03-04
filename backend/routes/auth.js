const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { sendVerificationEmail, sendPasswordResetEmail, generateVerificationCode } = require('../utils/mailer');
const { loginLimiter } = require('../middleware/auth');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// @route   POST /api/auth/register
// @desc    Register new user (sends verification code to email)
// @access  Public
router.post('/register', [
  body('firstName').trim().notEmpty().withMessage('الاسم الأول مطلوب'),
  body('lastName').trim().notEmpty().withMessage('الاسم الأخير مطلوب'),
  body('email').isEmail().withMessage('البريد الإلكتروني غير صالح'),
  body('phone').notEmpty().withMessage('رقم الهاتف مطلوب'),
  body('password').isLength({ min: 6 }).withMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { firstName, lastName, email, phone, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      // If user exists but not verified, allow re-registration with new code
      if (!existingUser.isVerified) {
        const code = generateVerificationCode();
        const hashedPassword = await bcrypt.hash(password, 12);
        await User.findByIdAndUpdate(existingUser._id, {
          $set: {
            firstName, lastName, phone,
            password: hashedPassword,
            emailVerificationCode: code,
            emailVerificationExpires: new Date(Date.now() + 10 * 60 * 1000)
          }
        });

        let emailSent = false;
        try {
          await sendVerificationEmail(email, code);
          emailSent = true;
        } catch (emailError) {
          console.error('Email send error:', emailError.message);
        }

        return res.status(200).json({
          success: true,
          message: emailSent ? 'تم إرسال كود التحقق إلى بريدك الإلكتروني' : 'تم إنشاء الحساب لكن فشل إرسال الكود. جرب إعادة الإرسال',
          data: { email, requiresVerification: true, emailSent }
        });
      }
      return res.status(400).json({
        success: false,
        message: 'البريد الإلكتروني مسجل مسبقاً'
      });
    }

    // Generate verification code
    const code = generateVerificationCode();

    // Create user (not verified yet)
    const user = await User.create({
      firstName,
      lastName,
      email,
      phone,
      password,
      isVerified: false,
      emailVerificationCode: code,
      emailVerificationExpires: new Date(Date.now() + 10 * 60 * 1000) // 10 min
    });

    // Send verification email
    let emailSent = false;
    try {
      await sendVerificationEmail(email, code);
      emailSent = true;
    } catch (emailError) {
      console.error('Email send error:', emailError.message);
    }

    res.status(201).json({
      success: true,
      message: emailSent ? 'تم إرسال كود التحقق إلى بريدك الإلكتروني' : 'تم إنشاء الحساب لكن فشل إرسال الكود. جرب إعادة الإرسال',
      data: { email, requiresVerification: true, emailSent }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إنشاء الحساب'
    });
  }
});

// @route   POST /api/auth/verify-email
// @desc    Verify email with code
// @access  Public
router.post('/verify-email', [
  body('email').isEmail().withMessage('البريد الإلكتروني غير صالح'),
  body('code').isLength({ min: 6, max: 6 }).withMessage('الكود يجب أن يكون 6 أرقام')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, code } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ success: false, message: 'المستخدم غير موجود' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'الحساب مفعّل بالفعل' });
    }

    if (user.emailVerificationCode !== code) {
      return res.status(400).json({ success: false, message: 'الكود غير صحيح' });
    }

    if (user.emailVerificationExpires < new Date()) {
      return res.status(400).json({ success: false, message: 'الكود منتهي الصلاحية. أعد إرسال كود جديد' });
    }

    // Verify user using findByIdAndUpdate to bypass pre-save hooks
    await User.findByIdAndUpdate(user._id, {
      $set: { isVerified: true, lastLogin: new Date() },
      $unset: { emailVerificationCode: 1, emailVerificationExpires: 1 }
    });

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'تم تأكيد الحساب بنجاح',
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء التحقق' });
  }
});

// @route   POST /api/auth/resend-code
// @desc    Resend verification code
// @access  Public
router.post('/resend-code', [
  body('email').isEmail().withMessage('البريد الإلكتروني غير صالح')
], async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ success: false, message: 'المستخدم غير موجود' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'الحساب مفعّل بالفعل' });
    }

    const code = generateVerificationCode();
    await User.findByIdAndUpdate(user._id, {
      $set: {
        emailVerificationCode: code,
        emailVerificationExpires: new Date(Date.now() + 10 * 60 * 1000)
      }
    });

    try {
      await sendVerificationEmail(email, code);
    } catch (emailError) {
      console.error('Resend code email error:', emailError.message);
      return res.status(500).json({ success: false, message: 'فشل في إرسال البريد. تأكد من إعدادات SMTP وأعد المحاولة' });
    }

    res.json({ success: true, message: 'تم إرسال كود جديد إلى بريدك الإلكتروني' });
  } catch (error) {
    console.error('Resend code error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', loginLimiter, [
  body('email').isEmail().withMessage('البريد الإلكتروني غير صالح'),
  body('password').notEmpty().withMessage('كلمة المرور مطلوبة')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user with password
    const user = await User.findOne({ email }).select('+password');
    
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'الحساب غير مفعل'
      });
    }

    // Check if email is verified
    if (!user.isVerified) {
      // Send a new verification code
      const code = generateVerificationCode();
      await User.findByIdAndUpdate(user._id, {
        $set: {
          emailVerificationCode: code,
          emailVerificationExpires: new Date(Date.now() + 10 * 60 * 1000)
        }
      });

      let emailSent = false;
      try {
        await sendVerificationEmail(email, code);
        emailSent = true;
      } catch (emailError) {
        console.error('Verification email error:', emailError.message);
      }

      return res.status(403).json({
        success: false,
        message: emailSent ? 'يجب تأكيد بريدك الإلكتروني أولاً. تم إرسال كود جديد' : 'يجب تأكيد بريدك الإلكتروني. فشل إرسال الكود، جرب إعادة الإرسال',
        data: { email, requiresVerification: true, emailSent }
      });
    }

    // Update last login
    await User.findByIdAndUpdate(user._id, { $set: { lastLogin: new Date() } });

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تسجيل الدخول'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', async (req, res) => {
  try {
    // Get token from header
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'غير مصرح'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id)
      .populate('wishlist', 'name slug price images');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'غير مصرح'
    });
  }
});

// @route   PUT /api/auth/update-profile
// @desc    Update user profile
// @access  Private
router.put('/update-profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'غير مصرح'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const { firstName, lastName, phone } = req.body;
    
    const user = await User.findByIdAndUpdate(
      decoded.id,
      { firstName, lastName, phone },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'تم تحديث البيانات بنجاح',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'حدث خطأ'
    });
  }
});

// @route   PUT /api/auth/change-password
// @desc    Change password
// @access  Private
router.put('/change-password', [
  body('currentPassword').notEmpty().withMessage('كلمة المرور الحالية مطلوبة'),
  body('newPassword').isLength({ min: 6 }).withMessage('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل')
], async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'غير مصرح'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('+password');

    const { currentPassword, newPassword } = req.body;

    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({
        success: false,
        message: 'كلمة المرور الحالية غير صحيحة'
      });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    await User.findByIdAndUpdate(decoded.id, { $set: { password: hashedNewPassword } });

    res.json({
      success: true,
      message: 'تم تغيير كلمة المرور بنجاح'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'حدث خطأ'
    });
  }
});

// @route   POST /api/auth/wishlist/:productId
// @desc    Add product to wishlist
// @access  Private
router.post('/wishlist/:productId', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'غير مصرح'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (user.wishlist.includes(req.params.productId)) {
      return res.status(400).json({
        success: false,
        message: 'المنتج موجود في قائمة الأمنيات'
      });
    }

    await User.findByIdAndUpdate(decoded.id, {
      $addToSet: { wishlist: req.params.productId }
    });

    res.json({
      success: true,
      message: 'تمت الإضافة إلى قائمة الأمنيات'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'حدث خطأ'
    });
  }
});

// @route   DELETE /api/auth/wishlist/:productId
// @desc    Remove product from wishlist
// @access  Private
router.delete('/wishlist/:productId', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'غير مصرح'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    await User.findByIdAndUpdate(decoded.id, {
      $pull: { wishlist: req.params.productId }
    });

    res.json({
      success: true,
      message: 'تمت الإزالة من قائمة الأمنيات'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'حدث خطأ'
    });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Send password reset code to email
// @access  Public
router.post('/forgot-password', loginLimiter, [
  body('email').isEmail().withMessage('البريد الإلكتروني غير صالح')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email } = req.body;
    const user = await User.findOne({ email });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ success: true, message: 'إذا كان البريد مسجلاً، سيتم إرسال كود إعادة التعيين' });
    }

    const code = generateVerificationCode();
    await User.findByIdAndUpdate(user._id, {
      $set: {
        resetPasswordToken: code,
        resetPasswordExpires: new Date(Date.now() + 10 * 60 * 1000)
      }
    });

    try {
      await sendPasswordResetEmail(email, code);
    } catch (emailError) {
      console.error('Password reset email error:', emailError.message);
      return res.status(500).json({ success: false, message: 'فشل في إرسال البريد. أعد المحاولة لاحقاً' });
    }

    res.json({ success: true, message: 'تم إرسال كود إعادة التعيين إلى بريدك الإلكتروني' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ' });
  }
});

// @route   POST /api/auth/verify-reset-code
// @desc    Verify the password reset code
// @access  Public
router.post('/verify-reset-code', [
  body('email').isEmail().withMessage('البريد الإلكتروني غير صالح'),
  body('code').isLength({ min: 6, max: 6 }).withMessage('الكود يجب أن يكون 6 أرقام')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, code } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ success: false, message: 'المستخدم غير موجود' });
    }

    if (user.resetPasswordToken !== code) {
      return res.status(400).json({ success: false, message: 'الكود غير صحيح' });
    }

    if (user.resetPasswordExpires < new Date()) {
      return res.status(400).json({ success: false, message: 'الكود منتهي الصلاحية. أعد المحاولة' });
    }

    res.json({ success: true, message: 'الكود صحيح' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'حدث خطأ' });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password with verified code
// @access  Public
router.post('/reset-password', [
  body('email').isEmail().withMessage('البريد الإلكتروني غير صالح'),
  body('code').isLength({ min: 6, max: 6 }).withMessage('الكود غير صالح'),
  body('newPassword').isLength({ min: 6 }).withMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, code, newPassword } = req.body;
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(400).json({ success: false, message: 'المستخدم غير موجود' });
    }

    if (user.resetPasswordToken !== code) {
      return res.status(400).json({ success: false, message: 'الكود غير صحيح' });
    }

    if (user.resetPasswordExpires < new Date()) {
      return res.status(400).json({ success: false, message: 'الكود منتهي الصلاحية' });
    }

    // Hash password manually since we're bypassing pre-save hook
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await User.findByIdAndUpdate(user._id, {
      $set: { password: hashedPassword },
      $unset: { resetPasswordToken: 1, resetPasswordExpires: 1 }
    });

    res.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ' });
  }
});

module.exports = router;
