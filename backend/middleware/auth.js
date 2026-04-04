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
// SANITIZE INPUT - Basic XSS prevention
// =====================================================
const sanitizeInput = (req, res, next) => {
  // Simple sanitization - remove HTML tags from string inputs
  const sanitize = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = obj[key].replace(/<[^>]*>/g, '');
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
  verifyLimiter,
  registerLimiter,
  validateObjectId,
  sanitizeInput,
  logAdminAction
};
