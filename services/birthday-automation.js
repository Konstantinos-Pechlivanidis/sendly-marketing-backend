import prisma from './prisma.js';
import { sendSms } from './mitto.js';
import { logger } from '../utils/logger.js';
import { withStoreScope } from '../utils/store-scoping.js';

/**
 * Birthday Automation Service
 *
 * Handles birthday automation triggers for all stores
 * Integrates with the enhanced contacts module
 */

/**
 * Get contacts with birthdays today for a specific store
 */
export async function getBirthdayContactsForStore(storeId, targetDate = new Date()) {
  try {
    const month = targetDate.getMonth() + 1; // 1-based month
    const day = targetDate.getDate();

    // Get contacts with birthdays today
    const contactsQuery = withStoreScope(storeId, prisma.contact);
    const birthdayContacts = await contactsQuery.findMany({
      where: {
        birthDate: {
          not: null,
        },
        smsConsent: 'opted_in', // Only SMS-consented contacts
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phoneE164: true,
        birthDate: true,
        gender: true,
      },
    });

    // Filter by actual birthday (month and day)
    const todayBirthdays = birthdayContacts.filter(contact => {
      const contactBirthDate = new Date(contact.birthDate);
      return contactBirthDate.getMonth() + 1 === month &&
             contactBirthDate.getDate() === day;
    });

    logger.info('Birthday contacts found for store', {
      storeId,
      targetDate: targetDate.toISOString(),
      total: birthdayContacts.length,
      todayBirthdays: todayBirthdays.length,
    });

    return todayBirthdays;
  } catch (error) {
    logger.error('Failed to get birthday contacts for store', {
      storeId,
      error: error.message,
    });
    throw error;
  }
}

/**
 * Process birthday automation for a specific store
 */
export async function processBirthdayAutomation(storeId) {
  try {
    // Get store settings and automation
    const store = await prisma.shop.findUnique({
      where: { id: storeId },
      include: {
        settings: true,
        automations: {
          where: {
            automation: {
              triggerEvent: 'birthday',
            },
            isActive: true,
          },
          include: {
            automation: true,
          },
        },
      },
    });

    if (!store) {
      logger.warn('Store not found for birthday automation', { storeId });
      return;
    }

    // Check if birthday automation is active
    const birthdayAutomation = store.automations.find(
      auto => auto.automation.triggerEvent === 'birthday',
    );

    if (!birthdayAutomation) {
      logger.info('Birthday automation not active for store', { storeId });
      return;
    }

    // Get birthday contacts
    const birthdayContacts = await getBirthdayContactsForStore(storeId);

    if (birthdayContacts.length === 0) {
      logger.info('No birthday contacts found for store', { storeId });
      return;
    }

    // Get store sender settings
    const senderNumber = store.settings?.senderNumber || process.env.MITTO_SENDER_NAME;

    // Process each birthday contact
    const results = [];
    for (const contact of birthdayContacts) {
      try {
        // Compose personalized message
        const message = composeBirthdayMessage(
          birthdayAutomation.userMessage || birthdayAutomation.automation.defaultMessage,
          contact,
        );

        // Send SMS
        const smsResult = await sendSms({
          to: contact.phoneE164,
          text: message,
          senderOverride: senderNumber,
          shopId: storeId,
        });

        // Log the message
        await prisma.messageLog.create({
          data: {
            shopId: storeId,
            phoneE164: contact.phoneE164,
            provider: 'mitto',
            direction: 'outbound',
            status: 'sent',
            providerMsgId: smsResult.messageId,
            campaignId: null, // Automation, not campaign
          },
        });

        results.push({
          contactId: contact.id,
          phoneE164: contact.phoneE164,
          messageId: smsResult.messageId,
          status: 'sent',
        });

        logger.info('Birthday SMS sent', {
          storeId,
          contactId: contact.id,
          phoneE164: contact.phoneE164,
          messageId: smsResult.messageId,
        });

      } catch (error) {
        logger.error('Failed to send birthday SMS', {
          storeId,
          contactId: contact.id,
          phoneE164: contact.phoneE164,
          error: error.message,
        });

        results.push({
          contactId: contact.id,
          phoneE164: contact.phoneE164,
          status: 'failed',
          error: error.message,
        });
      }
    }

    logger.info('Birthday automation processed', {
      storeId,
      totalContacts: birthdayContacts.length,
      successful: results.filter(r => r.status === 'sent').length,
      failed: results.filter(r => r.status === 'failed').length,
    });

    return results;
  } catch (error) {
    logger.error('Failed to process birthday automation', {
      storeId,
      error: error.message,
    });
    throw error;
  }
}

