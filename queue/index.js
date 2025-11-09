import { Queue } from 'bullmq';
import { queueRedis, createSafeRedisConnection } from '../config/redis.js';

// SMS Queue configuration
// Optimized for large-scale SMS sending (100k+ recipients)
export const smsQueue = new Queue('sms-send', {
  connection: createSafeRedisConnection() || queueRedis,
  defaultJobOptions: {
    removeOnComplete: 500, // Keep more completed jobs for monitoring
    removeOnFail: 100, // Keep more failed jobs for retry
    attempts: 5, // Increased retry attempts for better reliability
    backoff: {
      type: 'exponential',
      delay: 2000, // Start with 2s, then 4s, 8s, 16s, 32s
    },
  },
});

// Campaign Queue for bulk operations
export const campaignQueue = new Queue('campaign-send', {
  connection: createSafeRedisConnection() || queueRedis,
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 25,
    attempts: 2,
    backoff: {
      type: 'fixed',
      delay: 5000,
    },
  },
});

// Automation Queue for triggered messages
export const automationQueue = new Queue('automation-trigger', {
  connection: createSafeRedisConnection() || queueRedis,
  defaultJobOptions: {
    removeOnComplete: 200,
    removeOnFail: 100,
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
});

// Queue health check
export const getQueueHealth = async () => {
  try {
    const [smsWaiting, campaignWaiting, automationWaiting] = await Promise.all([
      smsQueue.getWaiting(),
      campaignQueue.getWaiting(),
      automationQueue.getWaiting(),
    ]);

    return {
      sms: {
        waiting: smsWaiting.length,
        status: 'healthy',
      },
      campaign: {
        waiting: campaignWaiting.length,
        status: 'healthy',
      },
      automation: {
        waiting: automationWaiting.length,
        status: 'healthy',
      },
    };
  } catch (error) {
    return {
      error: error.message,
      status: 'unhealthy',
    };
  }
};

export default { smsQueue, campaignQueue, automationQueue };
