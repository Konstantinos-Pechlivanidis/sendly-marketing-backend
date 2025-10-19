import { Worker } from 'bullmq';
import { queueRedis } from '../config/redis.js';
import { handleMittoSend } from './jobs/mittoSend.js';
import { logger } from '../utils/logger.js';

// SMS Worker
export const smsWorker = new Worker(
  'sms-send',
  async (job) => {
    logger.info(`Processing SMS job ${job.id}`, { jobData: job.data });
    return await handleMittoSend(job);
  },
  {
    connection: queueRedis,
    concurrency: 20,
    removeOnComplete: 100,
    removeOnFail: 50,
  },
);

// Campaign Worker
export const campaignWorker = new Worker(
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
export const automationWorker = new Worker(
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
