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
    // Check multiple possible sources for shop domain
    const possibleShopDomain = 
      req.headers['x-shopify-shop-domain'] || 
      req.headers['x-shopify-shop'] ||
      req.headers['x-shopify-shop-name'] ||
      req.query.shop || 
      req.query.shop_domain ||
      req.query.shop_name ||
      req.body?.shop ||
      req.body?.shop_domain ||
      req.body?.shop_name;

    // Method 1.5: Extract shop domain from URL path (for embedded Shopify apps)
    // URL pattern: /store/{shop-domain}/apps/{app-name}/app
    let shopDomainFromPath = null;
    if (!possibleShopDomain && req.url) {
      const pathMatch = req.url.match(/\/store\/([^\/]+)\//);
      if (pathMatch && pathMatch[1]) {
        shopDomainFromPath = pathMatch[1];
        // Ensure it has .myshopify.com suffix
        if (!shopDomainFromPath.includes('.')) {
          shopDomainFromPath = `${shopDomainFromPath}.myshopify.com`;
        }
      }
    }

    if (possibleShopDomain) {
      shopDomain = possibleShopDomain;

      // Normalize shop domain
      if (shopDomain && !shopDomain.includes('.')) {
        shopDomain = `${shopDomain}.myshopify.com`;
      }

      logger.info('Attempting to resolve store from headers/query/body', { 
        shopDomain, 
        headers: req.headers,
        query: req.query,
        body: req.body ? Object.keys(req.body) : 'no body'
      });
    } else if (shopDomainFromPath) {
      shopDomain = shopDomainFromPath;
      logger.info('Attempting to resolve store from URL path', { 
        shopDomain,
        url: req.url,
        extractedFromPath: true
      });
    } else {
      // Try to extract from Shopify App Bridge session or JWT
      const shopifySession = req.session?.shopify || req.session?.shop;
      if (shopifySession) {
        shopDomain = shopifySession.shop || shopifySession.shopDomain;
        if (shopDomain && !shopDomain.includes('.')) {
          shopDomain = `${shopDomain}.myshopify.com`;
        }
        logger.info('Found shop domain in session', { shopDomain, session: shopifySession });
      }
    }

    if (!shopDomain) {
      // No shop domain provided - use development fallback
      logger.warn('No shop domain provided in headers, query, or body', {
        headers: Object.keys(req.headers),
        query: req.query,
        body: req.body ? Object.keys(req.body) : 'no body',
        url: req.url
      });
      
      // For development/testing, use a default store
      shopDomain = 'sms-blossom-dev.myshopify.com';
      logger.info('Using development fallback store', { shopDomain });
    }

    // Ensure shopDomain is never undefined
    if (!shopDomain) {
      shopDomain = 'sms-blossom-dev.myshopify.com';
      logger.warn('shopDomain was undefined, using fallback', { shopDomain });
    }

    try {
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
      } else {
        // Auto-create store if it doesn't exist
        logger.info('Store not found, creating new store', { shopDomain });

        store = await prisma.shop.create({
          data: {
            shopDomain,
            shopName: shopDomain.replace('.myshopify.com', ''),
            accessToken: req.headers['x-shopify-access-token'] || 'pending',
            credits: 100, // Give some initial credits
            currency: 'EUR',
            status: 'active',
            settings: {
              create: {
                currency: 'EUR',
                timezone: 'Europe/Athens',
                senderNumber: process.env.MITTO_SENDER_NAME || 'Sendly',
                senderName: process.env.MITTO_SENDER_NAME || 'Sendly',
              },
            },
          },
          include: {
            settings: true,
          },
        });

        storeId = store.id;
        logger.info('Store created automatically', {
          shopDomain,
          storeId,
          method: 'auto-create',
        });
      }
    } catch (dbError) {
      logger.error('Database error during store resolution', {
        shopDomain,
        error: dbError.message,
      });
      throw dbError;
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
    req.logger = logger;

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
