import { Queue } from 'bullmq';
import { queueRedis, createSafeRedisConnection, checkRedisHealth } from '../config/redis.js';
import {
  databaseSmsQueue,
  databaseCampaignQueue,
  databaseAutomationQueue,
} from './database-queue.js';
import { logger } from '../utils/logger.js';

/**
 * Enhanced Queue System with Redis Fallback to Database
 *
 * Automatically falls back to database-based queues when Redis is unavailable.
 */

let redisAvailable = true;
let lastRedisCheck = 0;
const REDIS_CHECK_INTERVAL = 30000; // Check every 30 seconds

/**
 * Check Redis availability
 */
async function checkRedisAvailability() {
  const now = Date.now();

  // Only check every 30 seconds to avoid excessive checks
  if (now - lastRedisCheck < REDIS_CHECK_INTERVAL) {
    return redisAvailable;
  }

  lastRedisCheck = now;

  try {
    const health = await checkRedisHealth(queueRedis);
    redisAvailable = health.status === 'healthy';

    if (!redisAvailable) {
      logger.warn('Redis unavailable, using database queue fallback');
    } else if (redisAvailable && health.status === 'healthy') {
      logger.info('Redis is back online');
    }
  } catch (error) {
    logger.warn('Redis health check failed, using database queue', {
      error: error.message,
    });
    redisAvailable = false;
  }

  return redisAvailable;
}

/**
 * Create queue with fallback
 */
function createQueueWithFallback(queueName, options = {}) {
  let redisQueue = null;
  let databaseQueue = null;

  // Try to create Redis queue
  try {
    const redisConnection = createSafeRedisConnection() || queueRedis;
    redisQueue = new Queue(queueName, {
      connection: redisConnection,
      defaultJobOptions: {
        removeOnComplete: options.removeOnComplete || 100,
        removeOnFail: options.removeOnFail || 50,
        attempts: options.attempts || 3,
        backoff: options.backoff || {
          type: 'exponential',
          delay: 2000,
        },
        ...options.defaultJobOptions,
      },
    });

    redisQueue.on('error', (error) => {
      logger.error('Redis queue error', {
        queueName,
        error: error.message,
      });
      redisAvailable = false;
    });

    logger.info('Redis queue created', { queueName });
  } catch (error) {
    logger.warn('Failed to create Redis queue, using database fallback', {
      queueName,
      error: error.message,
    });
    redisAvailable = false;
  }

  // Get database queue based on queue name
  switch (queueName) {
  case 'sms-send':
    databaseQueue = databaseSmsQueue;
    break;
  case 'campaign-send':
    databaseQueue = databaseCampaignQueue;
    break;
  case 'automation-trigger':
    databaseQueue = databaseAutomationQueue;
    break;
  default:
    logger.warn('Unknown queue name for database fallback', { queueName });
  }

  /**
   * Queue wrapper that automatically chooses Redis or Database
   */
  return {
    async add(jobName, data, jobOptions = {}) {
      await checkRedisAvailability();

      if (redisAvailable && redisQueue) {
        try {
          return await redisQueue.add(jobName, data, jobOptions);
        } catch (error) {
          logger.warn('Redis queue add failed, falling back to database', {
            queueName,
            error: error.message,
          });
          redisAvailable = false;
          // Fall through to database queue
        }
      }

      // Use database queue
      if (databaseQueue) {
        return await databaseQueue.add(jobName, data, jobOptions);
      }

      throw new Error(`No queue available for ${queueName}`);
    },

    async getJob(jobId) {
      if (redisAvailable && redisQueue) {
        try {
          return await redisQueue.getJob(jobId);
        } catch (error) {
          logger.warn('Redis queue getJob failed', {
            queueName,
            jobId,
            error: error.message,
          });
        }
      }

      if (databaseQueue) {
        return await databaseQueue.getJob(jobId);
      }

      return null;
    },

    async remove(jobId) {
      if (redisAvailable && redisQueue) {
        try {
          return await redisQueue.remove(jobId);
        } catch (error) {
          logger.warn('Redis queue remove failed', {
            queueName,
            jobId,
            error: error.message,
          });
        }
      }

      if (databaseQueue) {
        return await databaseQueue.remove(jobId);
      }
    },

    async getWaiting() {
      if (redisAvailable && redisQueue) {
        try {
          return await redisQueue.getWaiting();
        } catch (error) {
          logger.warn('Redis queue getWaiting failed', {
            queueName,
            error: error.message,
          });
        }
      }

      if (databaseQueue) {
        const stats = await databaseQueue.getStats();
        // Return mock array for compatibility
        return Array(stats.pending).fill(null);
      }

      return [];
    },

    async getStats() {
      if (redisAvailable && redisQueue) {
        try {
          const waiting = await redisQueue.getWaiting();
          const active = await redisQueue.getActive();
          const completed = await redisQueue.getCompleted();
          const failed = await redisQueue.getFailed();

          return {
            waiting: waiting.length,
            active: active.length,
            completed: completed.length,
            failed: failed.length,
            type: 'redis',
          };
        } catch (error) {
          logger.warn('Redis queue getStats failed', {
            queueName,
            error: error.message,
          });
        }
      }

      if (databaseQueue) {
        const stats = await databaseQueue.getStats();
        return {
          ...stats,
          type: 'database',
        };
      }

      return {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        type: 'none',
      };
    },

    async close() {
      if (redisQueue) {
        try {
          await redisQueue.close();
        } catch (error) {
          logger.error('Error closing Redis queue', {
            queueName,
            error: error.message,
          });
        }
      }

      if (databaseQueue) {
        await databaseQueue.stopProcessing();
      }
    },
  };
}

// Create queues with fallback
export const smsQueue = createQueueWithFallback('sms-send', {
  removeOnComplete: 100,
  removeOnFail: 50,
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000,
  },
});

export const campaignQueue = createQueueWithFallback('campaign-send', {
  removeOnComplete: 50,
  removeOnFail: 25,
  attempts: 2,
  backoff: {
    type: 'fixed',
    delay: 5000,
  },
});

export const automationQueue = createQueueWithFallback('automation-trigger', {
  removeOnComplete: 200,
  removeOnFail: 100,
  attempts: 2,
  backoff: {
    type: 'exponential',
    delay: 1000,
  },
});

// Queue health check
export const getQueueHealth = async () => {
  try {
    await checkRedisAvailability();

    const [smsStats, campaignStats, automationStats] = await Promise.all([
      smsQueue.getStats(),
      campaignQueue.getStats(),
      automationQueue.getStats(),
    ]);

    return {
      sms: {
        ...smsStats,
        status: 'healthy',
      },
      campaign: {
        ...campaignStats,
        status: 'healthy',
      },
      automation: {
        ...automationStats,
        status: 'healthy',
      },
      redisAvailable,
    };
  } catch (error) {
    return {
      error: error.message,
      status: 'unhealthy',
      redisAvailable: false,
    };
  }
};

export default {
  smsQueue,
  campaignQueue,
  automationQueue,
  getQueueHealth,
};

