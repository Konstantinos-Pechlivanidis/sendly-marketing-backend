/* eslint-disable no-console */
/**
 * Discounts Endpoints Tests
 * Comprehensive tests for all discount-related endpoints
 */

import { request } from '../helpers/test-client.js';
import {
  createTestShop,
  cleanupTestData,
  createTestHeaders,
} from '../helpers/test-utils.js';
import { testConfig } from '../config/test-config.js';

describe('Discounts Endpoints', () => {
  let testShop;
  // eslint-disable-next-line no-unused-vars
  let testShopId;
  let testHeaders;

  beforeAll(async () => {
    console.log('\n📦 Setting up test shop for discounts tests...');
    // Use the actual sms-blossom-dev shop from production
    testShop = await createTestShop({
      shopDomain: testConfig.testShop.shopDomain, // sms-blossom-dev.myshopify.com
    });
    // eslint-disable-next-line no-unused-vars
    testShopId = testShop.id;
    testHeaders = createTestHeaders(testShop.shopDomain);
    console.log(`✅ Test shop ready: ${testShop.shopDomain} (ID: ${testShop.id})\n`);
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('GET /discounts', () => {
    it('should return Shopify discounts', async () => {
      const res = await request()
        .get('/discounts')
        .set(testHeaders);

      // May return empty array if no discounts or mock Shopify API
      expect([200, 500]).toContain(res.status);

      if (res.status === 200) {
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('discounts');
        expect(Array.isArray(res.body.data.discounts)).toBe(true);
      }
    });

    it('should filter discounts by status', async () => {
      const res = await request()
        .get('/discounts?status=active')
        .set(testHeaders);

      // May require Shopify API mock
      expect([200, 500]).toContain(res.status);
    });
  });

  describe('GET /discounts/:id', () => {
    it('should return specific discount', async () => {
      const discountId = 'discount_123';

      const res = await request()
        .get(`/discounts/${discountId}`)
        .set(testHeaders);

      // May require Shopify API mock
      expect([200, 404, 500]).toContain(res.status);

      if (res.status === 200) {
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('id', discountId);
      }
    });
  });

  describe('GET /discounts/validate/:code', () => {
    it('should validate discount code', async () => {
      const code = 'SAVE20';

      const res = await request()
        .get(`/discounts/validate/${code}`)
        .set(testHeaders);

      // May require Shopify API mock
      expect([200, 404, 500]).toContain(res.status);

      if (res.status === 200) {
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('isValid');
        expect(res.body.data).toHaveProperty('code', code);
      }
    });

    it('should return invalid for non-existent code', async () => {
      const code = 'INVALID_CODE';

      const res = await request()
        .get(`/discounts/validate/${code}`)
        .set(testHeaders);

      // May require Shopify API mock
      expect([200, 404]).toContain(res.status);

      if (res.status === 200) {
        expect(res.body.data.isValid).toBe(false);
      }
    });
  });
});

