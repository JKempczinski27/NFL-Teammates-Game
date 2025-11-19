const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const Redis = require('ioredis');
const Sentry = require('@sentry/node');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 8080;

// Initialize Sentry for error logging
// Note: Set SENTRY_DSN in your Railway environment variables
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'production',
    tracesSampleRate: 1.0, // Capture 100% of transactions for performance monitoring
  });

  // RequestHandler must be the first middleware
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());
}

// Optimized DB connection pool with better configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  // Connection pool optimization
  max: 20, // Maximum number of clients in the pool
  min: 5, // Minimum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection could not be established
  maxUses: 7500, // Close (and replace) a connection after it has been used 7500 times
});

// Initialize Redis for caching
// Note: Set REDIS_URL in your Railway environment variables
let redisClient = null;
if (process.env.REDIS_URL) {
  try {
    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      reconnectOnError(err) {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          return true; // Reconnect when Redis is in readonly mode
        }
        return false;
      },
    });

    redisClient.on('error', (err) => {
      console.error('Redis connection error:', err);
      if (process.env.SENTRY_DSN) {
        Sentry.captureException(err);
      }
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis connected successfully');
    });

    console.log('Redis client initialized');
  } catch (err) {
    console.error('Failed to initialize Redis:', err);
    if (process.env.SENTRY_DSN) {
      Sentry.captureException(err);
    }
  }
} else {
  console.warn('⚠️  REDIS_URL not set. Caching disabled.');
}

// Middleware setup

// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // Disable for now to avoid breaking frontend
  crossOriginEmbedderPolicy: false,
}));

// Enable CORS
app.use(cors());

// Gzip compression for responses
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6, // Compression level (0-9)
}));

// Parse JSON bodies
app.use(express.json());
app.use(express.static('public'));

// API Rate limiting - prevent abuse
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply rate limiting to all API routes
app.use('/api/', apiLimiter);

// Stricter rate limit for write operations
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // Limit write operations to 20 per 15 minutes
  message: 'Too many write requests, please try again later.',
});

// Cache middleware for daily questions
const cacheMiddleware = (duration = 3600) => {
  return async (req, res, next) => {
    if (!redisClient) {
      return next(); // Skip caching if Redis is not available
    }

    const key = `cache:${req.originalUrl || req.url}`;

    try {
      const cachedData = await redisClient.get(key);

      if (cachedData) {
        // Set cache headers
        res.set('X-Cache', 'HIT');
        return res.json(JSON.parse(cachedData));
      }

      // Store original res.json function
      const originalJson = res.json.bind(res);

      // Override res.json to cache the response
      res.json = (body) => {
        redisClient.setex(key, duration, JSON.stringify(body)).catch(err => {
          console.error('Redis cache set error:', err);
        });
        res.set('X-Cache', 'MISS');
        return originalJson(body);
      };

      next();
    } catch (err) {
      console.error('Cache middleware error:', err);
      if (process.env.SENTRY_DSN) {
        Sentry.captureException(err);
      }
      next();
    }
  };
};

// Static asset caching headers
app.use((req, res, next) => {
  // Cache static assets for 1 year
  if (req.url.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
  }
  next();
});

// 🟢 Health check route
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'NFL Teammates Game API is running',
    timestamp: new Date().toISOString(),
    redis: redisClient ? 'connected' : 'disabled',
  });
});

// 🟡 Save player info (with rate limiting)
app.post('/api/player', writeLimiter, async (req, res) => {
  const { name, email } = req.body;

  // Input validation
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  if (typeof name !== 'string' || typeof email !== 'string') {
    return res.status(400).json({ error: 'Invalid input format' });
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  try {
    await pool.query(
      'INSERT INTO players (name, email) VALUES ($1, $2)',
      [name.trim(), email.trim().toLowerCase()]
    );
    res.status(200).json({ message: 'Player saved successfully' });
  } catch (err) {
    console.error('Error saving player:', err);
    if (process.env.SENTRY_DSN) {
      Sentry.captureException(err);
    }
    res.status(500).json({ error: 'Error saving player. Please try again.' });
  }
});

// Test DB connection route
app.get('/api/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({
      connected: true,
      time: result.rows[0].now,
      poolSize: pool.totalCount,
      idleConnections: pool.idleCount,
      waitingClients: pool.waitingCount
    });
  } catch (err) {
    console.error('Database connection test failed:', err);
    if (process.env.SENTRY_DSN) {
      Sentry.captureException(err);
    }
    res.status(500).json({ connected: false, error: err.message });
  }
});

const trackRouter = require('./routes/track');
app.use('/api/track', trackRouter);

// S3 Management routes
const s3ManagementRouter = require('./routes/s3-management');
app.use('/api/s3', s3ManagementRouter);

// NFL Trivia Game routes
const triviaRouter = require('./routes/trivia');
app.use('/api/trivia', triviaRouter);

// Journeyman Game routes
const journeymanRouter = require('./routes/journeyman');
app.use('/api/journeyman', journeymanRouter);

app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
  console.log(`📊 Database pool: ${pool.totalCount} connections`);
  console.log(`🔒 Rate limiting: enabled`);
  console.log(`🗜️  Compression: enabled`);
  console.log(`⚡ Redis caching: ${redisClient ? 'enabled' : 'disabled'}`);
  console.log(`🐛 Sentry logging: ${process.env.SENTRY_DSN ? 'enabled' : 'disabled'}`);
});

// Export pool and redis client for use in other modules
module.exports = { pool, redisClient };