const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');

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
        message: 'غير مصرح لك بالوصول. يرجى تسجيل الدخول'
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
          message: 'المستخدم غير موجود'
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'تم تعطيل حسابك. تواصل مع الدعم'
        });
      }

      // Add user to request object
      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'جلسة غير صالحة. يرجى تسجيل الدخول مرة أخرى'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في التحقق من الهوية'
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
      message: 'غير مصرح لك بالوصول'
    });
  }

  if (req.user.role !== 'admin') {
    // Log unauthorized admin access attempt
    console.warn(`⚠️ Unauthorized admin access attempt by user: ${req.user._id} (${req.user.email})`);
    
    return res.status(403).json({
      success: false,
      message: 'ليس لديك صلاحية للوصول إلى هذه الصفحة'
    });
  }

  next();
};

// =====================================================
// RATE LIMITERS - Prevent brute force attacks
// =====================================================

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'عدد كبير جداً من الطلبات. حاول مرة أخرى بعد 15 دقيقة'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiter for admin routes
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests per windowMs
  message: {
    success: false,
    message: 'عدد كبير جداً من الطلبات. حاول مرة أخرى لاحقاً'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Very strict rate limiter for login attempts
const loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 login attempts per hour
  message: {
    success: false,
    message: 'عدد محاولات تسجيل الدخول تجاوز الحد المسموح. حاول بعد ساعة'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
});

// =====================================================
// IDOR PROTECTION - Verify resource ownership
// =====================================================

// Verify the user owns the resource or is admin
const verifyOwnership = (resourceUserIdField = 'user') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params.id;
      
      // Admin can access any resource
      if (req.user.role === 'admin') {
        return next();
      }

      // For regular users, check ownership
      // This will be validated in the route handler
      req.checkOwnership = true;
      req.resourceUserIdField = resourceUserIdField;
      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'خطأ في التحقق من الصلاحيات'
      });
    }
  };
};

// =====================================================
// VALIDATE OBJECT ID - Prevent NoSQL injection
// =====================================================
const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    // MongoDB ObjectId regex pattern
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    
    if (!objectIdPattern.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'معرف غير صالح'
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
  verifyOwnership,
  validateObjectId,
  sanitizeInput,
  logAdminAction
};
