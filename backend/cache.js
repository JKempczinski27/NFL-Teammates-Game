/**
 * Redis Cache Layer for Horizontal Scaling
 * Caches frequently accessed data to reduce database load
 */

const redis = require('redis');

// Redis client configuration
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    connectTimeout: 5000,
    reconnectStrategy: (retries) => {
      // Exponential backoff with max 3 second delay
      if (retries > 10) {
        console.error('❌ Redis: Max reconnection attempts reached');
        return new Error('Max reconnection attempts reached');
      }
      return Math.min(retries * 100, 3000);
    }
  }
});

// Event handlers
redisClient.on('error', (err) => {
  console.error('❌ Redis Error:', err.message);
});

redisClient.on('connect', () => {
  console.log('🔌 Redis: Connecting...');
});

redisClient.on('ready', () => {
  console.log('✅ Redis: Connected and ready');
});

redisClient.on('reconnecting', () => {
  console.log('🔄 Redis: Reconnecting...');
});

// Connect to Redis
let isRedisAvailable = false;
(async () => {
  try {
    await redisClient.connect();
    isRedisAvailable = true;
  } catch (err) {
    console.warn('⚠️  Redis unavailable - running without cache:', err.message);
    isRedisAvailable = false;
  }
})();

/**
 * Cache middleware for Express routes
 * @param {number} ttl - Time to live in seconds
 */
function cacheMiddleware(ttl = 60) {
  return async (req, res, next) => {
    if (!isRedisAvailable) {
      return next(); // Skip caching if Redis is unavailable
    }

    const cacheKey = `cache:${req.originalUrl || req.url}`;

    try {
      const cachedData = await redisClient.get(cacheKey);

      if (cachedData) {
        // Cache hit
        console.log(`💾 Cache HIT: ${cacheKey}`);
        return res.json({
          ...JSON.parse(cachedData),
          _cached: true,
          _cacheTimestamp: new Date().toISOString()
        });
      }

      // Cache miss - modify res.json to cache the response
      const originalJson = res.json.bind(res);
      res.json = function(body) {
        // Cache the response
        redisClient.setEx(cacheKey, ttl, JSON.stringify(body))
          .catch(err => console.error('Cache write error:', err));

        console.log(`💾 Cache MISS: ${cacheKey} (caching for ${ttl}s)`);
        return originalJson(body);
      };

      next();
    } catch (err) {
      console.error('Cache middleware error:', err);
      next(); // Continue without caching on error
    }
  };
}

/**
 * Invalidate cache by pattern
 * @param {string} pattern - Redis key pattern (e.g., 'cache:*/api/players*')
 */
async function invalidateCache(pattern) {
  if (!isRedisAvailable) return;

  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
      console.log(`🗑️  Invalidated ${keys.length} cache entries matching: ${pattern}`);
    }
  } catch (err) {
    console.error('Cache invalidation error:', err);
  }
}

/**
 * Get cached value
 * @param {string} key - Cache key
 * @returns {Promise<any>} - Cached value or null
 */
async function get(key) {
  if (!isRedisAvailable) return null;

  try {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (err) {
    console.error('Cache get error:', err);
    return null;
  }
}

/**
 * Set cached value
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttl - Time to live in seconds
 */
async function set(key, value, ttl = 60) {
  if (!isRedisAvailable) return;

  try {
    await redisClient.setEx(key, ttl, JSON.stringify(value));
  } catch (err) {
    console.error('Cache set error:', err);
  }
}

/**
 * Delete cached value
 * @param {string} key - Cache key
 */
async function del(key) {
  if (!isRedisAvailable) return;

  try {
    await redisClient.del(key);
  } catch (err) {
    console.error('Cache delete error:', err);
  }
}

/**
 * Get cache statistics
 */
async function getStats() {
  if (!isRedisAvailable) {
    return { available: false };
  }

  try {
    const info = await redisClient.info('stats');
    const keyspace = await redisClient.info('keyspace');
    const memory = await redisClient.info('memory');

    return {
      available: true,
      connected: redisClient.isReady,
      info,
      keyspace,
      memory
    };
  } catch (err) {
    return { available: false, error: err.message };
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  if (isRedisAvailable) {
    await redisClient.quit();
    console.log('Redis connection closed');
  }
});

module.exports = {
  redisClient,
  isRedisAvailable: () => isRedisAvailable,
  cacheMiddleware,
  invalidateCache,
  get,
  set,
  del,
  getStats
};
