const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { CONFIG, MESSAGES } = require('../constants');

// =====================================================
// PROTECT MIDDLEWARE - Verify JWT Token
// =====================================================
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: MESSAGES.AUTH.LOGIN_REQUIRED
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token (exclude password)
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: MESSAGES.AUTH.USER_NOT_FOUND
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: MESSAGES.AUTH.ACCOUNT_DISABLED
        });
      }

      // Check token version (session invalidation on password change / reset)
      if (decoded.v !== undefined && user.tokenVersion !== undefined && decoded.v !== user.tokenVersion) {
        return res.status(401).json({
          success: false,
          message: MESSAGES.AUTH.SESSION_INVALID
        });
      }

      // Check if password changed after token was issued
      if (user.passwordChangedAt && decoded.iat) {
        const changedTimestamp = parseInt(user.passwordChangedAt.getTime() / 1000, 10);
        if (decoded.iat < changedTimestamp) {
          return res.status(401).json({
            success: false,
            message: MESSAGES.AUTH.SESSION_INVALID
          });
        }
      }

      // Add user to request object
      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: MESSAGES.AUTH.SESSION_INVALID
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: MESSAGES.AUTH.AUTH_ERROR
    });
  }
};

// =====================================================
// ADMIN MIDDLEWARE - Check if user is admin
// =====================================================
const admin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: MESSAGES.GENERAL.UNAUTHORIZED
    });
  }

  if (req.user.role !== CONFIG.USER_ROLE.ADMIN) {
    // Log unauthorized admin access attempt
    console.warn(`⚠️ Unauthorized admin access attempt by user: ${req.user._id} (${req.user.email})`);
    
    return res.status(403).json({
      success: false,
      message: MESSAGES.ADMIN.UNAUTHORIZED
    });
  }

  next();
};

