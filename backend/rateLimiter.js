/**
 * Rate Limiting for API Protection
 * Prevents abuse and ensures fair resource allocation across clients
 */

const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const { redisClient, isRedisAvailable } = require('./cache');

/**
 * Create a rate limiter with optional Redis store
 * Redis is used for distributed rate limiting across multiple instances
 */
function createRateLimiter(options = {}) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // Max requests per window
    message = 'Too many requests, please try again later.',
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    keyGenerator = undefined
  } = options;

  const limiterConfig = {
    windowMs,
    max,
    message: {
      success: false,
      error: message,
      retryAfter: windowMs / 1000
    },
    skipSuccessfulRequests,
    skipFailedRequests,
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    // Custom key generator (default: IP address)
    keyGenerator: keyGenerator || ((req) => {
      // Use X-Forwarded-For if behind a proxy, otherwise use IP
      return req.headers['x-forwarded-for']?.split(',')[0].trim() ||
             req.headers['x-real-ip'] ||
             req.ip ||
             req.connection.remoteAddress;
    }),
    // Handler for when limit is exceeded
    handler: (req, res) => {
      console.warn(`⚠️  Rate limit exceeded for ${req.ip} on ${req.path}`);
      res.status(429).json({
        success: false,
        error: message,
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
  };

  // Use Redis store if available for distributed rate limiting
  if (isRedisAvailable()) {
    limiterConfig.store = new RedisStore({
      // @ts-expect-error - Type mismatch but works
      client: redisClient,
      prefix: 'rl:', // Rate limit key prefix
      sendCommand: (...args) => redisClient.sendCommand(args)
    });
    console.log('✅ Rate limiter using Redis store (distributed)');
  } else {
    console.log('⚠️  Rate limiter using memory store (single instance only)');
  }

  return rateLimit(limiterConfig);
}

/**
 * Strict rate limiter for sensitive endpoints (login, registration, etc.)
 */
const strictLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Only 5 requests per 15 minutes
  message: 'Too many attempts, please try again later.',
  skipSuccessfulRequests: true // Don't count successful requests
});

/**
 * Standard API rate limiter
 */
const apiLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: 'API rate limit exceeded. Please slow down your requests.'
});

/**
 * Lenient rate limiter for read-only endpoints
 */
const readLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Rate limit exceeded. Please try again shortly.',
  skipSuccessfulRequests: false
});

/**
 * Rate limiter for write operations
 */
const writeLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 writes per minute
  message: 'Write rate limit exceeded. Please slow down.',
  skipSuccessfulRequests: false
});

/**
 * Custom rate limiter by session ID
 */
const sessionLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50,
  message: 'Session rate limit exceeded.',
  keyGenerator: (req) => {
    // Use session ID from body or query
    return req.body?.session_id || req.query?.session_id || req.ip;
  }
});

module.exports = {
  createRateLimiter,
  strictLimiter,
  apiLimiter,
  readLimiter,
  writeLimiter,
  sessionLimiter
};
