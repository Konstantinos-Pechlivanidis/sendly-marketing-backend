/* eslint-disable no-console */
/**
 * Comprehensive Dev Store Seeding Script
 * Creates/updates sms-blossom-dev.myshopify.com with comprehensive test data
 * Includes: contacts, campaigns, automations, billing data, etc.
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

async function seedComprehensive() {
  try {
    console.log('🌱 Seeding development store with comprehensive test data...');
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
          credits: 10000, // Start with 10000 credits for testing
          currency: 'EUR',
          status: 'active',
          settings: {
            create: {
              currency: 'EUR',
              timezone: 'Europe/Athens',
              senderNumber: '+306979623266',
              senderName: 'Sendly',
            },
          },
        },
        include: { settings: true },
      });
      console.log('✅ Dev store created');
    } else {
      console.log('✅ Dev store already exists');
      // Update credits and ensure settings exist
      store = await prisma.shop.update({
        where: { id: store.id },
        data: {
          credits: 10000,
          settings: {
            upsert: {
              create: {
                currency: 'EUR',
                timezone: 'Europe/Athens',
                senderNumber: '+306979623266',
                senderName: 'Sendly',
              },
              update: {
                senderNumber: '+306979623266',
                senderName: 'Sendly',
              },
            },
          },
        },
        include: { settings: true },
      });
      console.log('✅ Dev store updated');
    }

    console.log('\n📊 Store Info:');
    console.log(`   ID: ${store.id}`);
    console.log(`   Domain: ${store.shopDomain}`);
    console.log(`   Credits: ${store.credits}`);
    console.log(`   Currency: ${store.currency}`);

    // Clean up existing test data (keep store)
    console.log('\n🧹 Cleaning up existing test data...');
    await prisma.campaignRecipient.deleteMany({
      where: { campaign: { shopId: store.id } },
    });
    await prisma.campaignMetrics.deleteMany({
      where: { campaign: { shopId: store.id } },
    });
    await prisma.campaign.deleteMany({
      where: { shopId: store.id },
    });
    await prisma.messageLog.deleteMany({
      where: { shopId: store.id },
    });
    await prisma.contact.deleteMany({
      where: { shopId: store.id },
    });
    await prisma.walletTransaction.deleteMany({
      where: { shopId: store.id },
    });
    await prisma.billingTransaction.deleteMany({
      where: { shopId: store.id },
    });
    console.log('✅ Test data cleaned');

    // Create test contacts
    console.log('\n📇 Creating test contacts...');
    const contacts = await prisma.contact.createMany({
      data: [
        {
          shopId: store.id,
          firstName: 'Maria',
          lastName: 'Papadopoulos',
          phoneE164: '+306977111111',
          email: 'maria@example.com',
          gender: 'female',
          smsConsent: 'opted_in',
          birthDate: new Date('1990-06-15'),
        },
        {
          shopId: store.id,
          firstName: 'John',
          lastName: 'Doe',
          phoneE164: '+306977222222',
          email: 'john@example.com',
          gender: 'male',
          smsConsent: 'opted_in',
          birthDate: new Date('1985-03-20'),
        },
        {
          shopId: store.id,
          firstName: 'Anna',
          lastName: 'Smith',
          phoneE164: '+306977333333',
          email: 'anna@example.com',
          gender: 'female',
          smsConsent: 'opted_in',
        },
        {
          shopId: store.id,
          firstName: 'George',
          lastName: 'Petros',
          phoneE164: '+306977444444',
          email: 'george@example.com',
          gender: 'male',
          smsConsent: 'opted_out',
        },
        {
          shopId: store.id,
          firstName: 'Elena',
          lastName: 'Kostas',
          phoneE164: '+306977555555',
          email: 'elena@example.com',
          gender: 'female',
          smsConsent: 'opted_in',
          birthDate: new Date('1992-12-25'),
        },
      ],
    });
    console.log(`✅ Created ${contacts.count} contacts`);

    // Create test campaigns
    console.log('\n📢 Creating test campaigns...');
    await prisma.campaign.create({
      data: {
        shopId: store.id,
        name: 'Welcome Campaign',
        message: 'Welcome to our store! Get 10% off your first order with code WELCOME10',
        audience: 'all',
        status: 'draft',
        scheduleType: 'immediate',
      },
    });

    const campaign2 = await prisma.campaign.create({
      data: {
        shopId: store.id,
        name: 'Summer Sale',
        message: 'Summer sale is here! Get up to 50% off on selected items. Shop now!',
        audience: 'all',
        status: 'sent',
        scheduleType: 'immediate',
      },
    });

    await prisma.campaign.create({
      data: {
        shopId: store.id,
        name: 'Scheduled Campaign',
        message: 'This is a scheduled campaign',
        audience: 'all',
        status: 'scheduled',
        scheduleType: 'scheduled',
        scheduleAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      },
    });

    // Create campaign metrics
    await prisma.campaignMetrics.create({
      data: {
        campaignId: campaign2.id,
        totalSent: 5,
        totalDelivered: 4,
        totalFailed: 1,
      },
    });

    console.log('✅ Created 3 campaigns');

    // Create wallet transactions
    console.log('\n💰 Creating wallet transactions...');
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
          ref: `campaign:${campaign2.id}`,
          meta: {
            description: 'SMS campaign sent',
            campaignId: campaign2.id,
          },
        },
      ],
    });
    console.log(`✅ Created ${walletTransactions.count} wallet transactions`);

    // Create billing transactions
    console.log('\n💳 Creating billing transactions...');
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
      ],
    });
    console.log(`✅ Created ${billingTransactions.count} billing transactions`);

    // Create message logs
    console.log('\n📨 Creating message logs...');
    const messageLogs = await prisma.messageLog.createMany({
      data: [
        {
          shopId: store.id,
          phoneE164: '+306977111111',
          direction: 'outbound',
          provider: 'mitto',
          providerMsgId: 'msg_test_1',
          status: 'sent',
          campaignId: campaign2.id,
        },
        {
          shopId: store.id,
          phoneE164: '+306977222222',
          direction: 'outbound',
          provider: 'mitto',
          providerMsgId: 'msg_test_2',
          status: 'delivered',
          campaignId: campaign2.id,
        },
        {
          shopId: store.id,
          phoneE164: '+306977333333',
          direction: 'outbound',
          provider: 'mitto',
          providerMsgId: 'msg_test_3',
          status: 'sent',
          campaignId: campaign2.id,
        },
      ],
    });
    console.log(`✅ Created ${messageLogs.count} message logs`);

    console.log('\n✅ Comprehensive dev store data seeded successfully!');
    console.log('\n📋 Summary:');
    console.log(`   Store: ${store.shopDomain}`);
    console.log(`   Credits: ${store.credits}`);
    console.log(`   Contacts: ${contacts.count}`);
    console.log('   Campaigns: 3');
    console.log(`   Wallet Transactions: ${walletTransactions.count}`);
    console.log(`   Billing Transactions: ${billingTransactions.count}`);
    console.log(`   Message Logs: ${messageLogs.count}`);

    logger.info('Comprehensive dev store data seeded', {
      storeId: store.id,
      shopDomain: store.shopDomain,
      credits: store.credits,
      contacts: contacts.count,
      campaigns: 3,
      walletTransactions: walletTransactions.count,
      billingTransactions: billingTransactions.count,
      messageLogs: messageLogs.count,
    });

    return store;
  } catch (error) {
    console.error('❌ Error seeding dev store:', error);
    logger.error('Failed to seed comprehensive dev store data', {
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

if (isMainModule || process.argv[1]?.includes('seed-dev-store-comprehensive')) {
  seedComprehensive()
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

export default seedComprehensive;

