import prisma from '../services/prisma.js';
import { logger } from '../utils/logger.js';

/**
 * Get current user settings
 */
export async function getSettings(req, res) {
  try {
    const { shopId } = req.shop || {};

    if (!shopId) {
      return res.status(400).json({
        success: false,
        error: 'Shop ID required',
        message: 'Shop context is required to fetch settings',
      });
    }

    // Get shop with settings and recent transactions
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      include: {
        settings: true,
        billingTransactions: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            creditsAdded: true,
            amount: true,
            currency: true,
            packageType: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!shop) {
      return res.status(404).json({
        success: false,
        error: 'Shop not found',
        message: 'Shop not found in our system',
      });
    }

    // Usage guide content
    const usageGuide = {
      title: 'How Sendly Works',
      sections: [
        {
          title: 'SMS Credits',
          content: 'Each SMS message costs 1 credit. Credits are deducted automatically when messages are sent successfully.',
        },
        {
          title: 'Purchasing Credits',
          content: 'You can purchase credit packages through our secure Stripe checkout. Credits are added to your account immediately after payment.',
        },
        {
          title: 'Sender Number',
          content: 'Set your sender number or name to personalize your SMS messages. This will be used for all campaigns and automations.',
        },
        {
          title: 'Support',
          content: 'Need help? Visit our support center or contact us at support@sendly.com',
        },
      ],
    };

    res.json({
      success: true,
      data: {
        shop: {
          id: shop.id,
          shopDomain: shop.shopDomain,
          credits: shop.credits,
          createdAt: shop.createdAt,
          updatedAt: shop.updatedAt,
        },
        settings: shop.settings,
        recentTransactions: shop.billingTransactions,
        usageGuide,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch settings', {
      error: error.message,
      shopId: req.shop?.id,
    });

    res.status(500).json({
      success: false,
      error: 'Failed to fetch settings',
      message: error.message,
    });
  }
}

/**
 * Update sender number
 */
export async function updateSenderNumber(req, res) {
  try {
    const { senderNumber } = req.body;
    const { shopId } = req.shop || {};

    if (!shopId) {
      return res.status(400).json({
        success: false,
        error: 'Shop ID required',
        message: 'Shop context is required to update settings',
      });
    }

    // Validate sender number format
    if (!senderNumber || typeof senderNumber !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid sender number',
        message: 'Sender number is required and must be a string',
      });
    }

    // Validate format: E.164 for phone numbers or 3-11 alphanumeric for names
    const isE164 = /^\+[1-9]\d{1,14}$/.test(senderNumber);
    const isAlphanumeric = /^[a-zA-Z0-9]{3,11}$/.test(senderNumber);

    if (!isE164 && !isAlphanumeric) {
      return res.status(400).json({
        success: false,
        error: 'Invalid sender number format',
        message: 'Sender number must be either a valid E.164 phone number (e.g., +1234567890) or 3-11 alphanumeric characters',
      });
    }

    // Update or create shop settings
    const settings = await prisma.shopSettings.upsert({
      where: { shopId },
      update: { senderNumber },
      create: {
        shopId,
        senderNumber,
        timezone: 'UTC',
        currency: 'EUR',
      },
    });

    logger.info('Sender number updated', {
      shopId,
      senderNumber,
    });

    res.json({
      success: true,
      data: {
        senderNumber: settings.senderNumber,
        updatedAt: settings.updatedAt,
      },
      message: 'Sender number updated successfully',
    });
  } catch (error) {
    logger.error('Failed to update sender number', {
      error: error.message,
      shopId: req.shop?.id,
      senderNumber: req.body.senderNumber,
    });

    res.status(500).json({
      success: false,
      error: 'Failed to update sender number',
      message: error.message,
    });
  }
}

/**
 * Get account information
 */
export async function getAccountInfo(req, res) {
  try {
    const { shopId } = req.shop || {};

    if (!shopId) {
      return res.status(400).json({
        success: false,
        error: 'Shop ID required',
        message: 'Shop context is required to fetch account information',
      });
    }

    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      include: {
        settings: true,
        _count: {
          select: {
            contacts: true,
            campaigns: true,
            automations: true,
            messages: true,
          },
        },
      },
    });

    if (!shop) {
      return res.status(404).json({
        success: false,
        error: 'Shop not found',
        message: 'Shop not found in our system',
      });
    }

    // Calculate usage statistics
    const totalMessages = await prisma.messageLog.count({
      where: {
        shopId,
        direction: 'outbound',
        status: 'sent',
      },
    });

    const totalSpent = await prisma.billingTransaction.aggregate({
      where: {
        shopId,
        status: 'completed',
      },
      _sum: {
        amount: true,
      },
    });

    res.json({
      success: true,
      data: {
        account: {
          shopDomain: shop.shopDomain,
          credits: shop.credits,
          createdAt: shop.createdAt,
          senderNumber: shop.settings?.senderNumber,
          senderName: shop.settings?.senderName,
        },
        usage: {
          totalContacts: shop._count.contacts,
          totalCampaigns: shop._count.campaigns,
          totalAutomations: shop._count.automations,
          totalMessages,
          totalSpent: totalSpent._sum.amount || 0,
        },
      },
    });
  } catch (error) {
    logger.error('Failed to fetch account information', {
      error: error.message,
      shopId: req.shop?.id,
    });

    res.status(500).json({
      success: false,
      error: 'Failed to fetch account information',
      message: error.message,
    });
  }
}

export default {
  getSettings,
  updateSenderNumber,
  getAccountInfo,
};
