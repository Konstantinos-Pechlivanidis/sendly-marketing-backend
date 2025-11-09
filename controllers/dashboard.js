import { getStoreId } from '../middlewares/store-resolution.js';
import { logger } from '../utils/logger.js';
import dashboardService from '../services/dashboard.js';
import { sendSuccess } from '../utils/response.js';

/**
 * Get dashboard overview
 * @route GET /dashboard/overview
 */
export async function overview(req, res, next) {
  try {
    const storeId = getStoreId(req);
    const data = await dashboardService.getOverview(storeId);

    return sendSuccess(res, data);
  } catch (error) {
    logger.error('Dashboard overview error', { error: error.message, storeId: getStoreId(req) });
    next(error);
  }
}

/**
 * Get quick stats
 * @route GET /dashboard/quick-stats
 */
export async function quickStats(req, res, next) {
  try {
    const storeId = getStoreId(req);
    const data = await dashboardService.getQuickStats(storeId);

    return sendSuccess(res, data);
  } catch (error) {
    logger.error('Dashboard quick stats error', { error: error.message, storeId: getStoreId(req) });
    next(error);
  }
}
