const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const { sendVerificationEmail, sendPasswordResetEmail, generateVerificationCode } = require('../utils/mailer');
const { MESSAGES } = require('../constants');
const { sendSuccess, sendError, sendNotFound, sendCreated } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

// Syntactically valid bcrypt hash with no matching password, used to normalize timing on non-existent users
const DUMMY_BCRYPT_HASH = '$2a$12$CwTycUXWue0Thq9StjUM0uJ8Q0m8lJ8p5dNFYcz5v.0vYyYUnjq2G';

// Helper for timing-safe string comparison without throwing RangeError on length mismatch
const safeTimingEqual = (expected, actual) => {
  if (!expected || !actual) return false;
  const bufA = Buffer.from(String(expected));
  const bufB = Buffer.from(String(actual));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};

// Helper to hash short-lived codes (SHA-256) before storing in DB
const hashCode = (code) => {
  if (!code) return null;
  return crypto.createHash('sha256').update(String(code).trim()).digest('hex');
};

// Strictly verify hash without accepting raw hashes
const verifyCodeMatch = (storedCode, incomingCode) => {
  if (!storedCode || !incomingCode) return false;
  return safeTimingEqual(storedCode, hashCode(incomingCode));
};

// Generate JWT Token
const generateToken = (id, tokenVersion = 0) => {
  return jwt.sign({ id, v: tokenVersion }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

exports.register = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendError(res, { statusCode: 400, message: MESSAGES.GENERAL.VALIDATION_ERROR, errors: errors.array() });

  const normalizedEmail = String(req.body.email).toLowerCase().trim();
  const { firstName, lastName, phone, password } = req.body;
  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    if (!existingUser.isVerified) {
      const code = generateVerificationCode();
      const hashedPassword = await bcrypt.hash(password, 12);
      await User.findByIdAndUpdate(existingUser._id, {
        $set: {
          firstName, lastName, phone,
          pendingPassword: hashedPassword,
          emailVerificationCode: hashCode(code),
          emailVerificationExpires: new Date(Date.now() + 10 * 60 * 1000)
        }
      });

      let emailSent = false;
      try {
        await sendVerificationEmail(normalizedEmail, code);
        emailSent = true;
      } catch (emailError) {
        console.error('Email send error:', emailError.message);
      }

      return sendSuccess(res, {
        message: emailSent ? MESSAGES.AUTH.REGISTER_VERIFICATION_SENT : MESSAGES.AUTH.REGISTER_VERIFICATION_FAILED,
        data: { email: normalizedEmail, requiresVerification: true, emailSent }
      });
    }
    return sendError(res, { statusCode: 400, message: MESSAGES.AUTH.EMAIL_EXISTS });
  }

  const code = generateVerificationCode();
  const user = await User.create({
    firstName, lastName, email: normalizedEmail, phone, password,
    isVerified: false,
    emailVerificationCode: hashCode(code),
    emailVerificationExpires: new Date(Date.now() + 10 * 60 * 1000)
  });

  let emailSent = false;
  try {
    await sendVerificationEmail(normalizedEmail, code);
    emailSent = true;
  } catch (emailError) {
    console.error('Email send error:', emailError.message);
  }

  sendCreated(res, {
    message: emailSent ? MESSAGES.AUTH.REGISTER_VERIFICATION_SENT : MESSAGES.AUTH.REGISTER_VERIFICATION_FAILED,
    data: { email: normalizedEmail, requiresVerification: true, emailSent }
  });
}, MESSAGES.GENERAL.ERROR);

