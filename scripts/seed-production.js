import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// Test shop domain based on the session token
const TEST_SHOP_DOMAIN = 'sms-blossom-dev.myshopify.com';

async function seedProductionData() {
  console.log('🌱 Starting production data seeding...');
  console.log('🔗 Database URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');

  try {
    // 1. Create or find the test shop
    console.log('📦 Creating test shop...');
    const shop = await prisma.shop.upsert({
      where: { shopDomain: TEST_SHOP_DOMAIN },
      update: {},
      create: {
        shopDomain: TEST_SHOP_DOMAIN,
      },
    });
    console.log(`✅ Shop created/found: ${shop.id}`);

    // 2. Create wallet for the shop
    console.log('💰 Creating wallet...');
    const wallet = await prisma.wallet.upsert({
      where: { shopId: shop.id },
      update: {},
      create: {
        shopId: shop.id,
        balance: 10000, // 10,000 credits
        totalUsed: 0,
        totalBought: 10000,
        active: true,
      },
    });
    console.log(`✅ Wallet created: ${wallet.balance} credits`);

    // 3. Create test contacts
    console.log('👥 Creating test contacts...');
    const contacts = [
      {
        phoneE164: '+1234567890',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        smsConsent: 'opted_in',
        gender: 'male',
      },
      {
        phoneE164: '+1234567891',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        smsConsent: 'opted_in',
        gender: 'female',
      },
      {
        phoneE164: '+1234567892',
        firstName: 'Mike',
        lastName: 'Johnson',
        email: 'mike@example.com',
        smsConsent: 'opted_out',
        gender: 'male',
      },
      {
        phoneE164: '+1234567893',
        firstName: 'Sarah',
        lastName: 'Wilson',
        email: 'sarah@example.com',
        smsConsent: 'opted_in',
        gender: 'female',
      },
      {
        phoneE164: '+1234567894',
        firstName: 'David',
        lastName: 'Brown',
        email: 'david@example.com',
        smsConsent: 'opted_in',
        gender: 'male',
      },
    ];

    let contactsCreated = 0;
    for (const contactData of contacts) {
      const existingContact = await prisma.contact.findFirst({
        where: {
          shopId: shop.id,
          phoneE164: contactData.phoneE164,
        },
      });

      if (!existingContact) {
        await prisma.contact.create({
          data: {
            shopId: shop.id,
            ...contactData,
          },
        });
        contactsCreated++;
      }
    }
    console.log(`✅ Created ${contactsCreated} new contacts`);

    // 4. Create test campaigns
    console.log('🚀 Creating test campaigns...');
    const campaigns = [
      {
        name: 'Welcome Campaign',
        message: 'Welcome to our store! Get 10% off your first order with code WELCOME10',
        audience: 'all',
        scheduleType: 'immediate',
        status: 'sent',
      },
      {
        name: 'Black Friday Sale',
        message: 'Black Friday is here! Get 50% off everything! Use code BLACK50',
        audience: 'all',
        scheduleType: 'immediate',
        status: 'sent',
      },
      {
        name: 'Holiday Special',
        message: 'Happy Holidays! Special discount just for you. Use code HOLIDAY20',
        audience: 'women',
        scheduleType: 'scheduled',
        status: 'draft',
        scheduleAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      },
    ];

    let campaignsCreated = 0;
    for (const campaignData of campaigns) {
      const campaign = await prisma.campaign.create({
        data: {
          shopId: shop.id,
          ...campaignData,
        },
      });

      // Create campaign metrics
      await prisma.campaignMetrics.create({
        data: {
          campaignId: campaign.id,
          totalSent: Math.floor(Math.random() * 1000) + 100,
          totalDelivered: Math.floor(Math.random() * 800) + 80,
          totalFailed: Math.floor(Math.random() * 50) + 5,
          totalClicked: Math.floor(Math.random() * 100) + 10,
        },
      });
      campaignsCreated++;
    }
    console.log(`✅ Created ${campaignsCreated} test campaigns`);

    // 5. Create test discounts
    console.log('🎫 Creating test discounts...');
    const discounts = [
      { code: 'WELCOME10' },
      { code: 'BLACK50' },
      { code: 'HOLIDAY20' },
    ];

    let discountsCreated = 0;
    for (const discountData of discounts) {
      const existingDiscount = await prisma.discountLink.findFirst({
        where: {
          shopId: shop.id,
          code: discountData.code,
        },
      });

      if (!existingDiscount) {
        await prisma.discountLink.create({
          data: {
            shopId: shop.id,
            ...discountData,
          },
        });
        discountsCreated++;
      }
    }
    console.log(`✅ Created ${discountsCreated} new discounts`);

    // 6. Create wallet transactions
    console.log('💳 Creating wallet transactions...');
    const transactions = [
      {
        type: 'purchase',
        credits: 10000,
        ref: 'INITIAL_CREDITS',
        meta: {
          package: 'Starter Package',
          price: 29.00,
        },
      },
      {
        type: 'debit',
        credits: -500,
        ref: 'CAMPAIGN_SEND',
        meta: {
          campaign: 'Welcome Campaign',
          recipients: 500,
        },
      },
      {
        type: 'debit',
        credits: -300,
        ref: 'CAMPAIGN_SEND',
        meta: {
          campaign: 'Black Friday Sale',
          recipients: 300,
        },
      },
    ];

    for (const transactionData of transactions) {
      await prisma.walletTransaction.create({
        data: {
          shopId: shop.id,
          ...transactionData,
        },
      });
    }
    console.log(`✅ Created ${transactions.length} wallet transactions`);

    // 7. Create message logs
    console.log('📱 Creating message logs...');
    const messageLogs = [
      {
        phoneE164: '+1234567890',
        provider: 'mitto',
        providerMsgId: 'msg_001',
        direction: 'outbound',
        status: 'delivered',
        payload: {
          message: 'Welcome to our store!',
          campaign: 'Welcome Campaign',
        },
      },
      {
        phoneE164: '+1234567891',
        provider: 'mitto',
        providerMsgId: 'msg_002',
        direction: 'outbound',
        status: 'delivered',
        payload: {
          message: 'Black Friday is here!',
          campaign: 'Black Friday Sale',
        },
      },
      {
        phoneE164: '+1234567892',
        provider: 'mitto',
        providerMsgId: 'msg_003',
        direction: 'outbound',
        status: 'failed',
        error: 'Invalid phone number',
        payload: {
          message: 'Welcome to our store!',
          campaign: 'Welcome Campaign',
        },
      },
    ];

    for (const messageData of messageLogs) {
      await prisma.messageLog.create({
        data: {
          shopId: shop.id,
          ...messageData,
        },
      });
    }
    console.log(`✅ Created ${messageLogs.length} message logs`);

    console.log('\n🎉 Production data seeding completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   Shop: ${shop.shopDomain}`);
    console.log(`   Wallet Balance: ${wallet.balance} credits`);
    console.log(`   Contacts: ${contactsCreated} new`);
    console.log(`   Campaigns: ${campaignsCreated} new`);
    console.log(`   Discounts: ${discountsCreated} new`);
    console.log(`   Transactions: ${transactions.length}`);
    console.log(`   Message Logs: ${messageLogs.length}`);

    console.log(`\n🔗 Test with Postman:`);
    console.log(`   Base URL: https://sendly-marketing-backend.onrender.com`);
    console.log(`   Authorization: Bearer shpua_87fa59cd1662ff4a01c0b573...`);
    console.log(`   Shop Domain: ${TEST_SHOP_DOMAIN}`);

  } catch (error) {
    console.error('❌ Error seeding production data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
seedProductionData()
  .then(() => {
    console.log('\n✅ Production seeding completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Production seeding failed:', error);
    process.exit(1);
  });
