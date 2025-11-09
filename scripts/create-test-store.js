/* eslint-disable no-console */
import prisma from '../services/prisma.js';
import { logger } from '../utils/logger.js';

async function createTestStore() {
  try {
    console.log('Creating test store...');

    // Create the test store
    const store = await prisma.shop.create({
      data: {
        shopDomain: 'sms-blossom-dev.myshopify.com',
        shopName: 'SMS Blossom Dev',
        accessToken: 'test-access-token',
        credits: 1000, // Give some test credits
        currency: 'EUR',
        settings: {
          create: {
            currency: 'EUR',
            timezone: 'Europe/Athens',
            senderNumber: '+306977123456',
            senderName: 'SMS Blossom',
          },
        },
      },
      include: {
        settings: true,
      },
    });

    console.log('✅ Test store created successfully!');
    console.log('Store ID:', store.id);
    console.log('Domain:', store.shopDomain);
    console.log('Credits:', store.credits);

    // Create some test contacts
    const contacts = await prisma.contact.createMany({
      data: [
        {
          shopId: store.id,
          firstName: 'Maria',
          lastName: 'Papadopoulos',
          phoneE164: '+306977123456',
          email: 'maria@example.com',
          gender: 'female',
          smsConsent: 'consented',
          birthDate: new Date('1990-06-15'),
        },
        {
          shopId: store.id,
          firstName: 'John',
          lastName: 'Doe',
          phoneE164: '+306977123457',
          email: 'john@example.com',
          gender: 'male',
          smsConsent: 'consented',
          birthDate: new Date('1985-03-15'),
        },
      ],
    });

    console.log('✅ Test contacts created:', contacts.count);

    logger.info('Test store setup completed', {
      storeId: store.id,
      domain: store.shopDomain,
      contacts: contacts.count,
    });

  } catch (error) {
    console.error('❌ Error creating test store:', error);
    logger.error('Failed to create test store', { error: error.message });
  } finally {
    await prisma.$disconnect();
  }
}

createTestStore();
