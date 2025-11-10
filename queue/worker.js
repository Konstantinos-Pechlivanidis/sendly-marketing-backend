import { Worker } from 'bullmq';
import { queueRedis } from '../config/redis.js';
import { handleMittoSend } from './jobs/mittoSend.js';
import { logger } from '../utils/logger.js';

// Skip workers in test mode for faster tests
const skipWorkers = process.env.NODE_ENV === 'test' && process.env.SKIP_QUEUES === 'true';

// Mock Worker class for tests
class MockWorker {
  constructor(name, processor, options) {
    this.name = name;
    this.processor = processor;
    this.options = options;
  }
  async close() { return Promise.resolve(); }
  on() { return this; }
  once() { return this; }
}

// SMS Worker
// Optimized for high-volume SMS sending (500k+ SMS/day)
// Concurrency and rate limits adjusted for Black Friday peak loads
export const smsWorker = skipWorkers ? new MockWorker('sms-send', () => {}, {}) : new Worker(
  'sms-send',
  async (job) => {
    logger.info(`Processing SMS job ${job.id}`, { jobData: job.data });
    return await handleMittoSend(job);
  },
  {
    connection: queueRedis,
    concurrency: 200, // Increased from 50 to handle 500k+ SMS campaigns
    removeOnComplete: 1000, // Keep more completed jobs for monitoring
    removeOnFail: 500, // Keep more failed jobs for analysis
    limiter: {
      max: 500, // Max 500 jobs per duration (increased from 100)
      // Note: Verify with Mitto support for enterprise rate limits
      // Standard accounts: 100-200 SMS/second
      // Enterprise accounts: 500-1000 SMS/second (contact Mitto)
      duration: 1000, // Per second
    },
  },
);

// Campaign Worker
export const campaignWorker = skipWorkers ? new MockWorker('campaign-send', () => {}, {}) : new Worker(
  'campaign-send',
  async (job) => {
    logger.info(`Processing campaign job ${job.id}`, { jobData: job.data });
    // TODO: Implement campaign processing logic
    return { status: 'processed', jobId: job.id };
  },
  {
    connection: queueRedis,
    concurrency: 5,
    removeOnComplete: 50,
    removeOnFail: 25,
  },
);

// Automation Worker
export const automationWorker = skipWorkers ? new MockWorker('automation-trigger', () => {}, {}) : new Worker(
  'automation-trigger',
  async (job) => {
    logger.info(`Processing automation job ${job.id}`, { jobData: job.data });
    // TODO: Implement automation processing logic
    return { status: 'processed', jobId: job.id };
  },
  {
    connection: queueRedis,
    concurrency: 10,
    removeOnComplete: 200,
    removeOnFail: 100,
  },
);

// Event handlers for SMS Worker
smsWorker.on('completed', (job) => {
  logger.info(`SMS job completed: ${job.id}`, { duration: job.processedOn - job.timestamp });
});

smsWorker.on('failed', (job, err) => {
  logger.error(`SMS job failed: ${job?.id}`, { error: err.message, attempts: job.attemptsMade });
});

smsWorker.on('stalled', (job) => {
  logger.warn(`SMS job stalled: ${job.id}`);
});

// Event handlers for Campaign Worker
campaignWorker.on('completed', (job) => {
  logger.info(`Campaign job completed: ${job.id}`, { duration: job.processedOn - job.timestamp });
});

campaignWorker.on('failed', (job, err) => {
  logger.error(`Campaign job failed: ${job?.id}`, { error: err.message, attempts: job.attemptsMade });
});

// Event handlers for Automation Worker
automationWorker.on('completed', (job) => {
  logger.info(`Automation job completed: ${job.id}`, { duration: job.processedOn - job.timestamp });
});

automationWorker.on('failed', (job, err) => {
  logger.error(`Automation job failed: ${job?.id}`, { error: err.message, attempts: job.attemptsMade });
});

// Graceful shutdown
const gracefulShutdown = async () => {
  logger.info('Shutting down workers gracefully...');

  await Promise.all([
    smsWorker.close(),
    campaignWorker.close(),
    automationWorker.close(),
  ]);

  logger.info('All workers shut down');
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

logger.info('Workers started successfully');
