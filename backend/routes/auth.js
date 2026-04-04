const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { sendVerificationEmail, sendPasswordResetEmail, generateVerificationCode } = require('../utils/mailer');
const { loginLimiter, verifyLimiter, registerLimiter, protect } = require('../middleware/auth');
const { MESSAGES } = require('../constants');
const { sendSuccess, sendError, sendNotFound, sendCreated } = require('../utils/response');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// @route   POST /api/auth/register
// @desc    Register new user (sends verification code to email)
// @access  Public
router.post('/register', registerLimiter, [
  body('firstName').trim().notEmpty().withMessage(MESSAGES.VALIDATION.FIRST_NAME_REQUIRED),
  body('lastName').trim().notEmpty().withMessage(MESSAGES.VALIDATION.LAST_NAME_REQUIRED),
  body('email').isEmail().withMessage(MESSAGES.VALIDATION.EMAIL_INVALID),
  body('phone').notEmpty().withMessage(MESSAGES.VALIDATION.PHONE_REQUIRED),
  body('password').isLength({ min: 6 }).withMessage(MESSAGES.VALIDATION.PASSWORD_MIN_LENGTH)
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
          message: emailSent ? MESSAGES.AUTH.REGISTER_VERIFICATION_SENT : MESSAGES.AUTH.REGISTER_VERIFICATION_FAILED,
          data: { email, requiresVerification: true, emailSent }
        });
      }
      return res.status(400).json({
        success: false,
        message: MESSAGES.AUTH.EMAIL_EXISTS
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
      emailVerificationExpires: new Date(Date.now() + 10 * 60 * 1000)
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
      message: emailSent ? MESSAGES.AUTH.REGISTER_VERIFICATION_SENT : MESSAGES.AUTH.REGISTER_VERIFICATION_FAILED,
      data: { email, requiresVerification: true, emailSent }
    });
  } catch (error) {
    console.error('Registration error:', error);
    sendError(res, MESSAGES.GENERAL.ERROR);
  }
});

// @route   POST /api/auth/verify-email
// @desc    Verify email with code
// @access  Public
router.post('/verify-email', verifyLimiter, [
  body('email').isEmail().withMessage(MESSAGES.VALIDATION.EMAIL_INVALID),
  body('code').isLength({ min: 6, max: 6 }).withMessage(MESSAGES.VALIDATION.CODE_LENGTH)
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, code } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ success: false, message: MESSAGES.AUTH.USER_NOT_FOUND });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: MESSAGES.AUTH.VERIFICATION_ALREADY_DONE });
    }

    if (user.emailVerificationCode !== code) {
      return res.status(400).json({ success: false, message: MESSAGES.AUTH.VERIFICATION_CODE_INVALID });
    }

    if (user.emailVerificationExpires < new Date()) {
      return res.status(400).json({ success: false, message: MESSAGES.AUTH.VERIFICATION_CODE_EXPIRED });
    }

    // Verify user using findByIdAndUpdate to bypass pre-save hooks
    await User.findByIdAndUpdate(user._id, {
      $set: { isVerified: true, lastLogin: new Date() },
      $unset: { emailVerificationCode: 1, emailVerificationExpires: 1 }
    });

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: MESSAGES.AUTH.VERIFICATION_SUCCESS,
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
    sendError(res, MESSAGES.GENERAL.ERROR);
  }
});

// @route   POST /api/auth/resend-code
// @desc    Resend verification code
// @access  Public
router.post('/resend-code', verifyLimiter, [
  body('email').isEmail().withMessage(MESSAGES.VALIDATION.EMAIL_INVALID)
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ success: false, message: MESSAGES.AUTH.USER_NOT_FOUND });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: MESSAGES.AUTH.VERIFICATION_ALREADY_DONE });
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
      return res.status(500).json({ success: false, message: MESSAGES.AUTH.EMAIL_SEND_FAILED });
    }

    res.json({ success: true, message: MESSAGES.AUTH.VERIFICATION_CODE_SENT });
  } catch (error) {
    console.error('Resend code error:', error);
    sendError(res, MESSAGES.GENERAL.ERROR);
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', loginLimiter, [
  body('email').isEmail().withMessage(MESSAGES.VALIDATION.EMAIL_INVALID),
  body('password').notEmpty().withMessage(MESSAGES.VALIDATION.PASSWORD_REQUIRED)
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
        message: MESSAGES.AUTH.LOGIN_FAILED
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: MESSAGES.AUTH.ACCOUNT_INACTIVE
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
        message: emailSent ? MESSAGES.AUTH.VERIFICATION_REQUIRED_CODE_SENT : MESSAGES.AUTH.VERIFICATION_REQUIRED_CODE_FAILED,
        data: { email, requiresVerification: true, emailSent }
      });
    }

    // Update last login
    await User.findByIdAndUpdate(user._id, { $set: { lastLogin: new Date() } });

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: MESSAGES.AUTH.LOGIN_SUCCESS,
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
    sendError(res, MESSAGES.GENERAL.ERROR);
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('wishlist', 'name slug price images');

    if (!user) {
      return sendNotFound(res, MESSAGES.AUTH.USER_NOT_FOUND);
    }

    sendSuccess(res, user);
  } catch (error) {
    sendError(res, MESSAGES.GENERAL.ERROR);
  }
});

