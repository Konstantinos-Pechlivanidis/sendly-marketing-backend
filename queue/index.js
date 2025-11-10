import { Queue } from 'bullmq';
import { queueRedis } from '../config/redis.js';

// Skip queues in test mode for faster tests
const skipQueues = process.env.NODE_ENV === 'test' && process.env.SKIP_QUEUES === 'true';

// Mock Queue class for tests
class MockQueue {
  constructor(name, options) {
    this.name = name;
    this.options = options;
  }
  async add() { return { id: 'mock-job' }; }
  async getJob() { return null; }
  async getJobs() { return []; }
  async getWaiting() { return []; }
  async clean() { return []; }
  async close() { return Promise.resolve(); }
  on() { return this; }
  once() { return this; }
}

// SMS Queue configuration
// Optimized for large-scale SMS sending (100k+ recipients)
export const smsQueue = skipQueues ? new MockQueue('sms-send', {}) : new Queue('sms-send', {
  connection: queueRedis,
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
export const campaignQueue = skipQueues ? new MockQueue('campaign-send', {}) : new Queue('campaign-send', {
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
export const automationQueue = skipQueues ? new MockQueue('automation-trigger', {}) : new Queue('automation-trigger', {
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
