import { getStoreId } from '../middlewares/store-resolution.js';
import { logger } from '../utils/logger.js';
import billingService from '../services/billing.js';
import prisma from '../services/prisma.js';
import { sendSuccess, sendPaginated } from '../utils/response.js';
import { ValidationError } from '../utils/errors.js';

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

    return sendSuccess(res, balance);
  } catch (error) {
    logger.error('Get balance error', {
      error: error.message,
      stack: error.stack,
      storeId: req.ctx?.store?.id,
    });
    next(error);
  }
}

/**
 * Get available credit packages (public - no authentication required)
 * @route GET /public/packages
 */
export async function getPublicPackages(req, res, next) {
  try {
    // Get currency from query param or default to EUR
    const currency = req.query.currency || 'EUR';
    
    // Validate currency
    const validCurrencies = ['EUR', 'USD'];
    const finalCurrency = validCurrencies.includes(currency.toUpperCase()) 
      ? currency.toUpperCase() 
      : 'EUR';
    
    const packages = billingService.getPackages(finalCurrency);

    return sendSuccess(res, { packages, currency: finalCurrency });
  } catch (error) {
    logger.error('Get public packages error', {
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
}

/**
 * Get available credit packages (authenticated - with store context)
 * @route GET /billing/packages
 */
export async function getPackages(req, res, next) {
  try {
    const storeId = getStoreId(req);

    // Get shop currency
    const shop = await prisma.shop.findUnique({
      where: { id: storeId },
      select: { currency: true },
    });

    const currency = shop?.currency || 'EUR';
    const packages = billingService.getPackages(currency);

    return sendSuccess(res, { packages, currency });
  } catch (error) {
    logger.error('Get packages error', {
      error: error.message,
      stack: error.stack,
      storeId: req.ctx?.store?.id,
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
      throw new ValidationError('Package ID is required to create purchase session');
    }

    if (!successUrl || !cancelUrl) {
      throw new ValidationError('Success and cancel URLs are required');
    }

    const session = await billingService.createPurchaseSession(
      storeId,
      packageId,
      { successUrl, cancelUrl },
    );

    return sendSuccess(res, session, 'Checkout session created successfully');
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

    return sendPaginated(res, result.transactions, result.pagination, {
      transactions: result.transactions, // Include for backward compatibility
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

    return sendPaginated(res, result.transactions, result.pagination, {
      transactions: result.transactions, // Include for backward compatibility
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
