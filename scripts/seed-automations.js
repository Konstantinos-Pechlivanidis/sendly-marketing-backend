import prisma from '../services/prisma.js';
import { logger } from '../utils/logger.js';

const automationTemplates = [
  {
    name: 'Welcome New Customer',
    trigger: 'customer_created',
    description: 'Automatically send welcome SMS to new customers',
    message: 'Welcome to our store! Get 10% off your first order with code WELCOME10',
    conditions: {
      customerType: 'new',
      hasPhone: true,
      smsConsent: 'opted_in'
    },
    isActive: true,
    priority: 1
  },
  {
    name: 'Abandoned Cart Reminder',
    trigger: 'cart_abandoned',
    description: 'Remind customers about their abandoned cart',
    message: 'You left items in your cart! Complete your purchase and get free shipping. Shop now: {cart_url}',
    conditions: {
      cartValue: { min: 50 },
      timeSinceAbandon: { hours: 2 },
      smsConsent: 'opted_in'
    },
    isActive: true,
    priority: 2
  },
  {
    name: 'Order Confirmation',
    trigger: 'order_created',
    description: 'Send order confirmation SMS',
    message: 'Thank you for your order #{order_number}! We\'ll send tracking info soon.',
    conditions: {
      hasPhone: true,
      smsConsent: 'opted_in'
    },
    isActive: true,
    priority: 3
  },
  {
    name: 'Birthday Wishes',
    trigger: 'customer_birthday',
    description: 'Send birthday wishes with special offer',
    message: 'Happy Birthday! Enjoy 20% off your next purchase with code BIRTHDAY20',
    conditions: {
      hasPhone: true,
      smsConsent: 'opted_in',
      birthdayMonth: true
    },
    isActive: true,
    priority: 4
  },
  {
    name: 'Low Stock Alert',
    trigger: 'product_low_stock',
    description: 'Notify customers about low stock on wishlist items',
    message: 'Hurry! {product_name} is running low on stock. Order now before it\'s gone!',
    conditions: {
      hasPhone: true,
      smsConsent: 'opted_in',
      hasWishlist: true
    },
    isActive: true,
    priority: 5
  },
  {
    name: 'Order Shipped',
    trigger: 'order_fulfilled',
    description: 'Notify customers when their order ships',
    message: 'Great news! Your order #{order_number} has shipped. Track it here: {tracking_url}',
    conditions: {
      hasPhone: true,
      smsConsent: 'opted_in',
      hasTracking: true
    },
    isActive: true,
    priority: 6
  },
  {
    name: 'Review Request',
    trigger: 'order_delivered',
    description: 'Ask customers to review their purchase',
    message: 'How was your order? We\'d love your feedback! Leave a review: {review_url}',
    conditions: {
      hasPhone: true,
      smsConsent: 'opted_in',
      daysSinceDelivery: { min: 3 }
    },
    isActive: true,
    priority: 7
  },
  {
    name: 'Re-engagement Campaign',
    trigger: 'customer_inactive',
    description: 'Re-engage inactive customers',
    message: 'We miss you! Come back and discover our latest products. Special offer inside!',
    conditions: {
      hasPhone: true,
      smsConsent: 'opted_in',
      daysSinceLastOrder: { min: 30 }
    },
    isActive: true,
    priority: 8
  }
];

async function seedAutomations() {
  try {
    logger.info('Starting automation templates seeding...');

    // Get all shops to create automations for each
    const shops = await prisma.shop.findMany();
    
    if (shops.length === 0) {
      logger.warn('No shops found. Please create a shop first.');
      return;
    }

    let totalCreated = 0;

    for (const shop of shops) {
      logger.info(`Creating automations for shop: ${shop.shopDomain}`);

      for (const template of automationTemplates) {
        try {
          // Check if automation already exists
          const existing = await prisma.automation.findFirst({
            where: {
              shopId: shop.id,
              name: template.name
            }
          });

          if (existing) {
            logger.info(`Automation '${template.name}' already exists for shop ${shop.shopDomain}`);
            continue;
          }

          // Create automation
          await prisma.automation.create({
            data: {
              shopId: shop.id,
              name: template.name,
              trigger: template.trigger,
              description: template.description,
              message: template.message,
              conditions: template.conditions,
              isActive: template.isActive,
              priority: template.priority,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });

          totalCreated++;
          logger.info(`Created automation: ${template.name} for shop ${shop.shopDomain}`);
        } catch (error) {
          logger.error(`Error creating automation '${template.name}' for shop ${shop.shopDomain}:`, error);
        }
      }
    }

    logger.info(`Automation seeding completed. Created ${totalCreated} automations across ${shops.length} shops.`);
    
    return {
      success: true,
      message: `Created ${totalCreated} automations across ${shops.length} shops`,
      totalCreated,
      shopsProcessed: shops.length
    };

  } catch (error) {
    logger.error('Error seeding automations:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedAutomations()
    .then((result) => {
      console.log('Automation seeding result:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Automation seeding failed:', error);
      process.exit(1);
    });
}

export default seedAutomations;