exports.verifyEmail = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendError(res, { statusCode: 400, message: MESSAGES.GENERAL.VALIDATION_ERROR, errors: errors.array() });

  const normalizedEmail = String(req.body.email).toLowerCase().trim();
  const { code } = req.body;
  const user = await User.findOne({ email: normalizedEmail }).select('+emailVerificationCode +emailVerificationExpires +tokenVersion +pendingPassword');

  if (!user) return sendError(res, { statusCode: 400, message: MESSAGES.AUTH.USER_NOT_FOUND });
  if (user.isVerified) return sendError(res, { statusCode: 400, message: MESSAGES.AUTH.VERIFICATION_ALREADY_DONE });
  if (!user.emailVerificationCode || !verifyCodeMatch(user.emailVerificationCode, code)) return sendError(res, { statusCode: 400, message: MESSAGES.AUTH.VERIFICATION_CODE_INVALID });
  if (user.emailVerificationExpires < new Date()) return sendError(res, { statusCode: 400, message: MESSAGES.AUTH.VERIFICATION_CODE_EXPIRED });

  const updateFields = {
    isVerified: true,
    lastLogin: new Date(),
    ...(user.pendingPassword ? { password: user.pendingPassword } : {})
  };

  await User.findByIdAndUpdate(user._id, {
    $set: updateFields,
    $unset: { emailVerificationCode: 1, emailVerificationExpires: 1, pendingPassword: 1 }
  });

  const token = generateToken(user._id, user.tokenVersion || 0);

  sendSuccess(res, {
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
  if (!errors.isEmpty()) return sendError(res, { statusCode: 400, message: MESSAGES.GENERAL.VALIDATION_ERROR, errors: errors.array() });

  const normalizedEmail = String(req.body.email).toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail }).select('+emailVerificationCode +emailVerificationExpires');

  if (!user) return sendError(res, { statusCode: 400, message: MESSAGES.AUTH.USER_NOT_FOUND });
  if (user.isVerified) return sendError(res, { statusCode: 400, message: MESSAGES.AUTH.VERIFICATION_ALREADY_DONE });

  const code = generateVerificationCode();
  await User.findByIdAndUpdate(user._id, {
    $set: {
      emailVerificationCode: hashCode(code),
      emailVerificationExpires: new Date(Date.now() + 10 * 60 * 1000)
    }
  });

  try {
    await sendVerificationEmail(normalizedEmail, code);
  } catch (emailError) {
    console.error('Resend code email error:', emailError.message);
    return sendError(res, { statusCode: 500, message: MESSAGES.AUTH.EMAIL_SEND_FAILED });
  }

  sendSuccess(res, { message: MESSAGES.AUTH.VERIFICATION_CODE_SENT });
}, MESSAGES.GENERAL.ERROR);

exports.login = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendError(res, { statusCode: 400, message: MESSAGES.GENERAL.VALIDATION_ERROR, errors: errors.array() });

  const normalizedEmail = String(req.body.email).toLowerCase().trim();
  const { password } = req.body;
  const user = await User.findOne({ email: normalizedEmail }).select('+password +tokenVersion');
  
  // Normalize response timing against user enumeration by paying bcrypt cost even if user not found
  const passwordMatches = user
    ? await user.comparePassword(password)
    : await bcrypt.compare(password, DUMMY_BCRYPT_HASH);

  if (!user || !passwordMatches) {
    return sendError(res, { statusCode: 401, message: MESSAGES.AUTH.LOGIN_FAILED });
  }

  if (!user.isActive) {
    return sendError(res, { statusCode: 401, message: MESSAGES.AUTH.ACCOUNT_INACTIVE });
  }

  if (!user.isVerified) {
    const code = generateVerificationCode();
    await User.findByIdAndUpdate(user._id, {
      $set: {
        emailVerificationCode: hashCode(code),
        emailVerificationExpires: new Date(Date.now() + 10 * 60 * 1000)
      }
    });

    let emailSent = false;
    try {
      await sendVerificationEmail(normalizedEmail, code);
      emailSent = true;
    } catch (emailError) {
      console.error('Verification email error:', emailError.message);
    }

    return sendError(res, {
      statusCode: 403,
      message: emailSent ? MESSAGES.AUTH.VERIFICATION_REQUIRED_CODE_SENT : MESSAGES.AUTH.VERIFICATION_REQUIRED_CODE_FAILED,
      data: { email: normalizedEmail, requiresVerification: true, emailSent }
    });
  }

  await User.findByIdAndUpdate(user._id, { $set: { lastLogin: new Date() } });
  const token = generateToken(user._id, user.tokenVersion || 0);

  sendSuccess(res, {
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
  if (!errors.isEmpty()) return sendError(res, { statusCode: 400, message: MESSAGES.GENERAL.VALIDATION_ERROR, errors: errors.array() });

  const { firstName, lastName, phone } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { firstName, lastName, phone },
    { new: true, runValidators: true }
  );

  sendSuccess(res, { data: user, message: MESSAGES.AUTH.PROFILE_UPDATED });
}, MESSAGES.GENERAL.ERROR);

