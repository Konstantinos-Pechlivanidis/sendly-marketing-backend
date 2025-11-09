/* eslint-disable no-console */
import prisma from '../../services/prisma.js';
import { testConfig } from '../config/test-config.js';

/**
 * Test Utilities
 * Helper functions for testing
 * Uses production database and creates real test data
 */

let testShopId = null;
const testShopDomain = testConfig.testShop.shopDomain;

/**
 * Get or create the test shop (sms-blossom-dev.myshopify.com)
 * Uses the actual shop from production database if it exists, otherwise creates it
 */
export async function getOrCreateTestShop(shopData = {}) {
  const shopDomain = shopData.shopDomain || testConfig.testShop.shopDomain;

  // Try to find existing shop first
  let shop = await prisma.shop.findUnique({
    where: { shopDomain },
    include: { settings: true },
  });

  if (shop) {
    console.log(`✅ Using existing shop: ${shop.shopDomain} (ID: ${shop.id})`);
    testShopId = shop.id;
    return shop;
  }

  // Create new shop if it doesn't exist
  console.log(`📦 Creating test shop: ${shopDomain}`);
  shop = await prisma.shop.create({
    data: {
      shopDomain,
      shopName: shopData.shopName || testConfig.testShop.shopName,
      accessToken: shopData.accessToken || testConfig.testShop.accessToken,
      credits: shopData.credits !== undefined ? shopData.credits : testConfig.testShop.credits,
      currency: shopData.currency || testConfig.testShop.currency,
      status: shopData.status || 'active',
      settings: {
        create: {
          currency: shopData.currency || testConfig.testShop.currency,
          timezone: 'Europe/Athens',
          senderNumber: testConfig.mitto.senderName || 'Sendly',
          senderName: testConfig.mitto.senderName || 'Sendly',
        },
      },
    },
    include: {
      settings: true,
    },
  });

  testShopId = shop.id;
  console.log(`✅ Created test shop: ${shop.shopDomain} (ID: ${shop.id})`);
  return shop;
}

/**
 * Create a test shop for testing (legacy function - uses getOrCreateTestShop)
 * Creates real data in production database
 */
export async function createTestShop(shopData = {}) {
  return await getOrCreateTestShop(shopData);
}

/**
 * Get test shop ID
 */
export function getTestShopId() {
  if (!testShopId) {
    throw new Error('Test shop not created. Call createTestShop() first.');
  }
  return testShopId;
}

/**
 * Create test headers for authenticated requests
 */
