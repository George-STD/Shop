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
// Allow Express to trust proxy (for correct IP detection behind Render)
app.set('trust proxy', 1);

// Middleware
app.use(helmet());
app.use(cors({
  origin: CONFIG.CORS.ALLOWED_ORIGINS,
  methods: CONFIG.CORS.METHODS,
  credentials: CONFIG.CORS.CREDENTIALS
}));
app.use(morgan('dev'));

// Webhook routes (must be before express.json() to get raw body for signature verification)
app.use('/api/webhooks', require('./routes/webhooks'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static('uploads'));

// Rate limiting for API
const { apiLimiter } = require('./middleware/auth');
app.use('/api', apiLimiter);

// Routes
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/occasions', require('./routes/occasions'));
app.use('/api/admin', require('./routes/admin'));

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

const startServer = async () => {
  try {
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

startServer();
