const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { loginLimiter, verifyLimiter, registerLimiter, protect } = require('../middleware/auth');
const { MESSAGES } = require('../constants');
const authController = require('../controllers/authController');

// @route   POST /api/auth/register
// @desc    Register new user (sends verification code to email)
// @access  Public
router.post('/register', registerLimiter, [
  body('firstName').trim().notEmpty().withMessage(MESSAGES.VALIDATION.FIRST_NAME_REQUIRED),
  body('lastName').trim().notEmpty().withMessage(MESSAGES.VALIDATION.LAST_NAME_REQUIRED),
  body('email').isEmail().withMessage(MESSAGES.VALIDATION.EMAIL_INVALID),
  body('phone').notEmpty().withMessage(MESSAGES.VALIDATION.PHONE_REQUIRED),
  body('password').isLength({ min: 6 }).withMessage(MESSAGES.VALIDATION.PASSWORD_MIN_LENGTH)
], authController.register);

// @route   POST /api/auth/verify-email
// @desc    Verify email with code
// @access  Public
router.post('/verify-email', verifyLimiter, [
  body('email').isEmail().withMessage(MESSAGES.VALIDATION.EMAIL_INVALID),
  body('code').isLength({ min: 6, max: 6 }).withMessage(MESSAGES.VALIDATION.CODE_LENGTH)
], authController.verifyEmail);

// @route   POST /api/auth/resend-code
// @desc    Resend verification code
// @access  Public
router.post('/resend-code', verifyLimiter, [
  body('email').isEmail().withMessage(MESSAGES.VALIDATION.EMAIL_INVALID)
], authController.resendCode);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', loginLimiter, [
  body('email').isEmail().withMessage(MESSAGES.VALIDATION.EMAIL_INVALID),
  body('password').notEmpty().withMessage(MESSAGES.VALIDATION.PASSWORD_REQUIRED)
], authController.login);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, authController.getMe);

// @route   PUT /api/auth/update-profile
// @desc    Update user profile
// @access  Private
router.put('/update-profile', protect, [
  body('firstName').optional().trim().isLength({ min: 2, max: 50 }).withMessage(MESSAGES.VALIDATION.FIRST_NAME_LENGTH),
  body('lastName').optional().trim().isLength({ min: 2, max: 50 }).withMessage(MESSAGES.VALIDATION.LAST_NAME_LENGTH),
  body('phone').optional().trim().notEmpty().withMessage(MESSAGES.VALIDATION.PHONE_REQUIRED),
], authController.updateProfile);

// @route   PUT /api/auth/change-password
// @desc    Change password
// @access  Private
router.put('/change-password', protect, [
  body('currentPassword').notEmpty().withMessage(MESSAGES.VALIDATION.CURRENT_PASSWORD_REQUIRED),
  body('newPassword').isLength({ min: 6 }).withMessage(MESSAGES.VALIDATION.NEW_PASSWORD_MIN_LENGTH)
], authController.changePassword);

// @route   POST /api/auth/request-email-change
// @desc    Request email change (sends verification code to current email)
// @access  Private
router.post('/request-email-change', protect, [
  body('newEmail').isEmail().withMessage(MESSAGES.VALIDATION.EMAIL_INVALID)
], authController.requestEmailChange);

// @route   POST /api/auth/verify-email-change
// @desc    Verify code and change email
// @access  Private
router.post('/verify-email-change', protect, [
  body('code').notEmpty().withMessage('كود التأكيد مطلوب')
], authController.verifyEmailChange);

// @route   POST /api/auth/wishlist/:productId
// @desc    Add product to wishlist
// @access  Private
router.post('/wishlist/:productId', protect, authController.addToWishlist);

// @route   DELETE /api/auth/wishlist/:productId
// @desc    Remove product from wishlist
// @access  Private
router.delete('/wishlist/:productId', protect, authController.removeFromWishlist);

// @route   POST /api/auth/forgot-password
// @desc    Send password reset code to email
// @access  Public
router.post('/forgot-password', loginLimiter, [
  body('email').isEmail().withMessage(MESSAGES.VALIDATION.EMAIL_INVALID)
], authController.forgotPassword);

// @route   POST /api/auth/verify-reset-code
// @desc    Verify the password reset code
// @access  Public
router.post('/verify-reset-code', verifyLimiter, [
  body('email').isEmail().withMessage(MESSAGES.VALIDATION.EMAIL_INVALID),
  body('code').isLength({ min: 6, max: 6 }).withMessage(MESSAGES.VALIDATION.CODE_LENGTH)
], authController.verifyResetCode);

// @route   POST /api/auth/reset-password
// @desc    Reset password with verified code
// @access  Public
router.post('/reset-password', verifyLimiter, [
  body('email').isEmail().withMessage(MESSAGES.VALIDATION.EMAIL_INVALID),
  body('code').isLength({ min: 6, max: 6 }).withMessage(MESSAGES.VALIDATION.CODE_INVALID),
  body('newPassword').isLength({ min: 6 }).withMessage(MESSAGES.VALIDATION.PASSWORD_MIN_LENGTH)
], authController.resetPassword);

module.exports = router;
