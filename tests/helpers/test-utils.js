import prisma from '../../services/prisma.js';

/**
 * Test Utilities
 * Helper functions for testing
 */

let testShopId = null;
const testShopDomain = 'test-store.myshopify.com';

/**
 * Create a test shop for testing
 */
export async function createTestShop(shopData = {}) {
  const shop = await prisma.shop.create({
    data: {
      shopDomain: shopData.shopDomain || testShopDomain,
      shopName: shopData.shopName || 'Test Store',
      accessToken: shopData.accessToken || 'test_token',
      credits: shopData.credits || 1000,
      currency: shopData.currency || 'EUR',
      status: shopData.status || 'active',
      settings: {
        create: {
          currency: shopData.currency || 'EUR',
          timezone: 'Europe/Athens',
          senderNumber: '+306977123456',
          senderName: 'TestStore',
        },
      },
    },
    include: {
      settings: true,
    },
  });

  testShopId = shop.id;
  return shop;
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
  return {
    'Authorization': 'Bearer test_token',
    'X-Shopify-Shop-Domain': shopDomain,
    'Content-Type': 'application/json',
  };
}

/**
 * Create a test contact
 */
export async function createTestContact(contactData = {}) {
  const shopId = getTestShopId();

  return await prisma.contact.create({
    data: {
      shopId,
      firstName: contactData.firstName || 'John',
      lastName: contactData.lastName || 'Doe',
      phoneE164: contactData.phoneE164 || '+306977123456',
      email: contactData.email || 'john.doe@example.com',
      gender: contactData.gender || 'male',
      birthDate: contactData.birthDate || new Date('1990-01-01'),
      smsConsent: contactData.smsConsent || 'opted_in',
      tags: contactData.tags || [],
    },
  });
}

/**
 * Create a test campaign
 */
export async function createTestCampaign(campaignData = {}) {
  const shopId = getTestShopId();

  return await prisma.campaign.create({
    data: {
      shopId,
      name: campaignData.name || 'Test Campaign',
      message: campaignData.message || 'Test message',
      audience: campaignData.audience || 'all',
      scheduleType: campaignData.scheduleType || 'immediate',
      status: campaignData.status || 'draft',
      discountId: campaignData.discountId || null,
      scheduleAt: campaignData.scheduleAt || null,
      recurringDays: campaignData.recurringDays || null,
    },
  });
}

/**
 * Clean up test data
 */
export async function cleanupTestData() {
  if (testShopId) {
    // Delete all related data
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

    // Delete shop
    await prisma.shop.delete({ where: { id: testShopId } });

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
  resetTestShop,
  wait,
  createTestRequest,
  createTestResponse,
  createTestNext,
};

