import prisma from '../services/prisma.js';
import { logger } from '../utils/logger.js';

/**
 * Store Resolution Middleware - Single Source of Truth
 *
 * This middleware extracts store information from various sources and ensures
 * all subsequent operations are scoped to the correct store (tenant).
 *
 * Sources (in order of precedence):
 * 1. Shopify session/JWT with shop domain
 * 2. App installation context
 * 3. Admin bearer token mapped to specific store
 * 4. Development mode fallback
 */

export async function resolveStore(req, res, next) {
  try {
    let storeId = null;
    let shopDomain = null;
    let store = null;

    // Method 1: Shopify session/JWT (primary method)
    if (req.headers['x-shopify-shop-domain'] || req.query.shop) {
      shopDomain = req.headers['x-shopify-shop-domain'] || req.query.shop;

      // Normalize shop domain
      if (shopDomain && !shopDomain.includes('.')) {
        shopDomain = `${shopDomain}.myshopify.com`;
      }

      store = await prisma.shop.findUnique({
        where: { shopDomain },
        include: {
          settings: true,
        },
      });

      if (store) {
        storeId = store.id;
        logger.info('Store resolved from Shopify context', {
          shopDomain,
          storeId,
          method: 'shopify',
        });
      }
    }

    // Method 2: Admin bearer token (for admin operations)
    if (!store && req.headers.authorization) {
      const token = req.headers.authorization.replace('Bearer ', '');

      // In production, this would validate against your admin token system
      if (process.env.NODE_ENV === 'development' && token === process.env.ADMIN_TOKEN) {
        // For development, use the first available store
        store = await prisma.shop.findFirst({
          include: {
            settings: true,
          },
        });

        if (store) {
          storeId = store.id;
          shopDomain = store.shopDomain;
          logger.info('Store resolved from admin token', {
            storeId,
            shopDomain,
            method: 'admin',
          });
        }
      }
    }

    // Method 3: Development mode fallback
    if (!store && process.env.NODE_ENV === 'development') {
      store = await prisma.shop.findFirst({
        include: {
          settings: true,
        },
      });

      if (store) {
        storeId = store.id;
        shopDomain = store.shopDomain;
        logger.info('Store resolved from development fallback', {
          storeId,
          shopDomain,
          method: 'development',
        });
      }
    }

    // Method 4: Explicit store ID in headers (for internal services)
    if (!store && req.headers['x-store-id']) {
      storeId = req.headers['x-store-id'];
      store = await prisma.shop.findUnique({
        where: { id: storeId },
        include: {
          settings: true,
        },
      });

      if (store) {
        shopDomain = store.shopDomain;
        logger.info('Store resolved from explicit store ID', {
          storeId,
          shopDomain,
          method: 'explicit',
        });
      }
    }

    // Validation: Ensure store was found
    if (!store || !storeId) {
      logger.warn('Store resolution failed', {
        headers: req.headers,
        query: req.query,
        url: req.url,
      });

      return res.status(401).json({
        success: false,
        error: 'Store not found',
        message: 'Unable to resolve store context. Please ensure you are properly authenticated.',
        code: 'STORE_NOT_FOUND',
      });
    }

    // Attach store context to request
    req.ctx = {
      store: {
        id: store.id,
        shopDomain: store.shopDomain,
        credits: store.credits,
        currency: store.settings?.currency || 'EUR',
        timezone: store.settings?.timezone || 'UTC',
        senderNumber: store.settings?.senderNumber,
        senderName: store.settings?.senderName,
        settings: store.settings,
        createdAt: store.createdAt,
        updatedAt: store.updatedAt,
      },
    };

    // Add store context to logger for this request
    req.logger = logger.child({ storeId, shopDomain });

    logger.info('Store context established', {
      storeId,
      shopDomain,
      credits: store.credits,
      currency: store.settings?.currency,
    });

    next();
  } catch (error) {
    logger.error('Store resolution middleware failed', {
      error: error.message,
      headers: req.headers,
      query: req.query,
    });

    res.status(500).json({
      success: false,
      error: 'Store resolution failed',
      message: 'Internal error during store resolution',
      code: 'STORE_RESOLUTION_ERROR',
    });
  }
}

/**
 * Middleware to ensure store context exists
 * Use this on routes that require store context
 */
export function requireStore(req, res, next) {
  if (!req.ctx?.store?.id) {
    return res.status(401).json({
      success: false,
      error: 'Store context required',
      message: 'This endpoint requires store context. Please ensure you are properly authenticated.',
      code: 'STORE_CONTEXT_REQUIRED',
    });
  }
  next();
}

/**
 * Helper to get store ID from request context
 */
export function getStoreId(req) {
  if (!req.ctx?.store?.id) {
    throw new Error('Store context not available');
  }
  return req.ctx.store.id;
}

/**
 * Helper to get store domain from request context
 */
export function getStoreDomain(req) {
  if (!req.ctx?.store?.shopDomain) {
    throw new Error('Store context not available');
  }
  return req.ctx.store.shopDomain;
}

/**
 * Helper to get full store context
 */
export function getStoreContext(req) {
  if (!req.ctx?.store) {
    throw new Error('Store context not available');
  }
  return req.ctx.store;
}

export default {
  resolveStore,
  requireStore,
  getStoreId,
  getStoreDomain,
  getStoreContext,
};
