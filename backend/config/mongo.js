const mongoose = require('mongoose');

const isProduction = process.env.NODE_ENV === 'production';

const MONGO_SERVER_SELECTION_TIMEOUT_MS = Math.max(
  1000,
  Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS) || 10000
);
const MONGO_MAX_RETRIES = Math.max(1, Number(process.env.MONGO_CONNECT_MAX_RETRIES) || 5);
const MONGO_RETRY_DELAY_MS = Math.max(250, Number(process.env.MONGO_CONNECT_RETRY_DELAY_MS) || 5000);

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

/**
 * Builds resilient production-grade MongoDB connection options
 * Hardened for 10M MAU: Explicit connection pool caps, fast socket timeouts, and write concerns.
 */
const buildConnectOptions = () => {
  return {
    serverSelectionTimeoutMS: MONGO_SERVER_SELECTION_TIMEOUT_MS,
    connectTimeoutMS: Math.max(1000, Number(process.env.MONGO_CONNECT_TIMEOUT_MS) || 10000),
    socketTimeoutMS: Math.max(5000, Number(process.env.MONGO_SOCKET_TIMEOUT_MS) || 45000),
    maxPoolSize: Math.max(1, Number(process.env.MONGO_MAX_POOL_SIZE) || 50),
    minPoolSize: Math.max(0, Number(process.env.MONGO_MIN_POOL_SIZE) || (isProduction ? 5 : 0)),
    maxIdleTimeMS: Math.max(1000, Number(process.env.MONGO_MAX_IDLE_MS) || 30000),
    waitQueueTimeoutMS: Math.max(500, Number(process.env.MONGO_WAIT_QUEUE_MS) || 5000),
    heartbeatFrequencyMS: Math.max(500, Number(process.env.MONGO_HEARTBEAT_MS) || 10000),
    retryWrites: true,
    retryReads: true,
    w: isProduction ? 'majority' : 1,
    autoIndex: !isProduction, // In production, indexes are synchronized via deployment scripts
  };
};

/**
 * Global Query Execution plugin
 * Enforces a hard maxTimeMS timeout so slow queries do not block the connection pool indefinitely.
 */
const configureGlobalPlugins = () => {
  mongoose.plugin((schema) => {
    // Apply 8000ms maxTimeMS to find, count, and update queries
    schema.pre(['find', 'findOne', 'findOneAndUpdate', 'countDocuments'], function () {
      if (typeof this.maxTimeMS === 'function' && !this.options.maxTimeMS) {
        this.maxTimeMS(8000);
      }
    });
  });
};

/**
 * Connects to MongoDB with retry logic and bufferCommands disabled to prevent memory leaks during blips
 */
const connectToDatabase = async (customUri = null) => {
  const mongoUri = customUri || process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('MONGODB_URI is not configured');
  }

  // Prevent memory unbounded command queue during connection drops
  mongoose.set('bufferCommands', false);
  configureGlobalPlugins();

  const options = buildConnectOptions();
  let lastError;

  for (let attempt = 1; attempt <= MONGO_MAX_RETRIES; attempt += 1) {
    try {
      await mongoose.connect(mongoUri, options);
      console.log(`MongoDB connected successfully (Pool Max: ${options.maxPoolSize})`);
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

/**
 * Express 503 Fence Middleware
 * Immediately fails fast with 503 + Retry-After if database connection drops, protecting Node memory
 */
const mongoHealthFence = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    res.setHeader('Retry-After', '5');
    return res.status(503).json({
      success: false,
      status: 'degraded',
      message: 'قاعدة البيانات غير متاحة مؤقتاً، يرجى المحاولة بعد لحظات.',
    });
  }
  next();
};

module.exports = {
  buildConnectOptions,
  connectToDatabase,
  mongoHealthFence,
  getMongoStateLabel,
};
