import IORedis from 'ioredis';

class CacheManager {
  constructor() {
    this.redis = null;
    this.memoryCache = new Map();
    this.memoryCacheExpiry = new Map();
    this.maxMemoryCacheSize = 1000; // Maximum items in memory cache
  }

  async initialize() {
    // Skip Redis in development if not explicitly configured
    if (process.env.NODE_ENV === 'development' && !process.env.REDIS_URL) {
      console.log('Development mode: Using memory cache (Redis disabled)');
      this.redis = null;
      return;
    }

    if (process.env.REDIS_URL) {
      try {
        this.redis = new IORedis(process.env.REDIS_URL, {
          maxRetriesPerRequest: 3,
          retryDelayOnFailover: 100,
          enableReadyCheck: false,
          lazyConnect: true,
          connectTimeout: 10000,
          commandTimeout: 5000,
        });

        this.redis.on('error', (err) => {
          console.error('Redis connection error:', err);
        });

        await this.redis.connect();
        console.log('Redis cache initialized');
      } catch (error) {
        console.warn('Redis connection failed, falling back to memory cache:', error.message);
        this.redis = null;
      }
    } else {
      console.log('No Redis URL provided, using memory cache');
    }
  }

  // Generate cache key
  generateKey(prefix, ...parts) {
    return `${prefix}:${parts.join(':')}`;
  }

  // Set cache with TTL
  async set(key, value, ttlSeconds = 300) {
    const serializedValue = JSON.stringify(value);

    if (this.redis) {
      try {
        await this.redis.setex(key, ttlSeconds, serializedValue);
      } catch (error) {
        console.error('Redis set error:', error);
        // Fallback to memory cache
        this.setMemoryCache(key, value, ttlSeconds);
      }
    } else {
      this.setMemoryCache(key, value, ttlSeconds);
    }
  }

  // Get from cache
  async get(key) {
    if (this.redis) {
      try {
        const value = await this.redis.get(key);
        if (value) {
          return JSON.parse(value);
        }
      } catch (error) {
        console.error('Redis get error:', error);
        // Fallback to memory cache
        return this.getMemoryCache(key);
      }
    } else {
      return this.getMemoryCache(key);
    }

    return null;
  }

  // Delete from cache
  async delete(key) {
    if (this.redis) {
      try {
        await this.redis.del(key);
      } catch (error) {
        console.error('Redis delete error:', error);
      }
    }

    this.memoryCache.delete(key);
    this.memoryCacheExpiry.delete(key);
  }

  // Clear cache by pattern
  async clearPattern(pattern) {
    if (this.redis) {
      try {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } catch (error) {
        console.error('Redis clear pattern error:', error);
      }
    }

    // Clear memory cache by pattern
    for (const key of this.memoryCache.keys()) {
      if (key.includes(pattern.replace('*', ''))) {
        this.memoryCache.delete(key);
        this.memoryCacheExpiry.delete(key);
      }
    }
  }

  // Memory cache implementation
  setMemoryCache(key, value, ttlSeconds) {
    // Clean expired entries
    this.cleanExpiredMemoryCache();

    // Remove oldest entries if cache is full
    if (this.memoryCache.size >= this.maxMemoryCacheSize) {
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
      this.memoryCacheExpiry.delete(firstKey);
    }

    this.memoryCache.set(key, value);
    this.memoryCacheExpiry.set(key, Date.now() + ttlSeconds * 1000);
  }

  getMemoryCache(key) {
    const expiry = this.memoryCacheExpiry.get(key);
    if (expiry && Date.now() > expiry) {
      this.memoryCache.delete(key);
      this.memoryCacheExpiry.delete(key);
      return null;
    }

    return this.memoryCache.get(key) || null;
  }

  cleanExpiredMemoryCache() {
    const now = Date.now();
    for (const [key, expiry] of this.memoryCacheExpiry.entries()) {
      if (now > expiry) {
        this.memoryCache.delete(key);
        this.memoryCacheExpiry.delete(key);
      }
    }
  }

  // Cache middleware factory
  createCacheMiddleware(ttlSeconds = 300, keyGenerator = null) {
    return async (req, res, next) => {
      const cacheKey = keyGenerator
        ? keyGenerator(req)
        : this.generateKey('api', req.method, req.originalUrl, JSON.stringify(req.query));

      try {
        const cached = await this.get(cacheKey);
        if (cached) {
          res.setHeader('X-Cache', 'HIT');
          return res.json(cached);
        }
      } catch (error) {
        console.error('Cache get error:', error);
      }

      // Store original json method
      const originalJson = res.json;

      // Override json method to cache response
      res.json = function (data) {
        // Cache the response
        cacheManager.set(cacheKey, data, ttlSeconds).catch((err) => {
          console.error('Cache set error:', err);
        });

        res.setHeader('X-Cache', 'MISS');
        return originalJson.call(this, data);
      };

      next();
    };
  }

  // Health check
  async healthCheck() {
    if (this.redis) {
      try {
        await this.redis.ping();
        return { status: 'healthy', type: 'redis' };
      } catch (error) {
        return { status: 'unhealthy', type: 'redis', error: error.message };
      }
    } else {
      return { status: 'healthy', type: 'memory' };
    }
  }
}

// Create singleton instance
export const cacheManager = new CacheManager();

// Initialize cache on startup
cacheManager.initialize();

// Cache keys constants
export const CACHE_KEYS = {
  SHOP_DATA: (shopDomain) => `shop:${shopDomain}`,
  CONTACTS: (shopId, page, limit) => `contacts:${shopId}:${page}:${limit}`,
  CAMPAIGNS: (shopId, page, limit) => `campaigns:${shopId}:${page}:${limit}`,
  TEMPLATES: (page, limit) => `templates:${page}:${limit}`,
  REPORTS: (shopId, type, dateRange) => `reports:${shopId}:${type}:${dateRange}`,
  WALLET_BALANCE: (shopId) => `wallet:${shopId}`,
  SEGMENTS: (shopId) => `segments:${shopId}`,
};

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 900, // 15 minutes
  VERY_LONG: 3600, // 1 hour
};
