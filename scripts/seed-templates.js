import prisma from '../server/services/prisma.js';
import { logger } from '../server/utils/logger.js';

const smsTemplates = [
  {
    name: 'Welcome Message',
    category: 'welcome',
    trigger: 'customer_signup',
    message: 'Welcome to {store_name}! Get {discount}% off your first order with code {coupon_code}',
    variables: ['store_name', 'discount', 'coupon_code'],
    isActive: true,
    usageCount: 0,
    successRate: 0.85
  },
  {
    name: 'Order Confirmation',
    category: 'order',
    trigger: 'order_created',
    message: 'Thank you for your order #{order_number}! Total: {order_total}. We\'ll send tracking info soon.',
    variables: ['order_number', 'order_total'],
    isActive: true,
    usageCount: 0,
    successRate: 0.92
  },
  {
    name: 'Abandoned Cart Reminder',
    category: 'cart',
    trigger: 'cart_abandoned',
    message: 'You left {item_count} items in your cart worth {cart_total}! Complete your purchase: {cart_url}',
    variables: ['item_count', 'cart_total', 'cart_url'],
    isActive: true,
    usageCount: 0,
    successRate: 0.78
  },
  {
    name: 'Birthday Wishes',
    category: 'celebration',
    trigger: 'customer_birthday',
    message: 'Happy Birthday {customer_name}! Enjoy {discount}% off with code BIRTHDAY{discount}',
    variables: ['customer_name', 'discount'],
    isActive: true,
    usageCount: 0,
    successRate: 0.88
  },
  {
    name: 'Shipping Notification',
    category: 'shipping',
    trigger: 'order_fulfilled',
    message: 'Your order #{order_number} has shipped! Track it: {tracking_url}. Expected delivery: {delivery_date}',
    variables: ['order_number', 'tracking_url', 'delivery_date'],
    isActive: true,
    usageCount: 0,
    successRate: 0.94
  },
  {
    name: 'Review Request',
    category: 'feedback',
    trigger: 'order_delivered',
    message: 'How was your order? We\'d love your feedback! Leave a review: {review_url}',
    variables: ['review_url'],
    isActive: true,
    usageCount: 0,
    successRate: 0.65
  },
  {
    name: 'Flash Sale Alert',
    category: 'promotion',
    trigger: 'flash_sale',
    message: 'FLASH SALE! {product_name} is {discount}% off for the next {time_left}! Shop now: {product_url}',
    variables: ['product_name', 'discount', 'time_left', 'product_url'],
    isActive: true,
    usageCount: 0,
    successRate: 0.82
  },
  {
    name: 'Back in Stock',
    category: 'inventory',
    trigger: 'product_restocked',
    message: 'Good news! {product_name} is back in stock. Order now before it\'s gone again: {product_url}',
    variables: ['product_name', 'product_url'],
    isActive: true,
    usageCount: 0,
    successRate: 0.76
  },
  {
    name: 'Loyalty Reward',
    category: 'loyalty',
    trigger: 'loyalty_points_earned',
    message: 'You earned {points} loyalty points! You now have {total_points} points. Redeem them: {redeem_url}',
    variables: ['points', 'total_points', 'redeem_url'],
    isActive: true,
    usageCount: 0,
    successRate: 0.89
  },
  {
    name: 'Seasonal Greeting',
    category: 'seasonal',
    trigger: 'holiday_season',
    message: 'Happy {holiday}! Enjoy {discount}% off everything with code {holiday_code}. Valid until {expiry_date}',
    variables: ['holiday', 'discount', 'holiday_code', 'expiry_date'],
    isActive: true,
    usageCount: 0,
    successRate: 0.81
  },
  {
    name: 'Low Stock Alert',
    category: 'inventory',
    trigger: 'product_low_stock',
    message: 'Hurry! {product_name} is running low on stock. Only {stock_count} left! Order now: {product_url}',
    variables: ['product_name', 'stock_count', 'product_url'],
    isActive: true,
    usageCount: 0,
    successRate: 0.73
  },
  {
    name: 'Payment Reminder',
    category: 'payment',
    trigger: 'payment_failed',
    message: 'Payment failed for order #{order_number}. Please update your payment method: {payment_url}',
    variables: ['order_number', 'payment_url'],
    isActive: true,
    usageCount: 0,
    successRate: 0.91
  },
  {
    name: 'New Product Launch',
    category: 'product',
    trigger: 'product_launched',
    message: 'New arrival: {product_name}! Be the first to get it with early access: {product_url}',
    variables: ['product_name', 'product_url'],
    isActive: true,
    usageCount: 0,
    successRate: 0.77
  },
  {
    name: 'Customer Support',
    category: 'support',
    trigger: 'support_request',
    message: 'We received your support request #{ticket_number}. We\'ll get back to you within 24 hours.',
    variables: ['ticket_number'],
    isActive: true,
    usageCount: 0,
    successRate: 0.95
  },
  {
    name: 'Re-engagement',
    category: 'retention',
    trigger: 'customer_inactive',
    message: 'We miss you! Come back and discover our latest products. Special offer: {offer_description}',
    variables: ['offer_description'],
    isActive: true,
    usageCount: 0,
    successRate: 0.68
  }
];

async function seedTemplates() {
  try {
    logger.info('Starting SMS templates seeding...');

    // Get all shops to create templates for each
    const shops = await prisma.shop.findMany();
    
    if (shops.length === 0) {
      logger.warn('No shops found. Please create a shop first.');
      return;
    }

    let totalCreated = 0;

    for (const shop of shops) {
      logger.info(`Creating templates for shop: ${shop.shopDomain}`);

      for (const template of smsTemplates) {
        try {
          // Check if template already exists
          const existing = await prisma.templateUsage.findFirst({
            where: {
              shopId: shop.id,
              name: template.name
            }
          });

          if (existing) {
            logger.info(`Template '${template.name}' already exists for shop ${shop.shopDomain}`);
            continue;
          }

          // Create template usage record
          await prisma.templateUsage.create({
            data: {
              shopId: shop.id,
              name: template.name,
              category: template.category,
              trigger: template.trigger,
              message: template.message,
              variables: template.variables,
              isActive: template.isActive,
              usageCount: template.usageCount,
              successRate: template.successRate,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });

          totalCreated++;
          logger.info(`Created template: ${template.name} for shop ${shop.shopDomain}`);
        } catch (error) {
          logger.error(`Error creating template '${template.name}' for shop ${shop.shopDomain}:`, error);
        }
      }
    }

    logger.info(`Template seeding completed. Created ${totalCreated} templates across ${shops.length} shops.`);
    
    return {
      success: true,
      message: `Created ${totalCreated} templates across ${shops.length} shops`,
      totalCreated,
      shopsProcessed: shops.length
    };

  } catch (error) {
    logger.error('Error seeding templates:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedTemplates()
    .then((result) => {
      console.log('Template seeding result:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Template seeding failed:', error);
      process.exit(1);
    });
}

export default seedTemplates;
