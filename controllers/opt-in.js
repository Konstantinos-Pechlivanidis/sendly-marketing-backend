import { logger } from '../utils/logger.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import prisma from '../services/prisma.js';
import contactsService, { normalizePhone, isValidPhoneE164 } from '../services/contacts.js';

/**
 * Public opt-in endpoint handler
 * Creates or updates a contact with SMS consent
 * @route POST /api/opt-in
 */
export async function handleOptIn(req, res, next) {
  try {
    const { phone, consent, shopDomain, source = 'theme-banner' } = req.body;

    // Validate input
    if (!phone || !consent || !shopDomain) {
      throw new ValidationError('Phone, consent, and shopDomain are required');
    }

    // Validate phone format
    const phoneE164 = normalizePhone(phone);
    if (!isValidPhoneE164(phoneE164)) {
      throw new ValidationError('Invalid phone number format. Use E.164 format (e.g., +306977123456)');
    }

    // Validate shop domain format
    if (!shopDomain.match(/^[a-zA-Z0-9-]+\.myshopify\.com$/)) {
      throw new ValidationError('Invalid shop domain format');
    }

    // Find shop by domain
    const shop = await prisma.shop.findUnique({
      where: { shopDomain },
    });

    if (!shop) {
      logger.warn('Shop not found for opt-in', { shopDomain });
      throw new NotFoundError('Shop not found. Please ensure the app is installed on this store.');
    }

    // Check for existing contact by phone
    let contact = await prisma.contact.findFirst({
      where: {
        shopId: shop.id,
        phoneE164,
      },
    });

    if (contact) {
      // Update existing contact with SMS consent
      contact = await prisma.contact.update({
        where: { id: contact.id },
        data: {
          smsConsent: 'opted_in',
          updatedAt: new Date(),
        },
      });

      logger.info('Contact updated with SMS consent via opt-in', {
        contactId: contact.id,
        shopId: shop.id,
        source,
      });
    } else {
      // Create new contact with SMS consent
      try {
        contact = await contactsService.createContact(shop.id, {
          phoneE164,
          smsConsent: 'opted_in',
          tags: source ? [`opt-in-${source}`] : [],
        });

        logger.info('Contact created via opt-in', {
          contactId: contact.id,
          shopId: shop.id,
          source,
        });
      } catch (error) {
        // If contact creation fails due to duplicate, try to find and update
        if (error.message && error.message.includes('already exists')) {
          contact = await prisma.contact.findFirst({
            where: {
              shopId: shop.id,
              phoneE164,
            },
          });

          if (contact) {
            contact = await prisma.contact.update({
              where: { id: contact.id },
              data: {
                smsConsent: 'opted_in',
                updatedAt: new Date(),
              },
            });
          }
        } else {
          throw error;
        }
      }
    }

    return sendSuccess(
      res,
      {
        contactId: contact.id,
        phone: contact.phoneE164,
        smsConsent: contact.smsConsent,
      },
      'Successfully opted in to SMS marketing',
    );
  } catch (error) {
    // Extract request ID from headers if available
    const requestId = req.headers['x-request-id'] || req.id || 'unknown';

    logger.error('Opt-in error', {
      error: error.message,
      stack: error.stack,
      body: req.body,
      requestId,
      path: req.path,
      method: req.method,
      clientPlatform: req.headers['x-client-platform'],
      clientVersion: req.headers['x-client-version'],
    });

    if (error instanceof ValidationError || error instanceof NotFoundError) {
      return sendError(res, error.message, 400);
    }

    next(error);
  }
}

export default {
  handleOptIn,
};

