const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const { CONFIG, MESSAGES } = require('./constants');

const app = express();
let server;

const MONGO_MAX_RETRIES = Math.max(1, Number(process.env.MONGO_CONNECT_MAX_RETRIES) || 5);
const MONGO_RETRY_DELAY_MS = Math.max(250, Number(process.env.MONGO_CONNECT_RETRY_DELAY_MS) || 5000);
const MONGO_SERVER_SELECTION_TIMEOUT_MS =
  Math.max(1000, Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS) || 10000);

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getMongoStateLabel = (state) => {
  switch (state) {
    case 0:
      return 'disconnected';
    case 1:
      return 'connected';
    case 2:
      return 'connecting';
    case 3:
      return 'disconnecting';
    default:
      return 'unknown';
  }
};

const connectToDatabase = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('MONGODB_URI is not configured');
  }

  let lastError;

  for (let attempt = 1; attempt <= MONGO_MAX_RETRIES; attempt += 1) {
    try {
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: MONGO_SERVER_SELECTION_TIMEOUT_MS,
      });
      console.log('MongoDB connected');
      return;
    } catch (error) {
      lastError = error;
      console.error(
        `MongoDB connection attempt ${attempt}/${MONGO_MAX_RETRIES} failed: ${error.message}`
      );

      if (attempt < MONGO_MAX_RETRIES) {
        await wait(MONGO_RETRY_DELAY_MS);
      }
    }
  }

  throw lastError;
};

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
// Allow Express to trust proxy safely (for correct IP detection behind Render / Reverse Proxies)
if (process.env.TRUSTED_PROXIES) {
  app.set('trust proxy', process.env.TRUSTED_PROXIES.split(',').map((ip) => ip.trim()));
} else if (process.env.TRUST_PROXY_HOPS) {
  app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS));
} else {
  app.set('trust proxy', process.env.NODE_ENV === 'production' ? 1 : false);
}

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: CONFIG.CORS.ALLOWED_ORIGINS,
  methods: CONFIG.CORS.METHODS,
  credentials: CONFIG.CORS.CREDENTIALS
}));
app.use(morgan('dev'));

// Webhook routes (must be before express.json() to get raw body for signature verification)
app.use('/api/webhooks', require('./routes/webhooks'));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Input Sanitization Middleware (XSS & NoSQL Operator Neutralizer)
const { sanitizeInput, apiLimiter } = require('./middleware/auth');
app.use(sanitizeInput);
app.use('/api', apiLimiter);

// Routes
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

// UptimeRobot lightweight health check (No DB/rate-limit hit)
app.get('/health', (req, res) => {
  res.status(200).send('Server is awake');
});

// Health check
app.get('/api/health', (req, res) => {
  const database = getMongoStateLabel(mongoose.connection.readyState);
  const status = database === 'connected' ? 'ok' : 'degraded';
  res.status(status === 'ok' ? 200 : 503).json({ status, database, message: MESSAGES.HEALTH.OK });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: MESSAGES.GENERAL.SERVER_ERROR });
});

// 404 handler
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
  if (!process.env.GEMINI_API_KEY) {
    console.warn('⚠️ NOTICE: GEMINI_API_KEY is not set. AI features will operate in fallback mode.');
  }
};

const startServer = async () => {
  try {
    validateEnvironment();
    await connectToDatabase();

    const PORT = process.env.PORT || 5000;
    server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = app;
