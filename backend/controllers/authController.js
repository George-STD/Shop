const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const { sendVerificationEmail, sendPasswordResetEmail, generateVerificationCode } = require('../utils/mailer');
const { MESSAGES } = require('../constants');
const { sendSuccess, sendError, sendNotFound, sendCreated } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

exports.register = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { firstName, lastName, email, phone, password } = req.body;
  const existingUser = await User.findOne({ email });

  if (existingUser) {
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
    return res.status(400).json({ success: false, message: MESSAGES.AUTH.EMAIL_EXISTS });
  }

  const code = generateVerificationCode();
  const user = await User.create({
    firstName, lastName, email, phone, password,
    isVerified: false,
    emailVerificationCode: code,
    emailVerificationExpires: new Date(Date.now() + 10 * 60 * 1000)
  });

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
}, MESSAGES.GENERAL.ERROR);

exports.verifyEmail = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { email, code } = req.body;
  const user = await User.findOne({ email });

  if (!user) return res.status(400).json({ success: false, message: MESSAGES.AUTH.USER_NOT_FOUND });
  if (user.isVerified) return res.status(400).json({ success: false, message: MESSAGES.AUTH.VERIFICATION_ALREADY_DONE });
  if (user.emailVerificationCode !== code) return res.status(400).json({ success: false, message: MESSAGES.AUTH.VERIFICATION_CODE_INVALID });
  if (user.emailVerificationExpires < new Date()) return res.status(400).json({ success: false, message: MESSAGES.AUTH.VERIFICATION_CODE_EXPIRED });

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
        id: user._id, firstName: user.firstName, lastName: user.lastName,
        email: user.email, phone: user.phone, role: user.role
      },
      token
    }
  });
}, MESSAGES.GENERAL.ERROR);

exports.resendCode = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) return res.status(400).json({ success: false, message: MESSAGES.AUTH.USER_NOT_FOUND });
  if (user.isVerified) return res.status(400).json({ success: false, message: MESSAGES.AUTH.VERIFICATION_ALREADY_DONE });

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
}, MESSAGES.GENERAL.ERROR);

exports.login = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ success: false, message: MESSAGES.AUTH.LOGIN_FAILED });
  }

  if (!user.isActive) {
    return res.status(401).json({ success: false, message: MESSAGES.AUTH.ACCOUNT_INACTIVE });
  }

  if (!user.isVerified) {
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

  await User.findByIdAndUpdate(user._id, { $set: { lastLogin: new Date() } });
  const token = generateToken(user._id);

  res.json({
    success: true,
    message: MESSAGES.AUTH.LOGIN_SUCCESS,
    data: {
      user: {
        id: user._id, firstName: user.firstName, lastName: user.lastName,
        email: user.email, phone: user.phone, role: user.role
      },
      token
    }
  });
}, MESSAGES.GENERAL.ERROR);

exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('wishlist', 'name slug price images');
  if (!user) return sendNotFound(res, MESSAGES.AUTH.USER_NOT_FOUND);
  sendSuccess(res, { data: user });
}, MESSAGES.GENERAL.ERROR);

exports.updateProfile = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { firstName, lastName, phone } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { firstName, lastName, phone },
    { new: true, runValidators: true }
  );

  sendSuccess(res, { data: user, message: MESSAGES.AUTH.PROFILE_UPDATED });
}, MESSAGES.GENERAL.ERROR);

exports.changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');
  const { currentPassword, newPassword } = req.body;

  if (!(await user.comparePassword(currentPassword))) {
    return res.status(400).json({ success: false, message: MESSAGES.AUTH.PASSWORD_INCORRECT });
  }

  const hashedNewPassword = await bcrypt.hash(newPassword, 12);
  await User.findByIdAndUpdate(req.user._id, { $set: { password: hashedNewPassword } });
  sendSuccess(res, { message: MESSAGES.AUTH.PASSWORD_CHANGED });
}, MESSAGES.GENERAL.ERROR);

exports.requestEmailChange = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { newEmail } = req.body;
  const user = await User.findById(req.user._id);

  if (user.email === newEmail.toLowerCase()) {
    return res.status(400).json({ success: false, message: MESSAGES.AUTH.EMAIL_CHANGE_SAME });
  }

  const existingUser = await User.findOne({ email: newEmail.toLowerCase() });
  if (existingUser) {
    return res.status(400).json({ success: false, message: MESSAGES.AUTH.EMAIL_CHANGE_EXISTS });
  }

  const code = generateVerificationCode();
  const expiry = new Date(Date.now() + 10 * 60 * 1000);

  await User.findByIdAndUpdate(user._id, {
    pendingEmail: newEmail.toLowerCase(),
    emailChangeCode: code,
    emailChangeExpires: expiry
  });

  try {
    await sendVerificationEmail(user.email, code, user.firstName);
    return res.json({ success: true, message: MESSAGES.AUTH.EMAIL_CHANGE_CODE_SENT });
  } catch (emailError) {
    console.error('Email send error:', emailError);
    return res.status(500).json({ success: false, message: MESSAGES.AUTH.EMAIL_SEND_FAILED });
  }
}, MESSAGES.GENERAL.ERROR);

