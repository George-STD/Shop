const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { CONFIG, MESSAGES } = require('../constants');

// =====================================================
// CLIENT IP EXTRACTION & IPV6 /64 AGGREGATION
// =====================================================
const clientIp = (req) => {
  let ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';
  if (ip.startsWith('::ffff:')) {
    ip = ip.substring(7);
  }
  // Aggregate IPv6 to /64 subnet (first 4 segments) to prevent 2^64 free identities
  if (ip.includes(':')) {
    const parts = ip.split(':');
    ip = parts.slice(0, 4).join(':') + '::/64';
  }
  return ip;
};

const emailFromBody = (req) => {
  return req.body && req.body.email ? String(req.body.email).toLowerCase().trim() : '';
};

// =====================================================
// AUTHZ CACHE (10s TTL in-memory cache to reduce Mongo QPS)
// =====================================================
const authzCache = new Map();
const AUTHZ_CACHE_TTL_MS = 10_000;
const MAX_AUTHZ_CACHE_SIZE = 50_000;

const cleanAuthzCache = () => {
  const now = Date.now();
  for (const [token, entry] of authzCache.entries()) {
    if (now - entry.cachedAt > AUTHZ_CACHE_TTL_MS) {
      authzCache.delete(token);
    }
  }
};

const evictUserFromAuthzCache = (userId) => {
  if (!userId) return;
  const uid = String(userId);
  for (const [token, entry] of authzCache.entries()) {
    if (entry.user && String(entry.user._id) === uid) {
      authzCache.delete(token);
    }
  }
};

setInterval(cleanAuthzCache, 30_000).unref();

// =====================================================
// PROTECT MIDDLEWARE - Verify JWT Token with HS256 & Cache
// =====================================================
const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: MESSAGES.AUTH.LOGIN_REQUIRED,
      });
    }

    // In production/dev (bypassed in test env for strict state isolation), check authz cache
    if (process.env.NODE_ENV !== 'test') {
      const cached = authzCache.get(token);
      if (cached && Date.now() - cached.cachedAt < AUTHZ_CACHE_TTL_MS) {
        try {
          const decodedQuick = jwt.decode(token);
          if (decodedQuick && decodedQuick.v !== undefined && cached.user.tokenVersion !== undefined && decodedQuick.v !== cached.user.tokenVersion) {
            authzCache.delete(token);
          } else if (cached.user.isActive === false) {
            authzCache.delete(token);
          } else {
            req.user = cached.user;
            return next();
          }
        } catch (_) {
          authzCache.delete(token);
        }
      }
    }

    try {
      // Strictly pin algorithm to HS256 to prevent algorithm confusion attacks
      const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });

      // Get user from token (exclude password)
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: MESSAGES.AUTH.USER_NOT_FOUND,
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: MESSAGES.AUTH.ACCOUNT_DISABLED,
        });
      }

      // Check token version (session invalidation on password change / reset)
      if (decoded.v !== undefined && user.tokenVersion !== undefined && decoded.v !== user.tokenVersion) {
        authzCache.delete(token);
        return res.status(401).json({
          success: false,
          message: MESSAGES.AUTH.SESSION_INVALID,
        });
      }

      // Check if password changed after token was issued
      if (user.passwordChangedAt && decoded.iat) {
        const changedTimestamp = parseInt(user.passwordChangedAt.getTime() / 1000, 10);
        if (decoded.iat < changedTimestamp) {
          authzCache.delete(token);
          return res.status(401).json({
            success: false,
            message: MESSAGES.AUTH.SESSION_INVALID,
          });
        }
      }

      // Add to authz cache
      if (authzCache.size < MAX_AUTHZ_CACHE_SIZE) {
        authzCache.set(token, { user, cachedAt: Date.now() });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: MESSAGES.AUTH.SESSION_INVALID,
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: MESSAGES.AUTH.AUTH_ERROR,
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
      message: MESSAGES.GENERAL.UNAUTHORIZED,
    });
  }

  if (req.user.role !== CONFIG.USER_ROLE.ADMIN) {
    console.warn(`⚠️ Unauthorized admin access attempt by user: ${req.user._id} (${req.user.email})`);
    return res.status(403).json({
      success: false,
      message: MESSAGES.ADMIN.UNAUTHORIZED,
    });
  }

  next();
};

// =====================================================
// RATE LIMITERS BASE CONFIGURATION (Draft-7 & Health Skip)
// =====================================================
const isPerfTesting = process.env.ENABLE_PERF_TESTING === 'true' && process.env.NODE_ENV !== 'production';

