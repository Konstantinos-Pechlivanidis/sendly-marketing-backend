import prisma from './prisma.js';
import { sendSms } from './mitto.js';
import { logger } from '../utils/logger.js';

/**
 * Trigger an automation for a specific contact
 */
export async function triggerAutomation({
  shopId,
  contactId,
  triggerEvent,
  additionalData = {},
}) {
  try {
    // Find the user automation for this trigger
    const userAutomation = await prisma.userAutomation.findFirst({
      where: {
        shopId,
        automation: {
          triggerEvent,
          isSystemDefault: true,
        },
        isActive: true,
      },
      include: {
        automation: true,
        shop: {
          include: {
            settings: true,
          },
        },
      },
    });

    if (!userAutomation) {
      logger.warn('No active automation found for trigger', {
        shopId,
        triggerEvent,
      });
      return { success: false, reason: 'No active automation found' };
    }

    // Get contact information
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
    });

    if (!contact) {
      logger.warn('Contact not found for automation trigger', {
        contactId,
        shopId,
        triggerEvent,
      });
      return { success: false, reason: 'Contact not found' };
    }

    // Check if contact has SMS consent
    if (contact.smsConsent !== 'opted_in') {
      logger.warn('Contact does not have SMS consent', {
        contactId,
        shopId,
        triggerEvent,
        smsConsent: contact.smsConsent,
      });
      return { success: false, reason: 'No SMS consent' };
    }

    // Prepare message content
    const messageContent = userAutomation.userMessage || userAutomation.automation.defaultMessage;

    // Replace template variables
    const processedMessage = processMessageTemplate(messageContent, {
      contact,
      shop: userAutomation.shop,
      ...additionalData,
    });

    // Get sender information
    const senderNumber = userAutomation.shop.settings?.senderNumber ||
                         userAutomation.shop.settings?.senderName ||
                         process.env.MITTO_SENDER_NAME || 'Sendly';

    // Send SMS
    const smsResult = await sendSms({
      to: contact.phoneE164,
      text: processedMessage,
      senderOverride: senderNumber,
      shopId,
    });

    if (smsResult.success) {
      // Log the automation trigger
      await prisma.messageLog.create({
        data: {
          shopId,
          phoneE164: contact.phoneE164,
          direction: 'outbound',
          provider: 'mitto',
          providerMsgId: smsResult.messageId,
          status: 'sent',
          campaignId: null, // Automation, not campaign
        },
      });

      logger.info('Automation triggered successfully', {
        shopId,
        contactId,
        triggerEvent,
        messageId: smsResult.messageId,
        automationId: userAutomation.automationId,
      });

      return {
        success: true,
        messageId: smsResult.messageId,
        automationId: userAutomation.automationId,
      };
    } else {
      logger.error('Failed to send automation SMS', {
        shopId,
        contactId,
        triggerEvent,
        error: smsResult.error,
      });

      return {
        success: false,
        reason: 'SMS sending failed',
        error: smsResult.error,
      };
    }
  } catch (error) {
    logger.error('Automation trigger failed', {
      error: error.message,
      shopId,
      contactId,
      triggerEvent,
    });

    return {
      success: false,
      reason: 'Internal error',
      error: error.message,
    };
  }
}

/**
 * Process message template with variables
 */
function processMessageTemplate(template, data) {
  let processedMessage = template;

  // Replace contact variables
  if (data.contact) {
    processedMessage = processedMessage.replace(/\{\{firstName\}\}/g, data.contact.firstName || '');
    processedMessage = processedMessage.replace(/\{\{lastName\}\}/g, data.contact.lastName || '');
    processedMessage = processedMessage.replace(/\{\{phone\}\}/g, data.contact.phoneE164 || '');
  }

  // Replace shop variables
  if (data.shop) {
    processedMessage = processedMessage.replace(/\{\{shopName\}\}/g, data.shop.shopDomain || '');
    processedMessage = processedMessage.replace(/\{\{shopDomain\}\}/g, data.shop.shopDomain || '');
  }

  // Replace additional data variables
  if (data.orderNumber) {
    processedMessage = processedMessage.replace(/\{\{orderNumber\}\}/g, data.orderNumber);
  }
  if (data.trackingLink) {
    processedMessage = processedMessage.replace(/\{\{trackingLink\}\}/g, data.trackingLink);
  }
  if (data.productName) {
    processedMessage = processedMessage.replace(/\{\{productName\}\}/g, data.productName);
  }
  if (data.discountCode) {
    processedMessage = processedMessage.replace(/\{\{discountCode\}\}/g, data.discountCode);
  }

  return processedMessage;
}

/**
 * Trigger abandoned cart automation
 */
export async function triggerAbandonedCart({ shopId, contactId, cartData = {} }) {
  return await triggerAutomation({
    shopId,
    contactId,
    triggerEvent: 'cart_abandoned',
    additionalData: cartData,
  });
}

/**
 * Trigger order confirmation automation
 */
export async function triggerOrderConfirmation({ shopId, contactId, orderData = {} }) {
  return await triggerAutomation({
    shopId,
    contactId,
    triggerEvent: 'order_placed',
    additionalData: orderData,
  });
}

/**
 * Trigger customer re-engagement automation
 */
export async function triggerCustomerReengagement({ shopId, contactId, reengagementData = {} }) {
  return await triggerAutomation({
    shopId,
    contactId,
    triggerEvent: 'customer_inactive',
    additionalData: reengagementData,
  });
}

/**
 * Trigger birthday automation
 */
export async function triggerBirthdayOffer({ shopId, contactId, birthdayData = {} }) {
  return await triggerAutomation({
    shopId,
    contactId,
    triggerEvent: 'birthday',
    additionalData: birthdayData,
  });
}

/**
 * Get all active automations for a shop
 */
export async function getActiveAutomations(shopId) {
  return await prisma.userAutomation.findMany({
    where: {
      shopId,
      isActive: true,
    },
    include: {
      automation: true,
    },
  });
}

/**
 * Check if a shop has a specific automation active
 */
export async function hasActiveAutomation(shopId, triggerEvent) {
  const automation = await prisma.userAutomation.findFirst({
    where: {
      shopId,
      isActive: true,
      automation: {
        triggerEvent,
        isSystemDefault: true,
      },
    },
  });

  return !!automation;
}

export default {
  triggerAutomation,
  triggerAbandonedCart,
  triggerOrderConfirmation,
  triggerCustomerReengagement,
  triggerBirthdayOffer,
  getActiveAutomations,
  hasActiveAutomation,
  processMessageTemplate,
};
