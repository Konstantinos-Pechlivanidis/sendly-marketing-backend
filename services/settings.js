import prisma from './prisma.js';
import { logger } from '../utils/logger.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

/**
 * Settings Service
 * Handles shop settings and configuration management
 */

/**
 * Get shop settings with recent transactions
 * @param {string} storeId - Store ID
 * @returns {Promise<Object>} Settings data
 */
export async function getSettings(storeId) {
  logger.info('Getting settings', { storeId });

  const shop = await prisma.shop.findUnique({
    where: { id: storeId },
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
    throw new NotFoundError('Shop');
  }

  logger.info('Settings retrieved successfully', { storeId });

  return {
    shop: {
      id: shop.id,
      shopDomain: shop.shopDomain,
      credits: shop.credits,
      createdAt: shop.createdAt,
      updatedAt: shop.updatedAt,
    },
    settings: shop.settings,
    recentTransactions: shop.billingTransactions,
  };
}

/**
 * Update shop settings
 * @param {string} storeId - Store ID
 * @param {Object} settingsData - Settings data to update
 * @returns {Promise<Object>} Updated settings
 */
export async function updateSettings(storeId, settingsData) {
  logger.info('Updating settings', { storeId, fields: Object.keys(settingsData) });

  // Verify shop exists
  const shop = await prisma.shop.findUnique({
    where: { id: storeId },
    select: { id: true },
  });

  if (!shop) {
    throw new NotFoundError('Shop');
  }

  // Validate sender number if provided
  if (settingsData.senderNumber !== undefined) {
    if (settingsData.senderNumber && settingsData.senderNumber.length > 11) {
      throw new ValidationError('Sender number must be 11 characters or less');
    }
  }

  // Validate sender name if provided
  if (settingsData.senderName !== undefined) {
    if (settingsData.senderName && settingsData.senderName.length > 11) {
      throw new ValidationError('Sender name must be 11 characters or less');
    }
  }

  // Check if settings exist
  const existingSettings = await prisma.shopSettings.findUnique({
    where: { shopId: storeId },
  });

  let settings;

  if (existingSettings) {
    // Update existing settings
    settings = await prisma.shopSettings.update({
      where: { shopId: storeId },
      data: {
        senderNumber: settingsData.senderNumber,
        senderName: settingsData.senderName,
        timezone: settingsData.timezone,
        defaultLanguage: settingsData.defaultLanguage,
        emailNotifications: settingsData.emailNotifications,
        smsNotifications: settingsData.smsNotifications,
        webhookUrl: settingsData.webhookUrl,
      },
    });
  } else {
    // Create new settings
    settings = await prisma.shopSettings.create({
      data: {
        shopId: storeId,
        senderNumber: settingsData.senderNumber,
        senderName: settingsData.senderName,
        timezone: settingsData.timezone || 'UTC',
        defaultLanguage: settingsData.defaultLanguage || 'en',
        emailNotifications: settingsData.emailNotifications ?? true,
        smsNotifications: settingsData.smsNotifications ?? false,
        webhookUrl: settingsData.webhookUrl,
      },
    });
  }

  logger.info('Settings updated successfully', { storeId });

  return settings;
}

/**
 * Get usage guide content
 * @returns {Object} Usage guide
 */
export function getUsageGuide() {
  return {
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
        title: 'Contacts Management',
        content: 'Import contacts from CSV or add them manually. Contacts with SMS consent can receive your campaigns.',
      },
      {
        title: 'Campaigns',
        content: 'Create targeted SMS campaigns for different audience segments. Schedule campaigns or send them immediately.',
      },
      {
        title: 'Automations',
        content: 'Set up automated SMS messages for birthdays, abandoned carts, and other triggers.',
      },
      {
        title: 'Reports',
        content: 'Track your SMS performance with detailed reports on delivery rates, engagement, and ROI.',
      },
      {
        title: 'Support',
        content: 'Need help? Visit our support center or contact us at support@sendly.com',
      },
    ],
  };
}

/**
 * Get sender configuration for store
 * @param {string} storeId - Store ID
 * @returns {Promise<Object>} Sender configuration
 */
export async function getSenderConfig(storeId) {
  logger.info('Getting sender config', { storeId });

  const settings = await prisma.shopSettings.findUnique({
    where: { shopId: storeId },
    select: {
      senderNumber: true,
      senderName: true,
    },
  });

  // Default sender if not configured
  const senderConfig = {
    senderNumber: settings?.senderNumber || process.env.MITTO_SENDER_NUMBER || null,
    senderName: settings?.senderName || process.env.MITTO_SENDER_NAME || 'Sendly',
  };

  logger.info('Sender config retrieved', { storeId, hasSenderNumber: !!senderConfig.senderNumber });

  return senderConfig;
}

/**
 * Validate sender configuration
 * @param {string} storeId - Store ID
 * @returns {Promise<Object>} Validation result
 */
export async function validateSenderConfig(storeId) {
  logger.info('Validating sender config', { storeId });

  const config = await getSenderConfig(storeId);

  const validation = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  if (!config.senderNumber && !config.senderName) {
    validation.isValid = false;
    validation.errors.push('No sender number or name configured');
  }

  if (config.senderNumber && config.senderNumber.length > 11) {
    validation.isValid = false;
    validation.errors.push('Sender number must be 11 characters or less');
  }

  if (config.senderName && config.senderName.length > 11) {
    validation.isValid = false;
    validation.errors.push('Sender name must be 11 characters or less');
  }

  if (!config.senderNumber) {
    validation.warnings.push('No sender number configured. Using default sender name.');
  }

  logger.info('Sender config validated', { storeId, isValid: validation.isValid });

  return validation;
}

export default {
  getSettings,
  updateSettings,
  getUsageGuide,
  getSenderConfig,
  validateSenderConfig,
};