const limiterBase = {
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  validate: false,
  skip: (req) =>
    isPerfTesting ||
    req.method === 'OPTIONS' ||
    req.method === 'HEAD' ||
    req.path === '/health' ||
    req.path === '/api/health',
};

// General API rate limiter
const apiLimiter = rateLimit({
  ...limiterBase,
  windowMs: CONFIG.RATE_LIMIT.API.WINDOW_MS,
  max: CONFIG.RATE_LIMIT.API.MAX_REQUESTS,
  limit: CONFIG.RATE_LIMIT.API.MAX_REQUESTS,
  keyGenerator: (req) => clientIp(req),
  message: {
    success: false,
    message: MESSAGES.RATE_LIMIT.API,
  },
});

// Strict rate limiter for admin routes
const adminLimiter = rateLimit({
  ...limiterBase,
  windowMs: CONFIG.RATE_LIMIT.ADMIN.WINDOW_MS,
  max: CONFIG.RATE_LIMIT.ADMIN.MAX_REQUESTS,
  limit: CONFIG.RATE_LIMIT.ADMIN.MAX_REQUESTS,
  keyGenerator: (req) => (req.user?._id ? `admin:usr:${req.user._id}` : `admin:ip:${clientIp(req)}`),
  message: {
    success: false,
    message: MESSAGES.RATE_LIMIT.ADMIN,
  },
});

// Very strict rate limiter for login attempts (IP + Email key generator)
const loginLimiter = rateLimit({
  ...limiterBase,
  windowMs: CONFIG.RATE_LIMIT.LOGIN.WINDOW_MS,
  max: CONFIG.RATE_LIMIT.LOGIN.MAX_REQUESTS,
  limit: CONFIG.RATE_LIMIT.LOGIN.MAX_REQUESTS,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => `login:${clientIp(req)}:${emailFromBody(req) || 'unknown'}`,
  message: {
    success: false,
    message: MESSAGES.RATE_LIMIT.LOGIN,
  },
});

// Dedicated rate limiter for forgot-password requests (IP + Email key generator)
const forgotPasswordLimiter = rateLimit({
  ...limiterBase,
  windowMs: CONFIG.RATE_LIMIT.LOGIN.WINDOW_MS,
  max: CONFIG.RATE_LIMIT.LOGIN.MAX_REQUESTS,
  limit: CONFIG.RATE_LIMIT.LOGIN.MAX_REQUESTS,
  keyGenerator: (req) => `forgot:${clientIp(req)}:${emailFromBody(req) || 'unknown'}`,
  message: {
    success: false,
    message: MESSAGES.RATE_LIMIT.LOGIN,
  },
});

// Rate limiter for verification code attempts (IP + Target Email/Phone)
const verifyLimiter = rateLimit({
  ...limiterBase,
  windowMs: CONFIG.RATE_LIMIT.VERIFY.WINDOW_MS,
  max: CONFIG.RATE_LIMIT.VERIFY.MAX_REQUESTS,
  limit: CONFIG.RATE_LIMIT.VERIFY.MAX_REQUESTS,
  keyGenerator: (req) => `verify:${clientIp(req)}:${emailFromBody(req) || (req.body && req.body.phone ? String(req.body.phone).trim() : '') || 'unknown'}`,
  message: {
    success: false,
    message: MESSAGES.RATE_LIMIT.VERIFY,
  },
});

// Rate limiter for registration (IP + Target Email)
const registerLimiter = rateLimit({
  ...limiterBase,
  windowMs: CONFIG.RATE_LIMIT.REGISTER.WINDOW_MS,
  max: CONFIG.RATE_LIMIT.REGISTER.MAX_REQUESTS,
  limit: CONFIG.RATE_LIMIT.REGISTER.MAX_REQUESTS,
  keyGenerator: (req) => `register:${clientIp(req)}:${emailFromBody(req) || 'unknown'}`,
  message: {
    success: false,
    message: MESSAGES.RATE_LIMIT.REGISTER,
  },
});

// Dedicated rate limiter for checkout and order creation (prevents inventory locking and card spamming)
const checkoutLimiter = rateLimit({
  ...limiterBase,
  windowMs: 15 * 60 * 1000,
  max: 15,
  limit: 15,
  keyGenerator: (req) => (req.user?._id ? `checkout:usr:${req.user._id}` : `checkout:ip:${clientIp(req)}`),
  message: {
    success: false,
    message: 'تم تجاوز الحد الأقصى لإنشاء الطلبات مؤقتاً. يرجى الانتظار بضع دقائق قبل المحاولة مجدداً.',
  },
});