exports.changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password +tokenVersion');
  const { currentPassword, newPassword } = req.body;

  if (!(await user.comparePassword(currentPassword))) {
    return sendError(res, { statusCode: 400, message: MESSAGES.AUTH.PASSWORD_INCORRECT });
  }

  const hashedNewPassword = await bcrypt.hash(newPassword, 12);
  await User.findByIdAndUpdate(req.user._id, {
    $set: { password: hashedNewPassword, passwordChangedAt: new Date() },
    $inc: { tokenVersion: 1 }
  });
  sendSuccess(res, { message: MESSAGES.AUTH.PASSWORD_CHANGED });
}, MESSAGES.GENERAL.ERROR);

exports.requestEmailChange = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendError(res, { statusCode: 400, message: MESSAGES.GENERAL.VALIDATION_ERROR, errors: errors.array() });

  const { newEmail } = req.body;
  const user = await User.findById(req.user._id);

  if (user.email === newEmail.toLowerCase()) {
    return sendError(res, { statusCode: 400, message: MESSAGES.AUTH.EMAIL_CHANGE_SAME });
  }

  const existingUser = await User.findOne({ email: newEmail.toLowerCase() });
  if (existingUser) {
    return sendError(res, { statusCode: 400, message: MESSAGES.AUTH.EMAIL_CHANGE_EXISTS });
  }

  const code = generateVerificationCode();
  const expiry = new Date(Date.now() + 10 * 60 * 1000);

  await User.findByIdAndUpdate(user._id, {
    pendingEmail: newEmail.toLowerCase(),
    emailChangeCode: hashCode(code),
    emailChangeExpires: expiry
  });

  try {
    await sendVerificationEmail(user.email, code, user.firstName);
    return sendSuccess(res, { message: MESSAGES.AUTH.EMAIL_CHANGE_CODE_SENT });
  } catch (emailError) {
    console.error('Email send error:', emailError);
    return sendError(res, { statusCode: 500, message: MESSAGES.AUTH.EMAIL_SEND_FAILED });
  }
}, MESSAGES.GENERAL.ERROR);

exports.verifyEmailChange = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendError(res, { statusCode: 400, message: MESSAGES.GENERAL.VALIDATION_ERROR, errors: errors.array() });

  const { code } = req.body;
  const user = await User.findById(req.user._id).select('+pendingEmail +emailChangeCode +emailChangeExpires');

  if (!user.pendingEmail || !user.emailChangeCode) {
    return sendError(res, { statusCode: 400, message: MESSAGES.AUTH.EMAIL_CHANGE_NO_PENDING });
  }

  if (user.emailChangeExpires < new Date()) {
    await User.findByIdAndUpdate(user._id, { $unset: { pendingEmail: 1, emailChangeCode: 1, emailChangeExpires: 1 } });
    return sendError(res, { statusCode: 400, message: MESSAGES.AUTH.EMAIL_CHANGE_CODE_EXPIRED });
  }

  if (!user.emailChangeCode || !verifyCodeMatch(user.emailChangeCode, code)) {
    return sendError(res, { statusCode: 400, message: MESSAGES.AUTH.EMAIL_CHANGE_CODE_INVALID });
  }

  const newEmail = user.pendingEmail;
  await User.findByIdAndUpdate(user._id, {
    email: newEmail,
    $unset: { pendingEmail: 1, emailChangeCode: 1, emailChangeExpires: 1 }
  });

  const updatedUser = await User.findById(user._id).select('-password').populate('wishlist', 'name slug price images');
  return sendSuccess(res, { message: MESSAGES.AUTH.EMAIL_CHANGE_SUCCESS, data: { user: updatedUser } });
}, MESSAGES.GENERAL.ERROR);

exports.addToWishlist = asyncHandler(async (req, res) => {
  const productIdStr = String(req.params.productId);
  const alreadyExists = req.user.wishlist?.some(
    (item) => item && item.toString() === productIdStr
  );

  if (alreadyExists) {
    return sendError(res, { statusCode: 400, message: MESSAGES.WISHLIST.ALREADY_EXISTS });
  }

  await User.findByIdAndUpdate(req.user._id, { $addToSet: { wishlist: productIdStr } });
  sendSuccess(res, { message: MESSAGES.WISHLIST.ADDED });
}, MESSAGES.GENERAL.ERROR);