exports.verifyEmailChange = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { code } = req.body;
  const user = await User.findById(req.user._id);

  if (!user.pendingEmail || !user.emailChangeCode) {
    return res.status(400).json({ success: false, message: MESSAGES.AUTH.EMAIL_CHANGE_NO_PENDING });
  }

  if (user.emailChangeExpires < new Date()) {
    await User.findByIdAndUpdate(user._id, { $unset: { pendingEmail: 1, emailChangeCode: 1, emailChangeExpires: 1 } });
    return res.status(400).json({ success: false, message: MESSAGES.AUTH.EMAIL_CHANGE_CODE_EXPIRED });
  }

  if (user.emailChangeCode !== code) {
    return res.status(400).json({ success: false, message: MESSAGES.AUTH.EMAIL_CHANGE_CODE_INVALID });
  }

  const newEmail = user.pendingEmail;
  await User.findByIdAndUpdate(user._id, {
    email: newEmail,
    $unset: { pendingEmail: 1, emailChangeCode: 1, emailChangeExpires: 1 }
  });

  const updatedUser = await User.findById(user._id).select('-password').populate('wishlist', 'name slug price images');
  return res.json({ success: true, message: MESSAGES.AUTH.EMAIL_CHANGE_SUCCESS, data: { user: updatedUser } });
}, MESSAGES.GENERAL.ERROR);

exports.addToWishlist = asyncHandler(async (req, res) => {
  if (req.user.wishlist.includes(req.params.productId)) {
    return res.status(400).json({ success: false, message: MESSAGES.WISHLIST.ALREADY_EXISTS });
  }
  await User.findByIdAndUpdate(req.user._id, { $addToSet: { wishlist: req.params.productId } });
  sendSuccess(res, { message: MESSAGES.WISHLIST.ADDED });
}, MESSAGES.GENERAL.ERROR);

exports.removeFromWishlist = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $pull: { wishlist: req.params.productId } });
  sendSuccess(res, { message: MESSAGES.WISHLIST.REMOVED });
}, MESSAGES.GENERAL.ERROR);

exports.forgotPassword = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) return res.json({ success: true, message: MESSAGES.AUTH.PASSWORD_RESET_GENERIC });

  const code = generateVerificationCode();
  await User.findByIdAndUpdate(user._id, {
    $set: { resetPasswordToken: code, resetPasswordExpires: new Date(Date.now() + 10 * 60 * 1000) }
  });

  try {
    await sendPasswordResetEmail(email, code);
  } catch (emailError) {
    console.error('Password reset email error:', emailError.message);
    return res.status(500).json({ success: false, message: MESSAGES.AUTH.EMAIL_SEND_FAILED_RETRY });
  }

  res.json({ success: true, message: MESSAGES.AUTH.PASSWORD_RESET_SENT });
}, MESSAGES.GENERAL.ERROR);

exports.verifyResetCode = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { email, code } = req.body;
  const user = await User.findOne({ email });

  if (!user) return res.status(400).json({ success: false, message: MESSAGES.AUTH.USER_NOT_FOUND });
  if (user.resetPasswordToken !== code) return res.status(400).json({ success: false, message: MESSAGES.AUTH.VERIFICATION_CODE_INVALID });
  if (user.resetPasswordExpires < new Date()) return res.status(400).json({ success: false, message: MESSAGES.AUTH.CODE_EXPIRED });

  res.json({ success: true, message: MESSAGES.AUTH.CODE_VALID });
}, MESSAGES.GENERAL.ERROR);

exports.resetPassword = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { email, code, newPassword } = req.body;
  const user = await User.findOne({ email }).select('+password');

  if (!user) return res.status(400).json({ success: false, message: MESSAGES.AUTH.USER_NOT_FOUND });
  if (user.resetPasswordToken !== code) return res.status(400).json({ success: false, message: MESSAGES.AUTH.VERIFICATION_CODE_INVALID });
  if (user.resetPasswordExpires < new Date()) return res.status(400).json({ success: false, message: MESSAGES.AUTH.CODE_EXPIRED });

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await User.findByIdAndUpdate(user._id, {
    $set: { password: hashedPassword },
    $unset: { resetPasswordToken: 1, resetPasswordExpires: 1 }
  });

  res.json({ success: true, message: MESSAGES.AUTH.PASSWORD_LOGIN_PROMPT });
}, MESSAGES.GENERAL.ERROR);
