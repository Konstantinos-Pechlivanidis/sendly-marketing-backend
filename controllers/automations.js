import prisma from '../services/prisma.js';
import { logger } from '../utils/logger.js';
import { getStoreId } from '../middlewares/store-resolution.js';
import { sendSuccess } from '../utils/response.js';
import { NotFoundError } from '../utils/errors.js';

/**
 * Get all automations for the current user
 */
export async function getUserAutomations(req, res, _next) {
  try {
    // ✅ Security: Get storeId from context
    const shopId = getStoreId(req);

    const userAutomations = await prisma.userAutomation.findMany({
      where: { shopId },
      include: {
        automation: {
          select: {
            id: true,
            title: true,
            description: true,
            triggerEvent: true,
            defaultMessage: true,
            isSystemDefault: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Transform the data for easier frontend consumption
    const automations = userAutomations.map(userAutomation => ({
      id: userAutomation.id,
      automationId: userAutomation.automationId,
      title: userAutomation.automation.title,
      description: userAutomation.automation.description,
      triggerEvent: userAutomation.automation.triggerEvent,
      defaultMessage: userAutomation.automation.defaultMessage,
      userMessage: userAutomation.userMessage,
      isActive: userAutomation.isActive,
      isSystemDefault: userAutomation.automation.isSystemDefault,
      createdAt: userAutomation.createdAt,
      updatedAt: userAutomation.updatedAt,
    }));

    return sendSuccess(res, automations);
  } catch (error) {
    logger.error('Failed to fetch user automations', {
      error: error.message,
      shopId: req.ctx?.store?.id,
    });
    throw error;
  }
}

/**
 * Update user automation (message content or active status)
 */
export async function updateUserAutomation(req, res, _next) {
  try {
    const { id } = req.params;
    const { userMessage, isActive } = req.body;

    // ✅ Security: Get storeId from context
    const shopId = getStoreId(req);

    // Check if the user automation exists and belongs to the shop
    const existingUserAutomation = await prisma.userAutomation.findFirst({
      where: {
        id,
        shopId,
      },
      include: {
        automation: true,
      },
    });

    if (!existingUserAutomation) {
      throw new NotFoundError('Automation');
    }

    // Update the user automation
    const updatedUserAutomation = await prisma.userAutomation.update({
      where: { id },
      data: {
        ...(userMessage !== undefined && { userMessage }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        automation: {
          select: {
            id: true,
            title: true,
            description: true,
            triggerEvent: true,
            defaultMessage: true,
            isSystemDefault: true,
          },
        },
      },
    });

    logger.info('User automation updated', {
      userAutomationId: id,
      shopId,
      changes: { userMessage, isActive },
    });

    return sendSuccess(res, {
      id: updatedUserAutomation.id,
      automationId: updatedUserAutomation.automationId,
      title: updatedUserAutomation.automation.title,
      description: updatedUserAutomation.automation.description,
      triggerEvent: updatedUserAutomation.automation.triggerEvent,
      defaultMessage: updatedUserAutomation.automation.defaultMessage,
      userMessage: updatedUserAutomation.userMessage,
      isActive: updatedUserAutomation.isActive,
      isSystemDefault: updatedUserAutomation.automation.isSystemDefault,
      createdAt: updatedUserAutomation.createdAt,
      updatedAt: updatedUserAutomation.updatedAt,
    }, 'Automation updated successfully');
  } catch (error) {
    logger.error('Failed to update user automation', {
      error: error.message,
      userAutomationId: req.params.id,
      shopId: req.ctx?.store?.id,
    });
    throw error;
  }
}

/**
 * Get system default automations (admin only)
 */
export async function getSystemDefaults(req, res, _next) {
  try {
    const systemAutomations = await prisma.automation.findMany({
      where: { isSystemDefault: true },
      select: {
        id: true,
        title: true,
        description: true,
        triggerEvent: true,
        defaultMessage: true,
        isSystemDefault: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return sendSuccess(res, systemAutomations);
  } catch (error) {
    logger.error('Failed to fetch system default automations', {
      error: error.message,
    });
    throw error;
  }
}

/**
 * Sync new system defaults to all users (admin only)
 */
export async function syncSystemDefaults(req, res, _next) {
  try {
    // Get all shops
    const shops = await prisma.shop.findMany({
      select: { id: true, shopDomain: true },
    });

    // Get all system default automations
    const systemAutomations = await prisma.automation.findMany({
      where: { isSystemDefault: true },
    });

    let syncedCount = 0;

    // For each shop, ensure they have all system automations
    for (const shop of shops) {
      for (const systemAutomation of systemAutomations) {
        // Check if user automation already exists
        const existingUserAutomation = await prisma.userAutomation.findUnique({
          where: {
            shopId_automationId: {
              shopId: shop.id,
              automationId: systemAutomation.id,
            },
          },
        });

        // Create user automation if it doesn't exist
        if (!existingUserAutomation) {
          await prisma.userAutomation.create({
            data: {
              shopId: shop.id,
              automationId: systemAutomation.id,
              isActive: true, // Default to active
            },
          });
          syncedCount++;
        }
      }
    }

    logger.info('System defaults synced to all users', {
      syncedCount,
      totalShops: shops.length,
      totalAutomations: systemAutomations.length,
    });

    return sendSuccess(res, {
      syncedCount,
      totalShops: shops.length,
      totalAutomations: systemAutomations.length,
    }, `Successfully synced ${syncedCount} new automations to all users`);
  } catch (error) {
    logger.error('Failed to sync system defaults', {
      error: error.message,
    });
    throw error;
  }
}

/**
 * Get automation statistics for a user
 */
export async function getAutomationStats(req, res, _next) {
  try {
    // ✅ Security: Get storeId from context
    const shopId = getStoreId(req);

    const stats = await prisma.userAutomation.aggregate({
      where: { shopId },
      _count: {
        id: true,
      },
      _sum: {
        isActive: true,
      },
    });

    const activeCount = await prisma.userAutomation.count({
      where: {
        shopId,
        isActive: true,
      },
    });

    return sendSuccess(res, {
      totalAutomations: stats._count.id,
      activeAutomations: activeCount,
      inactiveAutomations: stats._count.id - activeCount,
    });
  } catch (error) {
    logger.error('Failed to fetch automation statistics', {
      error: error.message,
      shopId: req.ctx?.store?.id,
    });
    throw error;
  }
}

export default {
  getUserAutomations,
  updateUserAutomation,
  getSystemDefaults,
  syncSystemDefaults,
  getAutomationStats,
};
