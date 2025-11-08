import prisma from './prisma.js';
import { logger } from '../utils/logger.js';
import { shopifyApi } from '@shopify/shopify-api';

/**
 * Shopify Session Storage Service
 *
 * Proper session management with database persistence,
 * token refresh, and expiration handling.
 */

/**
 * Store Shopify session
 */
export async function storeSession(session) {
  try {
    const existing = await prisma.shopifySession.findUnique({
      where: { id: session.id },
    });

    const sessionData = {
      id: session.id,
      shop: session.shop,
      state: session.state || null,
      isOnline: session.isOnline || false,
      scope: session.scope || null,
      expires: session.expires || null,
      accessToken: session.accessToken || null,
      userId: session.onlineAccessInfo?.associated_user?.id || null,
      // Store full session as JSON for flexibility
      sessionData: JSON.stringify(session),
    };

    if (existing) {
      // Update existing session
      await prisma.shopifySession.update({
        where: { id: session.id },
        data: {
          ...sessionData,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new session
      await prisma.shopifySession.create({
        data: sessionData,
      });
    }

    logger.info('Shopify session stored', {
      sessionId: session.id,
      shop: session.shop,
      isOnline: session.isOnline,
    });
  } catch (error) {
    logger.error('Failed to store Shopify session', {
      sessionId: session.id,
      error: error.message,
    });
    throw error;
  }
}

/**
 * Load Shopify session
 */
export async function loadSession(sessionId) {
  try {
    const sessionRecord = await prisma.shopifySession.findUnique({
      where: { id: sessionId },
    });

    if (!sessionRecord) {
      return undefined;
    }

    // Check if session is expired
    if (sessionRecord.expires && new Date(sessionRecord.expires) < new Date()) {
      logger.warn('Shopify session expired', {
        sessionId,
        expires: sessionRecord.expires,
      });

      // Delete expired session
      await deleteSession(sessionId);
      return undefined;
    }

    // Reconstruct session from stored data
    const sessionData = JSON.parse(sessionRecord.sessionData);
    const session = new shopifyApi.session.Session(sessionData);

    logger.debug('Shopify session loaded', {
      sessionId,
      shop: sessionRecord.shop,
    });

    return session;
  } catch (error) {
    logger.error('Failed to load Shopify session', {
      sessionId,
      error: error.message,
    });
    return undefined;
  }
}

/**
 * Delete Shopify session
 */
export async function deleteSession(sessionId) {
  try {
    await prisma.shopifySession.delete({
      where: { id: sessionId },
    });

    logger.info('Shopify session deleted', { sessionId });
  } catch (error) {
    logger.error('Failed to delete Shopify session', {
      sessionId,
      error: error.message,
    });
    throw error;
  }
}

/**
 * Delete all sessions for a shop
 */
export async function deleteSessionsByShop(shopDomain) {
  try {
    const result = await prisma.shopifySession.deleteMany({
      where: { shop: shopDomain },
    });

    logger.info('Shopify sessions deleted for shop', {
      shop: shopDomain,
      count: result.count,
    });

    return result.count;
  } catch (error) {
    logger.error('Failed to delete Shopify sessions for shop', {
      shop: shopDomain,
      error: error.message,
    });
    throw error;
  }
}

/**
 * Get session for shop
 */
export async function getSessionByShop(shopDomain, isOnline = false) {
  try {
    const sessionRecord = await prisma.shopifySession.findFirst({
      where: {
        shop: shopDomain,
        isOnline,
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (!sessionRecord) {
      return undefined;
    }

    // Check expiration
    if (sessionRecord.expires && new Date(sessionRecord.expires) < new Date()) {
      await deleteSession(sessionRecord.id);
      return undefined;
    }

    const sessionData = JSON.parse(sessionRecord.sessionData);
    return new shopifyApi.session.Session(sessionData);
  } catch (error) {
    logger.error('Failed to get session by shop', {
      shop: shopDomain,
      error: error.message,
    });
    return undefined;
  }
}

/**
 * Check if session needs refresh
 */
export async function needsRefresh(sessionId) {
  try {
    const sessionRecord = await prisma.shopifySession.findUnique({
      where: { id: sessionId },
    });

    if (!sessionRecord || !sessionRecord.expires) {
      return false;
    }

    // Refresh if expires within 24 hours
    const expiresAt = new Date(sessionRecord.expires);
    const refreshThreshold = new Date(Date.now() + 24 * 60 * 60 * 1000);

    return expiresAt < refreshThreshold;
  } catch (error) {
    logger.error('Failed to check session refresh need', {
      sessionId,
      error: error.message,
    });
    return false;
  }
}

/**
 * Cleanup expired sessions
 */
export async function cleanupExpiredSessions() {
  try {
    const now = new Date();
    const result = await prisma.shopifySession.deleteMany({
      where: {
        expires: { lt: now },
      },
    });

    if (result.count > 0) {
      logger.info('Cleaned up expired Shopify sessions', {
        count: result.count,
      });
    }

    return result.count;
  } catch (error) {
    logger.error('Failed to cleanup expired sessions', {
      error: error.message,
    });
    return 0;
  }
}

/**
 * Session storage adapter for Shopify API
 */
export const sessionStorage = {
  async storeSession(session) {
    await storeSession(session);
  },

  async loadSession(id) {
    return await loadSession(id);
  },

  async deleteSession(id) {
    await deleteSession(id);
  },

  async deleteSessions(ids) {
    await prisma.shopifySession.deleteMany({
      where: { id: { in: ids } },
    });
  },

  async findSessionsByShop(shop) {
    const sessions = await prisma.shopifySession.findMany({
      where: { shop },
    });

    return sessions.map((s) => {
      const sessionData = JSON.parse(s.sessionData);
      return new shopifyApi.session.Session(sessionData);
    });
  },
};

export default {
  storeSession,
  loadSession,
  deleteSession,
  deleteSessionsByShop,
  getSessionByShop,
  needsRefresh,
  cleanupExpiredSessions,
  sessionStorage,
};