// Rate limiter for AI routes
const aiLimiter = rateLimit({
  ...limiterBase,
  windowMs: CONFIG.RATE_LIMIT.AI.WINDOW_MS,
  max: CONFIG.RATE_LIMIT.AI.MAX_REQUESTS,
  limit: CONFIG.RATE_LIMIT.AI.MAX_REQUESTS,
  keyGenerator: (req) => (req.user?._id ? `ai:usr:${req.user._id}` : `ai:ip:${clientIp(req)}`),
  message: {
    success: false,
    message: MESSAGES.RATE_LIMIT.AI,
  },
});

// Public rate limiter for Gift Finder AI
const publicAiLimiter = rateLimit({
  ...limiterBase,
  windowMs: CONFIG.RATE_LIMIT.AI.WINDOW_MS,
  max: 6,
  limit: 6,
  keyGenerator: (req) => clientIp(req),
  message: {
    success: false,
    message: 'تم تجاوز الحد المسموح به لطلبات الذكاء الاصطناعي. يرجى المحاولة بعد 15 دقيقة.',
  },
});

// Rate limiter for image uploads
const uploadLimiter = rateLimit({
  ...limiterBase,
  windowMs: 15 * 60 * 1000,
  max: 60,
  limit: 60,
  keyGenerator: (req) => (req.user?._id ? `upload:usr:${req.user._id}` : `upload:ip:${clientIp(req)}`),
  message: {
    success: false,
    message: 'تم تجاوز الحد الأقصى لعمليات رفع الصور. حاول لاحقاً.',
  },
});

// Rate limiter for Webhooks (120 req / minute)
const webhookLimiter = rateLimit({
  ...limiterBase,
  windowMs: 60 * 1000,
  max: 120,
  limit: 120,
  keyGenerator: (req) => clientIp(req),
  message: {
    success: false,
    message: 'Webhook rate limit exceeded',
  },
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
        message: MESSAGES.GENERAL.INVALID_ID,
      });
    }
    next();
  };
};

// =====================================================
// SANITIZE INPUT - ReDoS-Safe & NoSQL Injection Neutralizer
// Max depth 8, max 400 keys, max 20,000 chars per string
// Bounded tag stripping regex: /<\/?[a-z][^>]{0,200}>/gi
// =====================================================
const CREDENTIAL_FIELDS = new Set([
  'password',
  'currentPassword',
  'newPassword',
  'confirmPassword',
  'pendingPassword',
]);

const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

const sanitizeInput = (req, res, next) => {
  let keysInspected = 0;
  const MAX_KEYS = 400;
  const MAX_DEPTH = 8;
  const MAX_STRING_LEN = 20_000;

  const sanitize = (obj, depth = 0) => {
    if (!obj || typeof obj !== 'object' || depth > MAX_DEPTH) return;

    for (const key of Object.keys(obj)) {
      keysInspected += 1;
      if (keysInspected > MAX_KEYS) {
        delete obj[key];
        continue;
      }

      // Drop NoSQL injection operators ($), dot-notation injection (.), or prototype pollutions
      if (key.startsWith('$') || key.includes('.') || DANGEROUS_KEYS.has(key)) {
        delete obj[key];
        continue;
      }

      // Never touch raw passwords
      if (CREDENTIAL_FIELDS.has(key)) continue;

      if (typeof obj[key] === 'string') {
        let str = obj[key];
        if (str.length > MAX_STRING_LEN) {
          str = str.slice(0, MAX_STRING_LEN);
        }

        // Bounded, ReDoS-free linear stripping
        obj[key] = str
          .replace(/<script[\s\S]*?<\/script>/gi, '')
          .replace(/<style[\s\S]*?<\/style>/gi, '')
          .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
          .replace(/<\/?[a-z][^>]{0,200}>/gi, '')
          .replace(/javascript\s*:/gi, '')
          .replace(/\bon\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, '');
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitize(obj[key], depth + 1);
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

    res.json = function (data) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        console.log(`📝 Admin Action: ${action}`);
        console.log(`   User: ${req.user?.email || 'Unknown'}`);
        console.log(`   IP: ${clientIp(req)}`);
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
  webhookLimiter,
  validateObjectId,
  sanitizeInput,
  logAdminAction,
  clientIp,
  evictUserFromAuthzCache,
  checkoutLimiter,
};
