import { getStoreId } from '../middlewares/store-resolution.js';
import { logger } from '../utils/logger.js';
import billingService from '../services/billing.js';

/**
 * Billing Controller
 * Uses service layer for all billing and credit management logic
 */

/**
 * Get current credit balance
 * @route GET /billing/balance
 */
export async function getBalance(req, res, next) {
  try {
    const storeId = getStoreId(req);

    const balance = await billingService.getBalance(storeId);

    return res.json({
      success: true,
      data: balance,
    });
  } catch (error) {
    logger.error('Get balance error', {
      error: error.message,
      storeId: getStoreId(req),
    });
    next(error);
  }
}

/**
 * Get available credit packages
 * @route GET /billing/packages
 */
export async function getPackages(req, res, next) {
  try {
    const packages = billingService.getPackages();

    return res.json({
      success: true,
      data: packages,
    });
  } catch (error) {
    logger.error('Get packages error', {
      error: error.message,
    });
    next(error);
  }
}

/**
 * Create Stripe checkout session for credit purchase
 * @route POST /billing/purchase
 */
export async function createPurchase(req, res, next) {
  try {
    const storeId = getStoreId(req);
    const { packageId, successUrl, cancelUrl } = req.body;

    if (!packageId) {
      return res.status(400).json({
        success: false,
        error: 'Package ID required',
        message: 'Package ID is required to create purchase session',
      });
    }

    if (!successUrl || !cancelUrl) {
      return res.status(400).json({
        success: false,
        error: 'Return URLs required',
        message: 'Success and cancel URLs are required',
      });
    }

    const session = await billingService.createPurchaseSession(
      storeId,
      packageId,
      { successUrl, cancelUrl }
    );

    return res.json({
      success: true,
      data: session,
      message: 'Checkout session created successfully',
    });
  } catch (error) {
    logger.error('Create purchase error', {
      error: error.message,
      storeId: getStoreId(req),
      body: req.body,
    });
    next(error);
  }
}

/**
 * Get transaction history
 * @route GET /billing/history
 */
export async function getHistory(req, res, next) {
  try {
    const storeId = getStoreId(req);
    const filters = {
      page: req.query.page,
      pageSize: req.query.pageSize,
      type: req.query.type,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };

    const result = await billingService.getTransactionHistory(storeId, filters);

    return res.json({
      success: true,
      data: {
        transactions: result.transactions,
        pagination: result.pagination,
      },
    });
  } catch (error) {
    logger.error('Get transaction history error', {
      error: error.message,
      storeId: getStoreId(req),
      query: req.query,
    });
    next(error);
  }
}

/**
 * Get billing history (Stripe transactions)
 * @route GET /billing/billing-history
 */
export async function getBillingHistory(req, res, next) {
  try {
    const storeId = getStoreId(req);
    const filters = {
      page: req.query.page,
      pageSize: req.query.pageSize,
      status: req.query.status,
    };

    const result = await billingService.getBillingHistory(storeId, filters);

    return res.json({
      success: true,
      data: {
        transactions: result.transactions,
        pagination: result.pagination,
      },
    });
  } catch (error) {
    logger.error('Get billing history error', {
      error: error.message,
      storeId: getStoreId(req),
      query: req.query,
    });
    next(error);
  }
}

export default {
  getBalance,
  getPackages,
  createPurchase,
  getHistory,
  getBillingHistory,
};
