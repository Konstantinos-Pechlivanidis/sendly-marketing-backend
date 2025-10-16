import IORedis from 'ioredis';

// Production Redis configuration
export const redisConfig = {
  // Connection settings
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  db: process.env.REDIS_DB || 0,
  
  // Connection pool settings
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  lazyConnect: true,
  
  // Timeout settings
  connectTimeout: 10000,
  commandTimeout: 5000,
  
  // Retry settings
  retryDelayOnClusterDown: 300,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  
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
  
  // Handle Redis URL format
  if (process.env.REDIS_URL) {
    return new IORedis(process.env.REDIS_URL, {
      ...finalConfig,
      maxRetriesPerRequest: null,
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
