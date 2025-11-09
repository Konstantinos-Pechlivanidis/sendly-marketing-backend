import { logger } from '../utils/logger.js';
import {
  triggerAbandonedCart,
  triggerOrderConfirmation,
} from '../services/automations.js';
import prisma from '../services/prisma.js';
import { sendSuccess } from '../utils/response.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

/**
 * Handle Shopify order creation webhook
 */
export async function handleOrderCreated(req, res, _next) {
  try {
    const { shop_domain, id, customer, line_items } = req.body;

    if (!shop_domain || !id || !customer) {
      throw new ValidationError('shop_domain, id, and customer are required');
    }

    // Find the shop
    const shop = await prisma.shop.findUnique({
      where: { shopDomain: shop_domain },
    });

    if (!shop) {
      logger.warn('Shop not found for order webhook', { shop_domain });
      throw new NotFoundError('Shop');
    }

    // Find the customer contact
    const contact = await prisma.contact.findFirst({
      where: {
        shopId: shop.id,
        email: customer.email,
      },
    });

    if (!contact) {
      logger.warn('Contact not found for order webhook', {
        shopId: shop.id,
        customerEmail: customer.email,
      });
      throw new NotFoundError('Contact');
    }

    // Trigger order confirmation automation
    const result = await triggerOrderConfirmation({
      shopId: shop.id,
      contactId: contact.id,
      orderData: {
        orderNumber: id.toString(),
        customerEmail: customer.email,
        customerName: `${customer.first_name || ''} ${customer.last_name || ''}`.trim(),
        lineItems: line_items,
        totalPrice: req.body.total_price,
        currency: req.body.currency,
      },
    });

    if (result.success) {
      logger.info('Order confirmation automation triggered', {
        shopId: shop.id,
        contactId: contact.id,
        orderId: id,
        messageId: result.messageId,
      });
    } else {
      logger.warn('Order confirmation automation failed', {
        shopId: shop.id,
        contactId: contact.id,
        orderId: id,
        reason: result.reason,
      });
    }

    return sendSuccess(res, { automationTriggered: result.success }, 'Order webhook processed');
  } catch (error) {
    logger.error('Order webhook processing failed', {
      error: error.message,
      body: req.body,
    });
    throw error;
  }
}

/**
 * Handle abandoned cart webhook (if available from Shopify)
 */
export async function handleCartAbandoned(req, res, _next) {
  try {
    const { shop_domain, customer, cart_token, line_items } = req.body;

    if (!shop_domain || !customer) {
      throw new ValidationError('shop_domain and customer are required');
    }

    // Find the shop
    const shop = await prisma.shop.findUnique({
      where: { shopDomain: shop_domain },
    });

    if (!shop) {
      logger.warn('Shop not found for cart webhook', { shop_domain });
      throw new NotFoundError('Shop');
    }

    // Find the customer contact
    const contact = await prisma.contact.findFirst({
      where: {
        shopId: shop.id,
        email: customer.email,
      },
    });

    if (!contact) {
      logger.warn('Contact not found for cart webhook', {
        shopId: shop.id,
        customerEmail: customer.email,
      });
      throw new NotFoundError('Contact');
    }

    // Trigger abandoned cart automation
    const result = await triggerAbandonedCart({
      shopId: shop.id,
      contactId: contact.id,
      cartData: {
        cartToken: cart_token,
        customerEmail: customer.email,
        customerName: `${customer.first_name || ''} ${customer.last_name || ''}`.trim(),
        lineItems: line_items,
        abandonedAt: new Date().toISOString(),
      },
    });

    if (result.success) {
      logger.info('Abandoned cart automation triggered', {
        shopId: shop.id,
        contactId: contact.id,
        cartToken: cart_token,
        messageId: result.messageId,
      });
    } else {
      logger.warn('Abandoned cart automation failed', {
        shopId: shop.id,
        contactId: contact.id,
        cartToken: cart_token,
        reason: result.reason,
      });
    }

    return sendSuccess(res, { automationTriggered: result.success }, 'Cart webhook processed');
  } catch (error) {
    logger.error('Cart webhook processing failed', {
      error: error.message,
      body: req.body,
    });
    throw error;
  }
}

/**
 * Manual trigger for testing automations
 */
export async function triggerAutomationManually(req, res, _next) {
  try {
    const { shopId, contactId, triggerEvent, additionalData = {} } = req.body;

    if (!shopId || !contactId || !triggerEvent) {
      throw new ValidationError('shopId, contactId, and triggerEvent are required');
    }

    // Import the automation service
    const { triggerAutomation } = await import('../services/automations.js');

    const result = await triggerAutomation({
      shopId,
      contactId,
      triggerEvent,
      additionalData,
    });

    if (result.success) {
      logger.info('Manual automation trigger successful', {
        shopId,
        contactId,
        triggerEvent,
        messageId: result.messageId,
      });

      return sendSuccess(res, result, 'Automation triggered successfully');
    } else {
      logger.warn('Manual automation trigger failed', {
        shopId,
        contactId,
        triggerEvent,
        reason: result.reason,
      });

      throw new ValidationError(result.reason || 'Automation trigger failed');
    }
  } catch (error) {
    logger.error('Manual automation trigger failed', {
      error: error.message,
      body: req.body,
    });
    throw error;
  }
}

export default {
  handleOrderCreated,
  handleCartAbandoned,
  triggerAutomationManually,
};
