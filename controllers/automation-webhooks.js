import { logger } from '../utils/logger.js';
import {
  triggerAbandonedCart,
  triggerOrderConfirmation,
} from '../services/automations.js';
import prisma from '../services/prisma.js';

/**
 * Handle Shopify order creation webhook
 */
export async function handleOrderCreated(req, res) {
  try {
    const { shop_domain, id, customer, line_items } = req.body;

    if (!shop_domain || !id || !customer) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'shop_domain, id, and customer are required',
      });
    }

    // Find the shop
    const shop = await prisma.shop.findUnique({
      where: { shopDomain: shop_domain },
    });

    if (!shop) {
      logger.warn('Shop not found for order webhook', { shop_domain });
      return res.status(404).json({
        success: false,
        error: 'Shop not found',
        message: 'Shop domain not found in our system',
      });
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
      return res.status(404).json({
        success: false,
        error: 'Contact not found',
        message: 'Customer not found in our contact database',
      });
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

    res.json({
      success: true,
      message: 'Order webhook processed',
      automationTriggered: result.success,
    });
  } catch (error) {
    logger.error('Order webhook processing failed', {
      error: error.message,
      body: req.body,
    });

    res.status(500).json({
      success: false,
      error: 'Webhook processing failed',
      message: error.message,
    });
  }
}

/**
 * Handle abandoned cart webhook (if available from Shopify)
 */
export async function handleCartAbandoned(req, res) {
  try {
    const { shop_domain, customer, cart_token, line_items } = req.body;

    if (!shop_domain || !customer) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'shop_domain and customer are required',
      });
    }

    // Find the shop
    const shop = await prisma.shop.findUnique({
      where: { shopDomain: shop_domain },
    });

    if (!shop) {
      logger.warn('Shop not found for cart webhook', { shop_domain });
      return res.status(404).json({
        success: false,
        error: 'Shop not found',
        message: 'Shop domain not found in our system',
      });
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
      return res.status(404).json({
        success: false,
        error: 'Contact not found',
        message: 'Customer not found in our contact database',
      });
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

    res.json({
      success: true,
      message: 'Cart webhook processed',
      automationTriggered: result.success,
    });
  } catch (error) {
    logger.error('Cart webhook processing failed', {
      error: error.message,
      body: req.body,
    });

    res.status(500).json({
      success: false,
      error: 'Webhook processing failed',
      message: error.message,
    });
  }
}

/**
 * Manual trigger for testing automations
 */
export async function triggerAutomationManually(req, res) {
  try {
    const { shopId, contactId, triggerEvent, additionalData = {} } = req.body;

    if (!shopId || !contactId || !triggerEvent) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'shopId, contactId, and triggerEvent are required',
      });
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

      res.json({
        success: true,
        data: result,
        message: 'Automation triggered successfully',
      });
    } else {
      logger.warn('Manual automation trigger failed', {
        shopId,
        contactId,
        triggerEvent,
        reason: result.reason,
      });

      res.status(400).json({
        success: false,
        error: 'Automation trigger failed',
        message: result.reason,
        data: result,
      });
    }
  } catch (error) {
    logger.error('Manual automation trigger failed', {
      error: error.message,
      body: req.body,
    });

    res.status(500).json({
      success: false,
      error: 'Manual trigger failed',
      message: error.message,
    });
  }
}

export default {
  handleOrderCreated,
  handleCartAbandoned,
  triggerAutomationManually,
};
