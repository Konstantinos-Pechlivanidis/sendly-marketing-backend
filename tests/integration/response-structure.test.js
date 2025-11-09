/* eslint-disable no-console */
/**
 * Response Structure Validation Tests
 * Verifies that all endpoint responses match expected structure
 */

import { request } from '../helpers/test-client.js';
import {
  createTestShop,
  cleanupTestData,
  createTestHeaders,
  createTestContact,
  createTestCampaign,
} from '../helpers/test-utils.js';
import { validateApiResponse, expectedResponses } from '../helpers/response-validator.js';
import { testConfig } from '../config/test-config.js';

describe('Response Structure Validation', () => {
  let testShop;
  // eslint-disable-next-line no-unused-vars
  let testShopId;
  let testHeaders;

  beforeAll(async () => {
    console.log('\n📦 Setting up test shop for response structure tests...');
    // Use the actual sms-blossom-dev shop from production
    testShop = await createTestShop({
      shopDomain: testConfig.testShop.shopDomain, // sms-blossom-dev.myshopify.com
      credits: testConfig.testShop.credits,
    });
    // eslint-disable-next-line no-unused-vars
    testShopId = testShop.id;
    testHeaders = createTestHeaders(testShop.shopDomain);
    console.log(`✅ Test shop ready: ${testShop.shopDomain} (ID: ${testShop.id})\n`);
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('Dashboard Responses', () => {
    it('GET /dashboard/overview should match expected structure', async () => {
      const res = await request()
        .get('/dashboard/overview')
        .set(testHeaders);

      expect(res.status).toBe(200);
      validateApiResponse(res, expectedResponses.dashboard.overview);
    });

    it('GET /dashboard/quick-stats should match expected structure', async () => {
      const res = await request()
        .get('/dashboard/quick-stats')
        .set(testHeaders);

      expect(res.status).toBe(200);
      validateApiResponse(res, expectedResponses.dashboard.quickStats);
    });
  });

  describe('Contacts Responses', () => {
    beforeEach(async () => {
      await cleanupTestData();
      const timestamp = Date.now();
      await createTestContact({
        phoneE164: `+306977${String(timestamp).slice(-6)}`,
        firstName: 'Test',
        smsConsent: 'opted_in',
      });
    });

    it('GET /contacts should match expected structure', async () => {
      const res = await request()
        .get('/contacts?page=1&pageSize=10')
        .set(testHeaders);

      expect(res.status).toBe(200);
      validateApiResponse(res, expectedResponses.contacts.list);
    });

    it('GET /contacts/:id should match expected structure', async () => {
      const contact = await createTestContact({
        phoneE164: '+306977222222',
        firstName: 'Test2',
      });

      const res = await request()
        .get(`/contacts/${contact.id}`)
        .set(testHeaders);

      expect(res.status).toBe(200);
      validateApiResponse(res, expectedResponses.contacts.getOne);
    });

    it('POST /contacts should match expected structure', async () => {
      const timestamp = Date.now();
      const contactData = {
        phoneE164: `+306977${String(timestamp + 2).slice(-6)}`,
        firstName: 'New',
        smsConsent: 'opted_in',
      };

      const res = await request()
        .post('/contacts')
        .set(testHeaders)
        .send(contactData);

      expect(res.status).toBe(201);
      validateApiResponse(res, expectedResponses.contacts.create);
    });

    it('GET /contacts/stats should match expected structure', async () => {
      const res = await request()
        .get('/contacts/stats')
        .set(testHeaders);

      expect(res.status).toBe(200);
      validateApiResponse(res, expectedResponses.contacts.stats);
    });
  });

  describe('Campaigns Responses', () => {
    beforeEach(async () => {
      await cleanupTestData();
      const timestamp = Date.now();
      await createTestCampaign({
        name: `TEST_Test Campaign ${timestamp}`,
        message: 'Test message',
        status: 'draft',
      });
    });

    it('GET /campaigns should match expected structure', async () => {
      const res = await request()
        .get('/campaigns?page=1&pageSize=10')
        .set(testHeaders);

      expect(res.status).toBe(200);
      validateApiResponse(res, expectedResponses.campaigns.list);
    });

    it('GET /campaigns/:id should match expected structure', async () => {
      const timestamp = Date.now();
      const campaign = await createTestCampaign({
        name: `TEST_Test Campaign 2 ${timestamp}`,
        message: 'Test',
      });

      const res = await request()
        .get(`/campaigns/${campaign.id}`)
        .set(testHeaders);

      expect(res.status).toBe(200);
      validateApiResponse(res, expectedResponses.campaigns.getOne);
    });

    it('POST /campaigns should match expected structure', async () => {
      const timestamp = Date.now();
      const campaignData = {
        name: `TEST_New Campaign ${timestamp}`,
        message: 'New message',
        audience: 'all',
        scheduleType: 'immediate',
      };

      const res = await request()
        .post('/campaigns')
        .set(testHeaders)
        .send(campaignData);

      expect(res.status).toBe(201);
      validateApiResponse(res, expectedResponses.campaigns.create);
    });
  });

  describe('Billing Responses', () => {
    it('GET /billing/balance should match expected structure', async () => {
      const res = await request()
        .get('/billing/balance')
        .set(testHeaders);

      expect(res.status).toBe(200);
      validateApiResponse(res, expectedResponses.billing.balance);
    });

    it('GET /billing/packages should match expected structure', async () => {
      const res = await request()
        .get('/billing/packages')
        .set(testHeaders);

      expect(res.status).toBe(200);
      validateApiResponse(res, expectedResponses.billing.packages);
    });

    it('GET /billing/history should match expected structure', async () => {
      const res = await request()
        .get('/billing/history?page=1&pageSize=10')
        .set(testHeaders);

      expect(res.status).toBe(200);
      validateApiResponse(res, expectedResponses.billing.history);
    });
  });

  describe('Reports Responses', () => {
    it('GET /reports/overview should match expected structure', async () => {
      const res = await request()
        .get('/reports/overview')
        .set(testHeaders);

      expect(res.status).toBe(200);
      validateApiResponse(res, expectedResponses.reports.overview);
    });

    it('GET /reports/kpis should match expected structure', async () => {
      const res = await request()
        .get('/reports/kpis')
        .set(testHeaders);

      expect(res.status).toBe(200);
      validateApiResponse(res, expectedResponses.reports.kpis);
    });
  });

  describe('Settings Responses', () => {
    it('GET /settings should match expected structure', async () => {
      const res = await request()
        .get('/settings')
        .set(testHeaders);

      expect(res.status).toBe(200);
      validateApiResponse(res, expectedResponses.settings.get);
    });

    it('GET /settings/account should match expected structure', async () => {
      const res = await request()
        .get('/settings/account')
        .set(testHeaders);

      expect(res.status).toBe(200);
      validateApiResponse(res, expectedResponses.settings.account);
    });
  });

  describe('Error Response Structure', () => {
    it('should return proper error structure for 404', async () => {
      const res = await request()
        .get('/contacts/non-existent-id')
        .set(testHeaders);

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('error');
      expect(res.body).toHaveProperty('message');
    });

    it('should return proper error structure for 400 validation', async () => {
      const res = await request()
        .post('/contacts')
        .set(testHeaders)
        .send({
          phoneE164: 'invalid-phone', // Invalid format
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('error');
      expect(res.body).toHaveProperty('message');
    });
  });
});

