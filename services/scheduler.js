import { logger } from '../utils/logger.js';
import { allCampaignsStatusQueue } from '../queue/index.js';

/**
 * Scheduler Service
 * Handles periodic tasks like updating delivery statuses
 */

/**
 * Schedule periodic delivery status updates
 * This should be called on application startup
 */
export function startPeriodicStatusUpdates() {
  // Skip in test mode
  if (process.env.NODE_ENV === 'test' && process.env.SKIP_QUEUES === 'true') {
    logger.info('Skipping periodic status updates in test mode');
    return;
  }

  // Schedule periodic updates every 5 minutes
  const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

  // Initial delay of 1 minute to let the app fully start
  setTimeout(() => {
    scheduleNextUpdate();
  }, 60000); // 1 minute

  function scheduleNextUpdate() {
    try {
      // Add job to queue
      allCampaignsStatusQueue.add(
        'update-all-campaigns-status',
        {},
        {
          jobId: `periodic-status-update-${Date.now()}`,
          removeOnComplete: true,
        },
      );

      logger.info('Scheduled periodic delivery status update');

      // Schedule next update
      setTimeout(scheduleNextUpdate, INTERVAL_MS);
    } catch (error) {
      logger.error('Failed to schedule periodic status update', {
        error: error.message,
      });
      // Retry after 1 minute if scheduling fails
      setTimeout(scheduleNextUpdate, 60000);
    }
  }

  logger.info('Periodic delivery status updates started', {
    interval: `${INTERVAL_MS / 1000}s`,
  });
}

export default {
  startPeriodicStatusUpdates,
};

