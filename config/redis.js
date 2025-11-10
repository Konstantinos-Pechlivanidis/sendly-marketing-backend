import IORedis from 'ioredis';

// Production Redis configuration
export const redisConfig = {
  // Connection settings
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  db: process.env.REDIS_DB || 0,

  // Connection pool settings
  maxRetriesPerRequest: null,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  lazyConnect: true,

  // Timeout settings (increased for cloud connections)
  connectTimeout: 30000,
  commandTimeout: 10000,

  // Retry settings
  retryDelayOnClusterDown: 300,

  // Keep alive settings
  keepAlive: 30000,

  // Cluster settings (if using Redis Cluster)
  enableOfflineQueue: false,

  // Memory optimization
  maxMemoryPolicy: 'allkeys-lru',

  // Logging
  enableAutoPipelining: true,
};

// Create Redis connection
export const createRedisConnection = (config = {}) => {
  const finalConfig = { ...redisConfig, ...config };

  // Handle Redis URL format (supports both URL string and connection object)
  if (process.env.REDIS_URL) {
    return new IORedis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
      connectTimeout: 10000,
      commandTimeout: 5000,
      retryDelayOnFailover: 100,
      enableOfflineQueue: false,
      // Support for Redis Cloud with username/password
      username: process.env.REDIS_USERNAME,
      password: process.env.REDIS_PASSWORD,
    });
  }

  // If REDIS_HOST and REDIS_PORT are provided, use object format
  if (process.env.REDIS_HOST && process.env.REDIS_PORT) {
    return new IORedis({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT, 10),
      username: process.env.REDIS_USERNAME || 'default',
      password: process.env.REDIS_PASSWORD,
      // Redis Cloud requires TLS
      tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
      // Increase timeouts for cloud connections
      connectTimeout: 30000,
      commandTimeout: 10000,
      // Keep alive for cloud connections
      keepAlive: 30000,
      // Retry settings
      retryStrategy: (times) => {
        if (times > 3) {
          return null; // Stop retrying after 3 attempts
        }
        return Math.min(times * 200, 2000); // Exponential backoff
      },
      ...finalConfig,
    });
  }

  return new IORedis(finalConfig);
};

// Skip Redis in test mode for faster tests
const skipRedis = process.env.NODE_ENV === 'test' && process.env.SKIP_REDIS === 'true';

// Mock Redis class for tests
class MockRedis {
  constructor() {
    this.status = 'ready';
    this.data = new Map();
  }
  async connect() { return Promise.resolve(); }
  async disconnect() { return Promise.resolve(); }
  async get() { return null; }
  async set() { return 'OK'; }
  async del() { return 1; }
  async exists() { return 0; }
  async keys() { return []; }
  async flushdb() { return 'OK'; }
  on() { return this; }
  once() { return this; }
  removeListener() { return this; }
}

// Redis connection for queues
export const queueRedis = skipRedis ? new MockRedis() : createRedisConnection({
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

// Redis connection for caching
export const cacheRedis = skipRedis ? new MockRedis() : createRedisConnection({
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
});

// Redis connection for sessions (if needed)
export const sessionRedis = skipRedis ? new MockRedis() : createRedisConnection({
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
});

// Fallback Redis connections with error handling
export const createSafeRedisConnection = async (config = {}) => {
  try {
    const connection = createRedisConnection(config);
    return connection;
  } catch (error) {
    const { logger } = await import('../utils/logger.js').catch(() => ({ logger: console }));
    logger.warn('Redis connection failed, using fallback', { error: error.message });
    return null;
  }
};

// Health check function
export const checkRedisHealth = async (redis) => {
  try {
    const start = Date.now();
    await redis.ping();
    const latency = Date.now() - start;

    return {
      status: 'healthy',
      latency: `${latency}ms`,
      connected: redis.status === 'ready',
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      connected: false,
    };
  }
};

// Graceful shutdown
export const closeRedisConnections = async () => {
  try {
    // Import logger dynamically to avoid circular dependencies
    const { logger } = await import('../utils/logger.js');

    await Promise.all([
      queueRedis.quit(),
      cacheRedis.quit(),
      sessionRedis.quit(),
    ]);
    logger.info('Redis connections closed gracefully');
  } catch (error) {
    // Fallback to console if logger import fails
    const { logger } = await import('../utils/logger.js').catch(() => ({ logger: console }));
    logger.error('Error closing Redis connections', { error: error.message });
  }
};

// Error handling
const handleRedisError = (redis, name) => {
  // Use lazy logger import to avoid circular dependencies
  let logger = null;
  const getLogger = async () => {
    if (!logger) {
      try {
        const loggerModule = await import('../utils/logger.js');
        logger = loggerModule.logger;
      } catch {
        logger = console; // Fallback to console
      }
    }
    return logger;
  };

  redis.on('error', async (error) => {
    const log = await getLogger();
    log.error(`Redis ${name} error`, { error: error.message, name });
  });

  redis.on('connect', async () => {
    const log = await getLogger();
    log.info(`Redis ${name} connected`, { name });
  });

  redis.on('ready', async () => {
    const log = await getLogger();
    log.info(`Redis ${name} ready`, { name });
  });

  redis.on('close', async () => {
    const log = await getLogger();
    log.info(`Redis ${name} connection closed`, { name });
  });

  redis.on('reconnecting', async () => {
    const log = await getLogger();
    log.info(`Redis ${name} reconnecting`, { name });
  });
};

// Set up error handling for all connections
handleRedisError(queueRedis, 'Queue');
handleRedisError(cacheRedis, 'Cache');
handleRedisError(sessionRedis, 'Session');

// Note: Graceful shutdown is handled in index.js
// This ensures proper cleanup order (HTTP server -> Redis -> Prisma)