exports.removeFromWishlist = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $pull: { wishlist: req.params.productId } });
  sendSuccess(res, { message: MESSAGES.WISHLIST.REMOVED });
}, MESSAGES.GENERAL.ERROR);

exports.forgotPassword = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendError(res, { statusCode: 400, message: MESSAGES.GENERAL.VALIDATION_ERROR, errors: errors.array() });

  const normalizedEmail = String(req.body.email).toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail }).select('+resetPasswordToken +resetPasswordExpires');

  if (user) {
    const code = generateVerificationCode();
    await User.findByIdAndUpdate(user._id, {
      $set: { resetPasswordToken: hashCode(code), resetPasswordExpires: new Date(Date.now() + 10 * 60 * 1000) }
    });

    try {
      await sendPasswordResetEmail(normalizedEmail, code);
    } catch (emailError) {
      console.error('Password reset email error:', emailError.message);
    }
  } else {
    // Perform dummy timing hash to balance response latency
    hashCode(generateVerificationCode());
  }

  // Unified generic response to prevent user enumeration
  sendSuccess(res, { message: MESSAGES.AUTH.PASSWORD_RESET_GENERIC });
}, MESSAGES.GENERAL.ERROR);

exports.verifyResetCode = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendError(res, { statusCode: 400, message: MESSAGES.GENERAL.VALIDATION_ERROR, errors: errors.array() });

  const normalizedEmail = String(req.body.email).toLowerCase().trim();
  const { code } = req.body;
  const user = await User.findOne({ email: normalizedEmail }).select('+resetPasswordToken +resetPasswordExpires');

  if (!user) return sendError(res, { statusCode: 400, message: MESSAGES.AUTH.USER_NOT_FOUND });
  if (!user.resetPasswordToken || !verifyCodeMatch(user.resetPasswordToken, code)) return sendError(res, { statusCode: 400, message: MESSAGES.AUTH.VERIFICATION_CODE_INVALID });
  if (user.resetPasswordExpires < new Date()) return sendError(res, { statusCode: 400, message: MESSAGES.AUTH.CODE_EXPIRED });

  sendSuccess(res, { message: MESSAGES.AUTH.CODE_VALID });
}, MESSAGES.GENERAL.ERROR);

exports.resetPassword = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendError(res, { statusCode: 400, message: MESSAGES.GENERAL.VALIDATION_ERROR, errors: errors.array() });

  const normalizedEmail = String(req.body.email).toLowerCase().trim();
  const { code, newPassword } = req.body;
  const user = await User.findOne({ email: normalizedEmail }).select('+password +resetPasswordToken +resetPasswordExpires +tokenVersion');

  if (!user) return sendError(res, { statusCode: 400, message: MESSAGES.AUTH.USER_NOT_FOUND });
  if (!user.resetPasswordToken || !verifyCodeMatch(user.resetPasswordToken, code)) return sendError(res, { statusCode: 400, message: MESSAGES.AUTH.VERIFICATION_CODE_INVALID });
  if (user.resetPasswordExpires < new Date()) return sendError(res, { statusCode: 400, message: MESSAGES.AUTH.CODE_EXPIRED });

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await User.findByIdAndUpdate(user._id, {
    $set: { password: hashedPassword, passwordChangedAt: new Date() },
    $inc: { tokenVersion: 1 },
    $unset: { resetPasswordToken: 1, resetPasswordExpires: 1 }
  });

  sendSuccess(res, { message: MESSAGES.AUTH.PASSWORD_LOGIN_PROMPT });
}, MESSAGES.GENERAL.ERROR);

exports.logout = asyncHandler(async (req, res) => {
  // Invalidate all outstanding JWT tokens by incrementing tokenVersion
  await User.findByIdAndUpdate(req.user._id, { $inc: { tokenVersion: 1 } });
  sendSuccess(res, { message: 'تم تسجيل الخروج بنجاح' });
}, MESSAGES.GENERAL.ERROR);
