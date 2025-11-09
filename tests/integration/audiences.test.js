/* eslint-disable no-console */
/**
 * Audiences Endpoints Tests
 * Comprehensive tests for all audience-related endpoints
 */

import { request } from '../helpers/test-client.js';
import {
  createTestShop,
  cleanupTestData,
  cleanupBeforeTest,
  createTestHeaders,
  createTestContact,
} from '../helpers/test-utils.js';
import { testConfig } from '../config/test-config.js';
import prisma from '../../services/prisma.js';

describe('Audiences Endpoints', () => {
  let testShop;
  let testShopId;
  let testHeaders;

  beforeAll(async () => {
    console.log('\n📦 Setting up test shop for audiences tests...');
    // Use the actual sms-blossom-dev shop from production
    testShop = await createTestShop({
      shopDomain: testConfig.testShop.shopDomain, // sms-blossom-dev.myshopify.com
    });
    testShopId = testShop.id;
    testHeaders = createTestHeaders(testShop.shopDomain);
    console.log(`✅ Test shop ready: ${testShop.shopDomain} (ID: ${testShop.id})\n`);
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('GET /audiences', () => {
    beforeEach(async () => {
      await cleanupBeforeTest();
      const timestamp = Date.now();
      // Create contacts with different attributes and unique phones
      await createTestContact({
        phoneE164: `+306977${String(timestamp).slice(-6)}`,
        smsConsent: 'opted_in',
        gender: 'male',
      });
      await createTestContact({
        phoneE164: `+306977${String(timestamp + 1).slice(-6)}`,
        smsConsent: 'opted_in',
        gender: 'female',
      });
      await createTestContact({
        phoneE164: `+306977${String(timestamp + 2).slice(-6)}`,
        smsConsent: 'opted_out',
        gender: 'male',
      });
    });

    it('should return all available audiences', async () => {
      const res = await request()
        .get('/audiences')
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('audiences');
      expect(Array.isArray(res.body.data.audiences)).toBe(true);
      expect(res.body.data.audiences.length).toBeGreaterThan(0);
    });

    it('should include contact counts for each audience', async () => {
      const res = await request()
        .get('/audiences')
        .set(testHeaders);

      expect(res.status).toBe(200);

      const allAudience = res.body.data.audiences.find(a => a.id === 'all');
      expect(allAudience).toBeTruthy();
      expect(allAudience).toHaveProperty('contactCount');
      expect(allAudience.contactCount).toBeGreaterThan(0);
    });

    it('should include predefined audiences (men, women)', async () => {
      const res = await request()
        .get('/audiences')
        .set(testHeaders);

      expect(res.status).toBe(200);

      const menAudience = res.body.data.audiences.find(a => a.id === 'men');
      expect(menAudience).toBeTruthy();
      expect(menAudience).toHaveProperty('contactCount');

      const womenAudience = res.body.data.audiences.find(a => a.id === 'women');
      expect(womenAudience).toBeTruthy();
      expect(womenAudience).toHaveProperty('contactCount');
    });
  });

  describe('GET /audiences/:audienceId/details', () => {
    beforeEach(async () => {
      await cleanupBeforeTest();
      const timestamp = Date.now();
      // Create contacts for testing with unique phones
      await createTestContact({
        phoneE164: `+306977${String(timestamp).slice(-6)}`,
        smsConsent: 'opted_in',
        gender: 'male',
      });
      await createTestContact({
        phoneE164: `+306977${String(timestamp + 1).slice(-6)}`,
        smsConsent: 'opted_in',
        gender: 'female',
      });
    });

    it('should return detailed audience with contact list', async () => {
      const res = await request()
        .get('/audiences/all/details?page=1&limit=10')
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('audience');
      expect(res.body.data).toHaveProperty('contacts');
      expect(res.body.data).toHaveProperty('pagination');
      expect(Array.isArray(res.body.data.contacts)).toBe(true);
    });

    it('should return only opted-in contacts for "all" audience', async () => {
      const res = await request()
        .get('/audiences/all/details')
        .set(testHeaders);

      expect(res.status).toBe(200);

      res.body.data.contacts.forEach(contact => {
        expect(contact.smsConsent).toBe('opted_in');
      });
    });

    it('should return only male contacts for "men" audience', async () => {
      const res = await request()
        .get('/audiences/men/details')
        .set(testHeaders);

      expect(res.status).toBe(200);

      res.body.data.contacts.forEach(contact => {
        expect(contact.gender).toBe('male');
        expect(contact.smsConsent).toBe('opted_in');
      });
    });

    it('should respect pagination limits', async () => {
      const res = await request()
        .get('/audiences/all/details?page=1&limit=1')
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.data.contacts.length).toBeLessThanOrEqual(1);
      expect(res.body.data.pagination.limit).toBe(1);
    });
  });

  describe('POST /audiences/validate', () => {
    beforeEach(async () => {
      await cleanupBeforeTest();
      const timestamp = Date.now();
      await createTestContact({
        phoneE164: `+306977${String(timestamp).slice(-6)}`,
        smsConsent: 'opted_in',
      });
    });

    it('should validate predefined audience', async () => {
      const validationData = {
        audienceId: 'all',
      };

      const res = await request()
        .post('/audiences/validate')
        .set(testHeaders)
        .send(validationData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('audienceId', 'all');
      expect(res.body.data).toHaveProperty('contactCount');
      expect(res.body.data).toHaveProperty('isValid', true);
      expect(res.body.data.contactCount).toBeGreaterThan(0);
    });

    it('should validate segment audience', async () => {
      // Create segment
      const segment = await prisma.segment.create({
        data: {
          shopId: testShopId,
          name: 'Test Segment',
          description: 'Test segment',
        },
      });

      // Add contact to segment
      const contact = await prisma.contact.findFirst({
        where: { shopId: testShopId },
      });

      await prisma.segmentMembership.create({
        data: {
          segmentId: segment.id,
          contactId: contact.id,
        },
      });

      const validationData = {
        audienceId: `segment:${segment.id}`,
      };

      const res = await request()
        .post('/audiences/validate')
        .set(testHeaders)
        .send(validationData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isValid).toBe(true);
      expect(res.body.data.contactCount).toBeGreaterThan(0);
    });

    it('should return invalid for non-existent audience', async () => {
      const validationData = {
        audienceId: 'non-existent',
      };

      const res = await request()
        .post('/audiences/validate')
        .set(testHeaders)
        .send(validationData);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});

