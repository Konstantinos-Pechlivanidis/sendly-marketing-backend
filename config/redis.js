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

  // Timeout settings
  connectTimeout: 10000,
  commandTimeout: 5000,

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
      ...finalConfig,
    });
  }

  return new IORedis(finalConfig);
};

// Redis connection for queues
export const queueRedis = createRedisConnection({
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

// Redis connection for caching
export const cacheRedis = createRedisConnection({
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
});

// Redis connection for sessions (if needed)
export const sessionRedis = createRedisConnection({
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
});

// Fallback Redis connections with error handling
export const createSafeRedisConnection = (config = {}) => {
  try {
    return createRedisConnection(config);
  } catch (error) {
    console.warn('Redis connection failed, using fallback:', error.message);
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
    await Promise.all([
      queueRedis.quit(),
      cacheRedis.quit(),
      sessionRedis.quit(),
    ]);
    console.log('Redis connections closed gracefully');
  } catch (error) {
    console.error('Error closing Redis connections:', error);
  }
};

// Error handling
const handleRedisError = (redis, name) => {
  redis.on('error', (error) => {
    console.error(`Redis ${name} error:`, error);
  });

  redis.on('connect', () => {
    console.log(`Redis ${name} connected`);
  });

  redis.on('ready', () => {
    console.log(`Redis ${name} ready`);
  });

  redis.on('close', () => {
    console.log(`Redis ${name} connection closed`);
  });

  redis.on('reconnecting', () => {
    console.log(`Redis ${name} reconnecting`);
  });
};

// Set up error handling for all connections
handleRedisError(queueRedis, 'Queue');
handleRedisError(cacheRedis, 'Cache');
handleRedisError(sessionRedis, 'Session');

// Graceful shutdown handlers
process.on('SIGTERM', closeRedisConnections);
process.on('SIGINT', closeRedisConnections);
