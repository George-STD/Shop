const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
require('dotenv').config();

const { CONFIG, MESSAGES } = require('./constants');
const { connectToDatabase, mongoHealthFence, getMongoStateLabel } = require('./config/mongo');
const { startPeriodicCleanup, stopPeriodicCleanup } = require('./services/cleanupService');

const app = express();
let server;

const closeServer = async () => {
  if (!server) return;

  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
};

const gracefulShutdown = async (reason, exitCode = 0) => {
  console.log(`Shutting down (${reason})`);

  try {
    stopPeriodicCleanup();
  } catch (error) {
    console.error('Error while stopping cleanup service:', error);
  }

  try {
    await closeServer();
  } catch (error) {
    console.error('Error while closing HTTP server:', error);
  }

  try {
    await mongoose.connection.close(false);
  } catch (error) {
    console.error('Error while closing MongoDB connection:', error);
  }

  process.exit(exitCode);
};

const registerProcessHandlers = () => {
  process.on('SIGINT', () => {
    gracefulShutdown('SIGINT', 0).catch(() => process.exit(1));
  });

  process.on('SIGTERM', () => {
    gracefulShutdown('SIGTERM', 0).catch(() => process.exit(1));
  });

  process.on('unhandledRejection', (error) => {
    console.error('Unhandled promise rejection:', error);
    gracefulShutdown('unhandledRejection', 1).catch(() => process.exit(1));
  });

  process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
    gracefulShutdown('uncaughtException', 1).catch(() => process.exit(1));
  });
};

mongoose.connection.on('disconnected', () => {
  console.error('MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected');
});

mongoose.connection.on('error', (error) => {
  console.error('MongoDB runtime error:', error.message);
});

registerProcessHandlers();

// Allow Express to trust proxy safely (for correct IP detection behind Reverse Proxies / Load Balancers)
if (process.env.TRUSTED_PROXIES) {
  app.set('trust proxy', process.env.TRUSTED_PROXIES.split(',').map((ip) => ip.trim()));
} else if (process.env.TRUST_PROXY_HOPS) {
  app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS));
} else {
  app.set('trust proxy', process.env.NODE_ENV === 'production' ? 1 : false);
}

// ── Compression Middleware (Async gzip for payloads >= 1KB) ──
app.use(compression({
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
}));

// ── Security Headers (Helmet) ──
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  hidePoweredBy: true,
}));

// ── Cross-Origin Resource Sharing (CORS) ──
app.use(cors({
  origin: CONFIG.CORS.ALLOWED_ORIGINS,
  methods: CONFIG.CORS.METHODS,
  credentials: CONFIG.CORS.CREDENTIALS,
  maxAge: CONFIG.CORS.MAX_AGE,
  allowedHeaders: CONFIG.CORS.ALLOWED_HEADERS,
  exposedHeaders: CONFIG.CORS.EXPOSED_HEADERS,
}));

// ── Request Logging (Morgan) ──
if (process.env.NODE_ENV !== 'test') {
  const morganFormat = process.env.NODE_ENV === 'production' ? 'tiny' : 'dev';
  app.use(morgan(morganFormat, {
    skip: (req) => req.path === '/health' || req.path === '/api/health'
  }));
}

// ── Webhooks (must be mounted before express.json() to preserve raw body) ──
app.use('/api/webhooks', require('./routes/webhooks'));

// ── Body Parsers ──
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ── Input Sanitization Middleware (ReDoS & NoSQL neutralizer) ──
const { sanitizeInput, apiLimiter } = require('./middleware/auth');
app.use(sanitizeInput);
app.use('/api', apiLimiter);

// ── UptimeRobot / Orchestrator Lightweight Health Check ──
app.get('/health', (req, res) => {
  res.status(200).send('Server is awake');
});

// ── Full System Health Check ──
app.get('/api/health', (req, res) => {
  const database = getMongoStateLabel(mongoose.connection.readyState);
  const status = database === 'connected' ? 'ok' : 'degraded';
  res.status(status === 'ok' ? 200 : 503).json({ status, database, message: MESSAGES.HEALTH.OK });
});

// ── Database 503 Fence (Fails fast in <1ms if MongoDB is disconnected) ──
app.use('/api', mongoHealthFence);

// ── API Routes ──
app.use('/api/upload', require('./routes/upload'));
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/occasions', require('./routes/occasions'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/gift-finder', require('./routes/gift-finder'));
app.use('/api/admin/ai', require('./routes/ai-vision'));
app.use('/api/admin/ai-agent', require('./routes/ai-agent'));
app.use('/api/admin', require('./routes/admin'));

// ── Error Handling Middleware ──
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: MESSAGES.GENERAL.SERVER_ERROR });
});

// ── 404 Handler ──
app.use((req, res) => {
  res.status(404).json({ success: false, message: MESSAGES.GENERAL.NOT_FOUND });
});

const validateEnvironment = () => {
  const required = ['MONGODB_URI', 'JWT_SECRET'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32 && process.env.NODE_ENV !== 'test') {
    throw new Error('JWT_SECRET must be at least 32 characters long for security.');
  }
  const INSECURE_JWT_SECRETS = [
    'production_jwt_secret_key_minimum_32_characters_long_12345',
    'change-me-to-a-random-string-of-at-least-32-chars',
    'your-32-character-ultra-secure-and-ultra-long-secret',
    'your_jwt_secret_key_here_must_be_long',
  ];
  if (process.env.JWT_SECRET && INSECURE_JWT_SECRETS.includes(process.env.JWT_SECRET) && process.env.NODE_ENV !== 'test') {
    throw new Error('JWT_SECRET cannot use an insecure public or placeholder value.');
  }
  if (!process.env.GEMINI_API_KEY) {
    console.warn('⚠️ NOTICE: GEMINI_API_KEY is not set. AI features will operate in fallback mode.');
  }
};

const startServer = async () => {
  try {
    validateEnvironment();
    await connectToDatabase();
    startPeriodicCleanup();

    const PORT = process.env.PORT || 5000;
    server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    // ── Keep-Alive & ELB Timeout Configuration ──
    // Node.js keepAliveTimeout must exceed Load Balancer / Reverse Proxy idle timeout (60s) to prevent 502s
    server.keepAliveTimeout = 65000; // 65 seconds
    server.headersTimeout = 66000;   // 66 seconds (headersTimeout > keepAliveTimeout)
    server.maxHeadersCount = 50;

  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = app;