export function createTestHeaders(shopDomain = testShopDomain) {
  const headers = {
    'X-Shopify-Shop-Domain': shopDomain,
    'Content-Type': 'application/json',
  };

  // Add auth token if provided in .env
  if (process.env.TEST_AUTH_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.TEST_AUTH_TOKEN}`;
  }

  return headers;
}

/**
 * Generate unique identifier for test data
 */
function generateUniqueId() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000000);
  return `${timestamp}_${random}`;
}

/**
 * Create a test contact
 * Creates real contact data in production database
 */
export async function createTestContact(contactData = {}) {
  const shopId = getTestShopId();
  const uniqueId = generateUniqueId();
  const prefix = testConfig.testData.prefix;

  // Use provided phone or generate unique one
  const phoneE164 = contactData.phoneE164 || `+306977${String(uniqueId).slice(-10)}`;

  // Check if contact with this phone already exists
  const existing = await prisma.contact.findUnique({
    where: {
      shopId_phoneE164: {
        shopId,
        phoneE164,
      },
    },
  });

  if (existing) {
    // If exists, use a different phone number
    const fallbackPhone = `+306977${String(Date.now() + Math.random() * 1000).slice(-10)}`;
    return await createTestContact({ ...contactData, phoneE164: fallbackPhone });
  }

  const contact = await prisma.contact.create({
    data: {
      shopId,
      firstName: contactData.firstName || `${prefix}John`,
      lastName: contactData.lastName || `${prefix}Doe`,
      phoneE164,
      email: contactData.email || `${prefix}test${uniqueId}@example.com`,
      gender: contactData.gender || 'male',
      birthDate: contactData.birthDate || new Date('1990-01-01'),
      smsConsent: contactData.smsConsent || 'opted_in',
      tags: contactData.tags || [`${prefix}test`],
    },
  });

  console.log(`✅ Created test contact: ${contact.phoneE164} (ID: ${contact.id})`);
  return contact;
}

/**
 * Create a test campaign
 * Creates real campaign data in production database
 */
export async function createTestCampaign(campaignData = {}) {
  const shopId = getTestShopId();
  const uniqueId = generateUniqueId();
  const prefix = testConfig.testData.prefix;

  // Generate unique campaign name
  const campaignName = campaignData.name || `${prefix}Test Campaign ${uniqueId}`;

  // Check if campaign with this name already exists
  const existing = await prisma.campaign.findFirst({
    where: {
      shopId,
      name: campaignName,
    },
  });

  if (existing) {
    // If exists, use a different name
    const fallbackName = `${prefix}Test Campaign ${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return await createTestCampaign({ ...campaignData, name: fallbackName });
  }

  const campaign = await prisma.campaign.create({
    data: {
      shopId,
      name: campaignName,
      message: campaignData.message || `${prefix}Test message for campaign ${uniqueId}`,
      audience: campaignData.audience || 'all',
      scheduleType: campaignData.scheduleType || 'immediate',
      status: campaignData.status || 'draft',
      discountId: campaignData.discountId || null,
      scheduleAt: campaignData.scheduleAt || null,
      recurringDays: campaignData.recurringDays || null,
    },
  });

  // Create metrics record if it doesn't exist
  try {
    await prisma.campaignMetrics.create({
      data: { campaignId: campaign.id },
    });
  } catch (error) {
    // Metrics might already exist, ignore
    if (!error.message.includes('Unique constraint')) {
      throw error;
    }
  }

  console.log(`✅ Created test campaign: ${campaign.name} (ID: ${campaign.id})`);
  return campaign;
}

/**
 * Clean up test data before each test (for beforeEach hooks)
 * Deletes test-prefixed data to avoid unique constraint violations
 */
export async function cleanupBeforeTest() {
  if (!testShopId) {
    return;
  }

  const prefix = testConfig.testData.prefix;

  try {
    // Delete campaign recipients first (foreign key constraint)
    const testCampaigns = await prisma.campaign.findMany({
      where: {
        shopId: testShopId,
        name: { startsWith: prefix },
      },
      select: { id: true },
    });

    const campaignIds = testCampaigns.map(c => c.id);

    if (campaignIds.length > 0) {
      // Delete campaign recipients
      await prisma.campaignRecipient.deleteMany({
        where: {
          campaignId: { in: campaignIds },
        },
      });

      // Delete campaign metrics
      await prisma.campaignMetrics.deleteMany({
        where: {
          campaignId: { in: campaignIds },
        },
      });
    }

    // Delete test-prefixed campaigns
    await prisma.campaign.deleteMany({
      where: {
        shopId: testShopId,
        name: { startsWith: prefix },
      },
    });

    // Delete test-prefixed contacts
    await prisma.contact.deleteMany({
      where: {
        shopId: testShopId,
        OR: [
          { firstName: { startsWith: prefix } },
          { lastName: { startsWith: prefix } },
          { email: { startsWith: prefix } },
        ],
      },
    });
  } catch (error) {
    // Ignore cleanup errors - tests should still run
    console.warn('Cleanup before test failed:', error.message);
  }
}

/**
 * Clean up test data (only test-prefixed data, not the shop)
 * Only cleans up if TEST_CLEANUP is not set to 'false'
 */
