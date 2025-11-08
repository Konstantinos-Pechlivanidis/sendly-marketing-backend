/**
 * Response Structure Validation Tests
 * Verifies that all endpoint responses match expected structure
 */

import request from 'supertest';
import app from '../../app.js';
import {
  createTestShop,
  cleanupTestData,
  createTestHeaders,
  createTestContact,
  createTestCampaign,
} from '../helpers/test-utils.js';
import { validateApiResponse, expectedResponses } from '../helpers/response-validator.js';

describe('Response Structure Validation', () => {
  let testShop;
  // eslint-disable-next-line no-unused-vars
  let testShopId;
  let testHeaders;

  beforeAll(async () => {
    testShop = await createTestShop({
      shopDomain: 'structure-test.myshopify.com',
      credits: 1000,
    });
    // eslint-disable-next-line no-unused-vars
    testShopId = testShop.id;
    testHeaders = createTestHeaders(testShop.shopDomain);
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('Dashboard Responses', () => {
    it('GET /dashboard/overview should match expected structure', async () => {
      const res = await request(app)
        .get('/dashboard/overview')
        .set(testHeaders);

      expect(res.status).toBe(200);
      validateApiResponse(res, expectedResponses.dashboard.overview);
    });

    it('GET /dashboard/quick-stats should match expected structure', async () => {
      const res = await request(app)
        .get('/dashboard/quick-stats')
        .set(testHeaders);

      expect(res.status).toBe(200);
      validateApiResponse(res, expectedResponses.dashboard.quickStats);
    });
  });

  describe('Contacts Responses', () => {
    beforeEach(async () => {
      await createTestContact({
        phoneE164: '+306977111111',
        firstName: 'Test',
        smsConsent: 'opted_in',
      });
    });

    it('GET /contacts should match expected structure', async () => {
      const res = await request(app)
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

      const res = await request(app)
        .get(`/contacts/${contact.id}`)
        .set(testHeaders);

      expect(res.status).toBe(200);
      validateApiResponse(res, expectedResponses.contacts.getOne);
    });

    it('POST /contacts should match expected structure', async () => {
      const contactData = {
        phoneE164: '+306977333333',
        firstName: 'New',
        smsConsent: 'opted_in',
      };

      const res = await request(app)
        .post('/contacts')
        .set(testHeaders)
        .send(contactData);

      expect(res.status).toBe(201);
      validateApiResponse(res, expectedResponses.contacts.create);
    });

    it('GET /contacts/stats should match expected structure', async () => {
      const res = await request(app)
        .get('/contacts/stats')
        .set(testHeaders);

      expect(res.status).toBe(200);
      validateApiResponse(res, expectedResponses.contacts.stats);
    });
  });

  describe('Campaigns Responses', () => {
    beforeEach(async () => {
      await createTestCampaign({
        name: 'Test Campaign',
        message: 'Test message',
        status: 'draft',
      });
    });

    it('GET /campaigns should match expected structure', async () => {
      const res = await request(app)
        .get('/campaigns?page=1&pageSize=10')
        .set(testHeaders);

      expect(res.status).toBe(200);
      validateApiResponse(res, expectedResponses.campaigns.list);
    });

    it('GET /campaigns/:id should match expected structure', async () => {
      const campaign = await createTestCampaign({
        name: 'Test Campaign 2',
        message: 'Test',
      });

      const res = await request(app)
        .get(`/campaigns/${campaign.id}`)
        .set(testHeaders);

      expect(res.status).toBe(200);
      validateApiResponse(res, expectedResponses.campaigns.getOne);
    });

    it('POST /campaigns should match expected structure', async () => {
      const campaignData = {
        name: 'New Campaign',
        message: 'New message',
        audience: 'all',
        scheduleType: 'immediate',
      };

      const res = await request(app)
        .post('/campaigns')
        .set(testHeaders)
        .send(campaignData);

      expect(res.status).toBe(201);
      validateApiResponse(res, expectedResponses.campaigns.create);
    });
  });

  describe('Billing Responses', () => {
    it('GET /billing/balance should match expected structure', async () => {
      const res = await request(app)
        .get('/billing/balance')
        .set(testHeaders);

      expect(res.status).toBe(200);
      validateApiResponse(res, expectedResponses.billing.balance);
    });

    it('GET /billing/packages should match expected structure', async () => {
      const res = await request(app)
        .get('/billing/packages')
        .set(testHeaders);

      expect(res.status).toBe(200);
      validateApiResponse(res, expectedResponses.billing.packages);
    });

    it('GET /billing/history should match expected structure', async () => {
      const res = await request(app)
        .get('/billing/history?page=1&pageSize=10')
        .set(testHeaders);

      expect(res.status).toBe(200);
      validateApiResponse(res, expectedResponses.billing.history);
    });
  });

  describe('Reports Responses', () => {
    it('GET /reports/overview should match expected structure', async () => {
      const res = await request(app)
        .get('/reports/overview')
        .set(testHeaders);

      expect(res.status).toBe(200);
      validateApiResponse(res, expectedResponses.reports.overview);
    });

    it('GET /reports/kpis should match expected structure', async () => {
      const res = await request(app)
        .get('/reports/kpis')
        .set(testHeaders);

      expect(res.status).toBe(200);
      validateApiResponse(res, expectedResponses.reports.kpis);
    });
  });

  describe('Settings Responses', () => {
    it('GET /settings should match expected structure', async () => {
      const res = await request(app)
        .get('/settings')
        .set(testHeaders);

      expect(res.status).toBe(200);
      validateApiResponse(res, expectedResponses.settings.get);
    });

    it('GET /settings/account should match expected structure', async () => {
      const res = await request(app)
        .get('/settings/account')
        .set(testHeaders);

      expect(res.status).toBe(200);
      validateApiResponse(res, expectedResponses.settings.account);
    });
  });

  describe('Error Response Structure', () => {
    it('should return proper error structure for 404', async () => {
      const res = await request(app)
        .get('/contacts/non-existent-id')
        .set(testHeaders);

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('error');
      expect(res.body).toHaveProperty('message');
    });

    it('should return proper error structure for 400 validation', async () => {
      const res = await request(app)
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