// =====================================================
// RATE LIMITERS - Prevent brute force attacks
// =====================================================

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: CONFIG.RATE_LIMIT.API.WINDOW_MS,
  max: CONFIG.RATE_LIMIT.API.MAX_REQUESTS,
  message: {
    success: false,
    message: MESSAGES.RATE_LIMIT.API
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiter for admin routes
const adminLimiter = rateLimit({
  windowMs: CONFIG.RATE_LIMIT.ADMIN.WINDOW_MS,
  max: CONFIG.RATE_LIMIT.ADMIN.MAX_REQUESTS,
  message: {
    success: false,
    message: MESSAGES.RATE_LIMIT.ADMIN
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Very strict rate limiter for login attempts
const loginLimiter = rateLimit({
  windowMs: CONFIG.RATE_LIMIT.LOGIN.WINDOW_MS,
  max: CONFIG.RATE_LIMIT.LOGIN.MAX_REQUESTS,
  message: {
    success: false,
    message: MESSAGES.RATE_LIMIT.LOGIN
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
});

// Dedicated rate limiter for forgot-password requests (no skipSuccessfulRequests)
const forgotPasswordLimiter = rateLimit({
  windowMs: CONFIG.RATE_LIMIT.LOGIN.WINDOW_MS,
  max: CONFIG.RATE_LIMIT.LOGIN.MAX_REQUESTS,
  message: {
    success: false,
    message: MESSAGES.RATE_LIMIT.LOGIN
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for verification code attempts (brute-force protection)
const verifyLimiter = rateLimit({
  windowMs: CONFIG.RATE_LIMIT.VERIFY.WINDOW_MS,
  max: CONFIG.RATE_LIMIT.VERIFY.MAX_REQUESTS,
  message: {
    success: false,
    message: MESSAGES.RATE_LIMIT.VERIFY
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for registration (prevent mass account creation)
const registerLimiter = rateLimit({
  windowMs: CONFIG.RATE_LIMIT.REGISTER.WINDOW_MS,
  max: CONFIG.RATE_LIMIT.REGISTER.MAX_REQUESTS,
  message: {
    success: false,
    message: MESSAGES.RATE_LIMIT.REGISTER
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for AI routes (Gemini API protection)
const aiLimiter = rateLimit({
  windowMs: CONFIG.RATE_LIMIT.AI.WINDOW_MS,
  max: CONFIG.RATE_LIMIT.AI.MAX_REQUESTS,
  message: {
    success: false,
    message: MESSAGES.RATE_LIMIT.AI
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public rate limiter for Gift Finder AI
const publicAiLimiter = rateLimit({
  windowMs: CONFIG.RATE_LIMIT.AI.WINDOW_MS,
  max: 6, // 6 requests per 15 minutes for public users
  message: {
    success: false,
    message: 'تم تجاوز الحد المسموح به لطلبات الذكاء الاصطناعي. يرجى المحاولة بعد 15 دقيقة.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiter for image uploads (Cloudinary protection)
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: {
    success: false,
    message: 'تم تجاوز الحد الأقصى لعمليات رفع الصور. حاول لاحقاً.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// =====================================================
// VALIDATE OBJECT ID - Prevent NoSQL injection
// =====================================================
const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!CONFIG.PATTERNS.MONGODB_ID.test(id)) {
      return res.status(400).json({
        success: false,
        message: MESSAGES.GENERAL.INVALID_ID
      });
    }
    
    next();
  };
};

// =====================================================
// SANITIZE INPUT - XSS & NoSQL Injection prevention
// Strips dangerous HTML tags/attributes while preserving
// plain-text angle brackets and keeping secrets unmutated
// =====================================================
const CREDENTIAL_FIELDS = new Set(['password', 'currentPassword', 'newPassword', 'confirmPassword']);

const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    if (!obj || typeof obj !== 'object') return;
    for (let key in obj) {
      // NoSQL injection: delete any keys starting with $
      if (key.startsWith('$')) {
        delete obj[key];
        continue;
      }
      // Never mutate raw passwords or secrets before hashing
      if (CREDENTIAL_FIELDS.has(key)) continue;

      if (typeof obj[key] === 'string') {
        obj[key] = obj[key]
          // Strip dangerous tag blocks (script, style, iframe, object, embed) and their contents
          .replace(/<(script|style|iframe|object|embed|form)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
          // Strip self-closing or unclosed dangerous tags
          .replace(/<\/?(script|style|iframe|object|embed|link|meta)\b[^>]*\/?>/gi, '')
          // Strip all HTML tags that look like real tags (tag name starts with a letter)
          .replace(/<\/?[a-z][a-z0-9]*\b[^>]*\/?>/gi, '')
          // Strip javascript: URIs
          .replace(/javascript\s*:/gi, '')
          // Strip inline event handlers (onerror=, onclick=, etc.)
          .replace(/\bon\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, '');
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitize(obj[key]);
      }
    }
  };

  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);

  next();
};

// =====================================================
// LOG ADMIN ACTIONS - Audit trail
// =====================================================
const logAdminAction = (action) => {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);
    
    res.json = function(data) {
      // Log successful admin actions
      if (res.statusCode >= 200 && res.statusCode < 300) {
        console.log(`📝 Admin Action: ${action}`);
        console.log(`   User: ${req.user?.email || 'Unknown'}`);
        console.log(`   IP: ${req.ip}`);
        console.log(`   Time: ${new Date().toISOString()}`);
        console.log(`   Resource ID: ${req.params?.id || 'N/A'}`);
      }
      
      return originalJson(data);
    };
    
    next();
  };
};

module.exports = {
  protect,
  admin,
  apiLimiter,
  adminLimiter,
  loginLimiter,
  forgotPasswordLimiter,
  verifyLimiter,
  registerLimiter,
  aiLimiter,
  publicAiLimiter,
  uploadLimiter,
  validateObjectId,
  sanitizeInput,
  logAdminAction
};