export async function cleanupTestData() {
  if (!testConfig.testData.cleanup) {
    console.log('⚠️  Test cleanup disabled. Test data will remain in database.');
    return;
  }

  if (testShopId) {
    // Check if this is the production test shop - don't delete it, only clean test data
    const shop = await prisma.shop.findUnique({
      where: { id: testShopId },
      select: { shopDomain: true },
    });

    const isProductionShop = shop?.shopDomain === testConfig.testShop.shopDomain;
    const prefix = testConfig.testData.prefix;

    if (isProductionShop) {
      console.log(`🧹 Cleaning up test data (with prefix "${prefix}") for production shop: ${shop.shopDomain}`);

      // Delete only test-prefixed data, not the shop itself
      // Delete contacts with test prefix in name or email
      await prisma.contact.deleteMany({
        where: {
          shopId: testShopId,
          OR: [
            { firstName: { startsWith: prefix } },
            { lastName: { startsWith: prefix } },
            { email: { startsWith: prefix } },
          ],
        },
      });

      // Delete campaigns with test prefix
      await prisma.campaign.deleteMany({
        where: {
          shopId: testShopId,
          name: { startsWith: prefix },
        },
      });

      // Delete test wallet transactions (with test refs)
      await prisma.walletTransaction.deleteMany({
        where: {
          shopId: testShopId,
          ref: { startsWith: 'TEST_' },
        },
      });

      // Delete test billing transactions (with test session IDs)
      await prisma.billingTransaction.deleteMany({
        where: {
          shopId: testShopId,
          OR: [
            { stripeSessionId: { startsWith: 'cs_test' } },
            { stripeSessionId: { startsWith: 'TEST_' } },
          ],
        },
      });

      console.log(`✅ Cleaned up test data for shop: ${shop.shopDomain}`);
      return;
    }

    console.log(`🧹 Cleaning up all data for shop: ${testShopId}`);

    // Delete all related data for non-production shops
    await prisma.contact.deleteMany({ where: { shopId: testShopId } });
    await prisma.campaign.deleteMany({ where: { shopId: testShopId } });
    await prisma.walletTransaction.deleteMany({ where: { shopId: testShopId } });
    await prisma.billingTransaction.deleteMany({ where: { shopId: testShopId } });
    await prisma.automationLog.deleteMany({ where: { storeId: testShopId } });
    await prisma.userAutomation.deleteMany({ where: { shopId: testShopId } });
    await prisma.messageLog.deleteMany({ where: { shopId: testShopId } });
    await prisma.segmentMembership.deleteMany({
      where: {
        contact: { shopId: testShopId },
      },
    });
    await prisma.segment.deleteMany({ where: { shopId: testShopId } });

    // Delete shop settings
    await prisma.shopSettings.deleteMany({ where: { shopId: testShopId } });

    // Delete shop (only if it exists)
    try {
      await prisma.shop.delete({ where: { id: testShopId } });
    } catch (error) {
      // Shop might not exist or might have dependencies, ignore
      if (!error.message.includes('Record to delete does not exist')) {
        console.warn(`⚠️  Could not delete shop ${testShopId}: ${error.message}`);
      }
    }

    console.log(`✅ Cleaned up test data for shop: ${testShopId}`);
    testShopId = null;
  }
}

/**
 * Reset test shop
 */
export async function resetTestShop() {
  await cleanupTestData();
  return await createTestShop();
}

/**
 * Wait for async operations
 */
export function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Add delay between requests to avoid rate limiting
 * Use this in tests that make multiple rapid requests
 */
export async function delayBetweenRequests(ms = 100) {
  await wait(ms);
}

/**
 * Create test request object
 */
export function createTestRequest(options = {}) {
  return {
    ...options,
    headers: createTestHeaders(options.shopDomain),
    query: options.query || {},
    body: options.body || {},
    params: options.params || {},
    ctx: options.ctx || {
      store: {
        id: testShopId,
        shopDomain: testShopDomain,
        credits: 1000,
      },
    },
  };
}

/**
 * Create test response object
 */
export function createTestResponse() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
    getHeader: jest.fn(),
  };
  return res;
}

/**
 * Create test next function
 */
export function createTestNext() {
  return jest.fn();
}

export default {
  createTestShop,
  getTestShopId,
  createTestHeaders,
  createTestContact,
  createTestCampaign,
  cleanupTestData,
  cleanupBeforeTest,
  resetTestShop,
  wait,
  delayBetweenRequests,
  createTestRequest,
  createTestResponse,
  createTestNext,
};

