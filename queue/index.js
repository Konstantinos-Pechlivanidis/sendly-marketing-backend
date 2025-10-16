import { Queue } from 'bullmq';
import { queueRedis } from '../config/redis.js';

// SMS Queue configuration
export const smsQueue = new Queue('sms-send', {
  connection: queueRedis,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

// Campaign Queue for bulk operations
export const campaignQueue = new Queue('campaign-send', {
  connection: queueRedis,
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
  connection: queueRedis,
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
