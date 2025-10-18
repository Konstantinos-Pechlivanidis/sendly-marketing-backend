import prisma from '../services/prisma.js';
import { logger } from '../utils/logger.js';

const sampleTemplates = [
  {
    title: 'Welcome New Customer',
    category: 'Welcome',
    content: 'Welcome to {{shopName}}! Thank you for joining us. Use code WELCOME10 for 10% off your first order!',
    tags: ['welcome', 'new-customer', 'discount'],
  },
  {
    title: 'Abandoned Cart Reminder',
    category: 'Abandoned Cart',
    content: 'Hi {{firstName}}! You left some items in your cart at {{shopName}}. Complete your purchase now and save 15% with code CART15!',
    tags: ['abandoned-cart', 'reminder', 'discount'],
  },
  {
    title: 'Order Confirmation',
    category: 'Order Updates',
    content: 'Thank you for your order #{{orderNumber}}! Your items are being prepared and will ship within 1-2 business days.',
    tags: ['order-confirmation', 'shipping'],
  },
  {
    title: 'Shipping Update',
    category: 'Order Updates',
    content: 'Great news! Your order #{{orderNumber}} has shipped. Track your package: {{trackingLink}}',
    tags: ['shipping', 'tracking'],
  },
  {
    title: 'Birthday Special',
    category: 'Holiday Offers',
    content: 'Happy Birthday {{firstName}}! 🎉 Enjoy 20% off your entire order with code BIRTHDAY20. Valid for 7 days!',
    tags: ['birthday', 'special-offer', 'discount'],
  },
  {
    title: 'Flash Sale Alert',
    category: 'Promotional',
    content: '⚡ FLASH SALE! 50% off everything for the next 24 hours only. Use code FLASH50 at checkout. Don\'t miss out!',
    tags: ['flash-sale', 'urgent', 'discount'],
  },
  {
    title: 'Product Back in Stock',
    category: 'Inventory',
    content: 'Good news! {{productName}} is back in stock. Get yours before they\'re gone again!',
    tags: ['back-in-stock', 'inventory'],
  },
  {
    title: 'Review Request',
    category: 'Feedback',
    content: 'Hi {{firstName}}! How was your recent purchase? We\'d love to hear your thoughts. Leave a review and get 10% off your next order!',
    tags: ['review', 'feedback', 'discount'],
  },
  {
    title: 'Holiday Greetings',
    category: 'Holiday Offers',
    content: 'Happy Holidays from {{shopName}}! 🎄 Enjoy 25% off everything with code HOLIDAY25. Wishing you joy and savings!',
    tags: ['holiday', 'greetings', 'discount'],
  },
  {
    title: 'Re-order Reminder',
    category: 'Re-engagement',
    content: 'Hi {{firstName}}! It\'s been a while since your last order. We miss you! Here\'s 15% off to welcome you back: WELCOME15',
    tags: ['re-engagement', 'win-back', 'discount'],
  },
];

async function seedTemplates() {
  try {
    console.log('Starting template seeding...');
    logger.info('Starting template seeding...');

    // Clear existing templates
    console.log('Clearing existing templates...');
    await prisma.templateUsage.deleteMany();
    await prisma.template.deleteMany();

    // Create templates
    console.log(`Creating ${sampleTemplates.length} templates...`);
    for (const templateData of sampleTemplates) {
      const template = await prisma.template.create({
        data: templateData,
      });
      console.log(`Created template: ${template.title}`);
      logger.info(`Created template: ${template.title}`);
    }

    console.log(`Successfully seeded ${sampleTemplates.length} templates`);
    logger.info(`Successfully seeded ${sampleTemplates.length} templates`);
  } catch (error) {
    console.error('Failed to seed templates:', error.message);
    logger.error('Failed to seed templates', {
      error: error.message,
    });
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedTemplates()
    .then(() => {
      logger.info('Template seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Template seeding failed', { error: error.message });
      process.exit(1);
    });
}

export default seedTemplates;