// @route   PUT /api/auth/update-profile
// @desc    Update user profile
// @access  Private
router.put('/update-profile', protect, [
  body('firstName').optional().trim().isLength({ min: 2, max: 50 }).withMessage(MESSAGES.VALIDATION.FIRST_NAME_LENGTH),
  body('lastName').optional().trim().isLength({ min: 2, max: 50 }).withMessage(MESSAGES.VALIDATION.LAST_NAME_LENGTH),
  body('phone').optional().trim().notEmpty().withMessage(MESSAGES.VALIDATION.PHONE_REQUIRED),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { firstName, lastName, phone } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { firstName, lastName, phone },
      { new: true, runValidators: true }
    );

    sendSuccess(res, user, MESSAGES.AUTH.PROFILE_UPDATED);
  } catch (error) {
    sendError(res, MESSAGES.GENERAL.ERROR);
  }
});

// @route   PUT /api/auth/change-password
// @desc    Change password
// @access  Private
router.put('/change-password', protect, [
  body('currentPassword').notEmpty().withMessage(MESSAGES.VALIDATION.CURRENT_PASSWORD_REQUIRED),
  body('newPassword').isLength({ min: 6 }).withMessage(MESSAGES.VALIDATION.NEW_PASSWORD_MIN_LENGTH)
], async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+password');

    const { currentPassword, newPassword } = req.body;

    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({
        success: false,
        message: MESSAGES.AUTH.PASSWORD_INCORRECT
      });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    await User.findByIdAndUpdate(req.user._id, { $set: { password: hashedNewPassword } });

    sendSuccess(res, null, MESSAGES.AUTH.PASSWORD_CHANGED);
  } catch (error) {
    sendError(res, MESSAGES.GENERAL.ERROR);
  }
});

// @route   POST /api/auth/wishlist/:productId
// @desc    Add product to wishlist
// @access  Private
router.post('/wishlist/:productId', protect, async (req, res) => {
  try {
    if (req.user.wishlist.includes(req.params.productId)) {
      return res.status(400).json({
        success: false,
        message: MESSAGES.WISHLIST.ALREADY_EXISTS
      });
    }

    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { wishlist: req.params.productId }
    });

    sendSuccess(res, null, MESSAGES.WISHLIST.ADDED);
  } catch (error) {
    sendError(res, MESSAGES.GENERAL.ERROR);
  }
});

// @route   DELETE /api/auth/wishlist/:productId
// @desc    Remove product from wishlist
// @access  Private
router.delete('/wishlist/:productId', protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { wishlist: req.params.productId }
    });

    sendSuccess(res, null, MESSAGES.WISHLIST.REMOVED);
  } catch (error) {
    sendError(res, MESSAGES.GENERAL.ERROR);
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Send password reset code to email
// @access  Public
router.post('/forgot-password', loginLimiter, [
  body('email').isEmail().withMessage(MESSAGES.VALIDATION.EMAIL_INVALID)
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
      return res.json({ success: true, message: MESSAGES.AUTH.PASSWORD_RESET_GENERIC });
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
      return res.status(500).json({ success: false, message: MESSAGES.AUTH.EMAIL_SEND_FAILED_RETRY });
    }

    res.json({ success: true, message: MESSAGES.AUTH.PASSWORD_RESET_SENT });
  } catch (error) {
    console.error('Forgot password error:', error);
    sendError(res, MESSAGES.GENERAL.ERROR);
  }
});

// @route   POST /api/auth/verify-reset-code
// @desc    Verify the password reset code
// @access  Public
router.post('/verify-reset-code', verifyLimiter, [
  body('email').isEmail().withMessage(MESSAGES.VALIDATION.EMAIL_INVALID),
  body('code').isLength({ min: 6, max: 6 }).withMessage(MESSAGES.VALIDATION.CODE_LENGTH)
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, code } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ success: false, message: MESSAGES.AUTH.USER_NOT_FOUND });
    }

    if (user.resetPasswordToken !== code) {
      return res.status(400).json({ success: false, message: MESSAGES.AUTH.VERIFICATION_CODE_INVALID });
    }

    if (user.resetPasswordExpires < new Date()) {
      return res.status(400).json({ success: false, message: MESSAGES.AUTH.CODE_EXPIRED });
    }

    res.json({ success: true, message: MESSAGES.AUTH.CODE_VALID });
  } catch (error) {
    sendError(res, MESSAGES.GENERAL.ERROR);
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password with verified code
// @access  Public
router.post('/reset-password', verifyLimiter, [
  body('email').isEmail().withMessage(MESSAGES.VALIDATION.EMAIL_INVALID),
  body('code').isLength({ min: 6, max: 6 }).withMessage(MESSAGES.VALIDATION.CODE_INVALID),
  body('newPassword').isLength({ min: 6 }).withMessage(MESSAGES.VALIDATION.PASSWORD_MIN_LENGTH)
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, code, newPassword } = req.body;
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(400).json({ success: false, message: MESSAGES.AUTH.USER_NOT_FOUND });
    }

    if (user.resetPasswordToken !== code) {
      return res.status(400).json({ success: false, message: MESSAGES.AUTH.VERIFICATION_CODE_INVALID });
    }

    if (user.resetPasswordExpires < new Date()) {
      return res.status(400).json({ success: false, message: MESSAGES.AUTH.CODE_EXPIRED });
    }

    // Hash password manually since we're bypassing pre-save hook
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await User.findByIdAndUpdate(user._id, {
      $set: { password: hashedPassword },
      $unset: { resetPasswordToken: 1, resetPasswordExpires: 1 }
    });

    res.json({ success: true, message: MESSAGES.AUTH.PASSWORD_LOGIN_PROMPT });
  } catch (error) {
    console.error('Reset password error:', error);
    sendError(res, MESSAGES.GENERAL.ERROR);
  }
});

module.exports = router;
