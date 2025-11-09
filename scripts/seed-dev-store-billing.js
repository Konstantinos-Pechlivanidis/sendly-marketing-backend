/* eslint-disable no-console */
/**
 * Seed Development Store with Billing Data
 * Creates/updates sms-blossom-dev.myshopify.com with billing test data
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env') });

import prisma from '../services/prisma.js';
import { logger } from '../utils/logger.js';

const DEV_STORE_DOMAIN = 'sms-blossom-dev.myshopify.com';

async function seedDevStoreBilling() {
  try {
    console.log('🌱 Seeding development store with billing data...');
    console.log(`📦 Store: ${DEV_STORE_DOMAIN}`);

    // Find or create dev store
    let store = await prisma.shop.findUnique({
      where: { shopDomain: DEV_STORE_DOMAIN },
      include: { settings: true },
    });

    if (!store) {
      console.log('📦 Creating dev store...');
      store = await prisma.shop.create({
        data: {
          shopDomain: DEV_STORE_DOMAIN,
          shopName: 'SMS Blossom Dev',
          accessToken: 'dev-access-token',
          credits: 5000, // Start with 5000 credits
          currency: 'EUR',
          status: 'active',
          settings: {
            create: {
              currency: 'EUR',
              timezone: 'Europe/Athens',
              senderNumber: '+306977123456',
              senderName: 'SMS Blossom',
            },
          },
        },
        include: { settings: true },
      });
      console.log('✅ Dev store created');
    } else {
      console.log('✅ Dev store already exists');
      // Update credits to 5000 for testing
      store = await prisma.shop.update({
        where: { id: store.id },
        data: { credits: 5000 },
        include: { settings: true },
      });
      console.log('✅ Dev store credits updated to 5000');
    }

    console.log('\n📊 Store Info:');
    console.log(`   ID: ${store.id}`);
    console.log(`   Domain: ${store.shopDomain}`);
    console.log(`   Credits: ${store.credits}`);
    console.log(`   Currency: ${store.currency}`);

    // Clean up existing test transactions
    console.log('\n🧹 Cleaning up existing test transactions...');
    await prisma.walletTransaction.deleteMany({
      where: { shopId: store.id },
    });
    await prisma.billingTransaction.deleteMany({
      where: { shopId: store.id },
    });
    console.log('✅ Test transactions cleaned');

    // Create sample wallet transactions
    console.log('\n💰 Creating sample wallet transactions...');
    const walletTransactions = await prisma.walletTransaction.createMany({
      data: [
        {
          shopId: store.id,
          type: 'purchase',
          credits: 1000,
          ref: 'stripe:cs_test_purchase_1',
          meta: {
            description: 'Initial credit purchase',
            packageId: 'package_1000',
          },
        },
        {
          shopId: store.id,
          type: 'purchase',
          credits: 5000,
          ref: 'stripe:cs_test_purchase_2',
          meta: {
            description: 'Large credit purchase',
            packageId: 'package_5000',
          },
        },
        {
          shopId: store.id,
          type: 'debit',
          credits: -100,
          ref: 'campaign:campaign_test_1',
          meta: {
            description: 'SMS campaign sent',
            campaignId: 'campaign_test_1',
          },
        },
        {
          shopId: store.id,
          type: 'debit',
          credits: -50,
          ref: 'campaign:campaign_test_2',
          meta: {
            description: 'SMS campaign sent',
            campaignId: 'campaign_test_2',
          },
        },
      ],
    });
    console.log(`✅ Created ${walletTransactions.count} wallet transactions`);

    // Create sample billing transactions
    console.log('\n💳 Creating sample billing transactions...');
    const billingTransactions = await prisma.billingTransaction.createMany({
      data: [
        {
          shopId: store.id,
          creditsAdded: 1000,
          amount: 2999, // €29.99 in cents
          currency: 'EUR',
          packageType: 'package_1000',
          stripeSessionId: 'cs_test_purchase_1',
          stripePaymentId: 'pi_test_purchase_1',
          status: 'completed',
        },
        {
          shopId: store.id,
          creditsAdded: 5000,
          amount: 12999, // €129.99 in cents
          currency: 'EUR',
          packageType: 'package_5000',
          stripeSessionId: 'cs_test_purchase_2',
          stripePaymentId: 'pi_test_purchase_2',
          status: 'completed',
        },
        {
          shopId: store.id,
          creditsAdded: 1000,
          amount: 2999,
          currency: 'EUR',
          packageType: 'package_1000',
          stripeSessionId: 'cs_test_pending',
          status: 'pending',
        },
        {
          shopId: store.id,
          creditsAdded: 10000,
          amount: 22999, // €229.99 in cents
          currency: 'EUR',
          packageType: 'package_10000',
          stripeSessionId: 'cs_test_failed',
          status: 'failed',
        },
      ],
    });
    console.log(`✅ Created ${billingTransactions.count} billing transactions`);

    console.log('\n✅ Development store billing data seeded successfully!');
    console.log('\n📋 Summary:');
    console.log(`   Store: ${store.shopDomain}`);
    console.log(`   Credits: ${store.credits}`);
    console.log(`   Wallet Transactions: ${walletTransactions.count}`);
    console.log(`   Billing Transactions: ${billingTransactions.count}`);

    logger.info('Dev store billing data seeded', {
      storeId: store.id,
      shopDomain: store.shopDomain,
      credits: store.credits,
      walletTransactions: walletTransactions.count,
      billingTransactions: billingTransactions.count,
    });

    return store;
  } catch (error) {
    console.error('❌ Error seeding dev store:', error);
    logger.error('Failed to seed dev store billing data', {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
const isMainModule = import.meta.url === `file://${process.argv[1]}` ||
                     process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'));

if (isMainModule || process.argv[1]?.includes('seed-dev-store-billing')) {
  seedDevStoreBilling()
    .then(() => {
      console.log('\n🎉 Seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Seeding failed:', error);
      console.error(error.stack);
      process.exit(1);
    });
}

export default seedDevStoreBilling;

