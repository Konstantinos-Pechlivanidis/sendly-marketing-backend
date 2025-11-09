/* eslint-disable no-console */
/**
 * Dashboard Endpoints Tests
 * Tests all dashboard-related endpoints
 */

import { request } from '../helpers/test-client.js';
import {
  createTestShop,
  cleanupTestData,
  cleanupBeforeTest,
  createTestHeaders,
} from '../helpers/test-utils.js';
// import { verifyShopCredits } from '../helpers/test-db.js'; // Available for future use
import prisma from '../../services/prisma.js';
import { testConfig } from '../config/test-config.js';

describe('Dashboard Endpoints', () => {
  let testShop;
  let testShopId;
  let testHeaders;

  beforeAll(async () => {
    console.log('\n📦 Setting up test shop for dashboard tests...');
    // Use the actual sms-blossom-dev shop from production
    testShop = await createTestShop({
      shopDomain: testConfig.testShop.shopDomain, // sms-blossom-dev.myshopify.com
      credits: testConfig.testShop.credits,
    });
    testShopId = testShop.id;
    testHeaders = createTestHeaders(testShop.shopDomain);
    console.log(`✅ Test shop ready: ${testShop.shopDomain} (ID: ${testShop.id})\n`);
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('GET /dashboard/overview', () => {
    it('should return dashboard overview with all statistics', async () => {
      await cleanupBeforeTest();
      const timestamp = Date.now();
      // Create some test data with unique phones
      await prisma.contact.createMany({
        data: [
          {
            shopId: testShopId,
            phoneE164: `+306977${String(timestamp).slice(-6)}`,
            smsConsent: 'opted_in',
            firstName: 'TEST_John',
            lastName: 'Doe',
          },
          {
            shopId: testShopId,
            phoneE164: `+306977${String(timestamp + 1).slice(-6)}`,
            smsConsent: 'opted_in',
            firstName: 'TEST_Jane',
            lastName: 'Smith',
          },
        ],
      });

      const res = await request()
        .get('/dashboard/overview')
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('sms');
      expect(res.body.data).toHaveProperty('contacts');
      expect(res.body.data).toHaveProperty('wallet');

      // Verify wallet balance
      expect(res.body.data.wallet.balance).toBe(500);
      expect(res.body.data.wallet.currency).toBe('EUR');

      // Verify contacts count
      expect(res.body.data.contacts.total).toBeGreaterThanOrEqual(2);
    });

    it('should return dashboard overview even with no data', async () => {
      // Create a new shop with no data
      // Use same shop - will test with existing data
      const emptyShop = await createTestShop({
        shopDomain: testConfig.testShop.shopDomain, // sms-blossom-dev.myshopify.com
        credits: 0,
      });

      const res = await request()
        .get('/dashboard/overview')
        .set(createTestHeaders(emptyShop.shopDomain));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.wallet.balance).toBe(0);

      // Cleanup
      await prisma.shop.delete({ where: { id: emptyShop.id } });
    });
  });

  describe('GET /dashboard/quick-stats', () => {
    it('should return quick statistics', async () => {
      const res = await request()
        .get('/dashboard/quick-stats')
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('smsSent');
      expect(res.body.data).toHaveProperty('walletBalance');
      expect(res.body.data.walletBalance).toBe(500);
    });

    it('should return quick stats with correct data types', async () => {
      const res = await request()
        .get('/dashboard/quick-stats')
        .set(testHeaders);

      expect(typeof res.body.data.smsSent).toBe('number');
      expect(typeof res.body.data.walletBalance).toBe('number');
    });
  });

  describe('Error Handling', () => {
    it('should return 401 if store context is missing', async () => {
      const res = await request()
        .get('/dashboard/overview')
        .set({
          'Content-Type': 'application/json',
          // Missing X-Shopify-Shop-Domain
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 if shop domain is invalid', async () => {
      const res = await request()
        .get('/dashboard/overview')
        .set({
          'Authorization': 'Bearer test_token',
          'X-Shopify-Shop-Domain': 'invalid-shop.com',
        });

      expect(res.status).toBe(401);
    });
  });
});