/**
 * Compose personalized birthday message
 */
function composeBirthdayMessage(template, contact) {
  let message = template;

  // Replace placeholders
  message = message.replace(/\{\{firstName\}\}/g, contact.firstName || '');
  message = message.replace(/\{\{lastName\}\}/g, contact.lastName || '');
  message = message.replace(/\{\{name\}\}/g, `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'there');
  message = message.replace(/\{\{gender\}\}/g, contact.gender || '');

  // Calculate age if birth date is available
  if (contact.birthDate) {
    const today = new Date();
    const birthDate = new Date(contact.birthDate);
    const age = today.getFullYear() - birthDate.getFullYear();
    message = message.replace(/\{\{age\}\}/g, age.toString());
  }

  return message;
}

/**
 * Process birthday automation for all active stores
 */
export async function processAllBirthdayAutomations(targetDate = new Date()) {
  try {
    logger.info('Starting birthday automation processing', {
      targetDate: targetDate.toISOString(),
    });

    // Get all active stores
    const stores = await prisma.shop.findMany({
      where: { status: 'active' },
      select: { id: true, shopDomain: true },
    });

    const results = [];
    for (const store of stores) {
      try {
        const storeResults = await processBirthdayAutomation(store.id);
        results.push({
          storeId: store.id,
          shopDomain: store.shopDomain,
          results: storeResults,
        });
      } catch (error) {
        logger.error('Failed to process birthday automation for store', {
          storeId: store.id,
          shopDomain: store.shopDomain,
          error: error.message,
        });

        results.push({
          storeId: store.id,
          shopDomain: store.shopDomain,
          error: error.message,
        });
      }
    }

    logger.info('Birthday automation processing completed', {
      totalStores: stores.length,
      successful: results.filter(r => !r.error).length,
      failed: results.filter(r => r.error).length,
    });

    return results;
  } catch (error) {
    logger.error('Failed to process birthday automations', {
      error: error.message,
    });
    throw error;
  }
}

/**
 * Get birthday automation statistics for a store
 */
export async function getBirthdayAutomationStats(storeId, startDate, endDate) {
  try {
    const contactsQuery = withStoreScope(storeId, prisma.contact);
    const messagesQuery = withStoreScope(storeId, prisma.messageLog);

    // Get birthday contacts count
    const birthdayContacts = await contactsQuery.count({
      where: {
        birthDate: { not: null },
        smsConsent: 'opted_in',
      },
    });

    // Get birthday messages sent in date range
    const birthdayMessages = await messagesQuery.count({
      where: {
        direction: 'outbound',
        status: 'sent',
        campaignId: null, // Automation messages
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Get upcoming birthdays (next 30 days)
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const upcomingBirthdays = await contactsQuery.findMany({
      where: {
        birthDate: { not: null },
        smsConsent: 'opted_in',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        birthDate: true,
      },
    });

    // Filter upcoming birthdays
    const upcoming = upcomingBirthdays.filter(contact => {
      const birthDate = new Date(contact.birthDate);
      const thisYear = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
      const nextYear = new Date(today.getFullYear() + 1, birthDate.getMonth(), birthDate.getDate());

      return (thisYear >= today && thisYear <= nextMonth) ||
             (nextYear >= today && nextYear <= nextMonth);
    });

    return {
      totalBirthdayContacts: birthdayContacts,
      messagesSent: birthdayMessages,
      upcomingBirthdays: upcoming.length,
      upcoming: upcoming.slice(0, 10), // Next 10 upcoming birthdays
    };
  } catch (error) {
    logger.error('Failed to get birthday automation stats', {
      storeId,
      error: error.message,
    });
    throw error;
  }
}

export default {
  getBirthdayContactsForStore,
  processBirthdayAutomation,
  processAllBirthdayAutomations,
  getBirthdayAutomationStats,
};
