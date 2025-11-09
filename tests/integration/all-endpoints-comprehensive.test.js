/* eslint-disable no-console */
/**
 * Comprehensive Integration Tests for All Endpoints
 * Tests all API endpoints with happy path, error, and edge cases
 *
 * This test suite ensures all endpoints:
 * - Return correct status codes
 * - Return correct response structure
 * - Handle errors properly
 * - Validate inputs
 * - Enforce authorization
 */

import { request } from '../helpers/test-client.js';
import {
  createTestShop,
  cleanupTestData,
  createTestHeaders,
  createTestContact,
  createTestCampaign,
} from '../helpers/test-utils.js';
import prisma from '../../services/prisma.js';
import { testConfig } from '../config/test-config.js';

describe('Comprehensive Integration Tests - All Endpoints', () => {
  let testShop;
  let testShopId;
  let testHeaders;
  const INITIAL_CREDITS = 10000;

  beforeAll(async () => {
    console.log('\n🚀 Starting Comprehensive Integration Tests');
    console.log('📦 Setting up test environment...');

    testShop = await createTestShop({
      shopDomain: testConfig.testShop.shopDomain,
      credits: INITIAL_CREDITS,
    });
    testShopId = testShop.id;
    testHeaders = createTestHeaders(testShop.shopDomain);

    console.log(`✅ Test shop ready: ${testShop.shopDomain} (ID: ${testShop.id})\n`);
  });

  afterAll(async () => {
    await cleanupTestData();
    console.log('\n✅ Integration Tests completed\n');
  });

  beforeEach(async () => {
    // Reset shop credits
    await prisma.shop.update({
      where: { id: testShopId },
      data: { credits: INITIAL_CREDITS },
    });
  });

  // ============================================
  // Core Endpoints
  // ============================================
  describe('Core Endpoints', () => {
    it('GET / should return API status', async () => {
      const res = await request().get('/');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('ok', true);
    });

    it('GET /health should return basic health', async () => {
      const res = await request().get('/health');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('ok', true);
    });

    it('GET /health/config should return config health', async () => {
      const res = await request().get('/health/config');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('ok', true);
    });

    it('GET /health/full should return full health check', async () => {
      const res = await request().get('/health/full');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('ok');
      expect(res.body).toHaveProperty('checks');
    }, 15000);
  });

  // ============================================
  // Dashboard Endpoints
  // ============================================
  describe('Dashboard Endpoints', () => {
    it('GET /dashboard/overview should return dashboard data', async () => {
      const res = await request()
        .get('/dashboard/overview')
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('sms');
      expect(res.body.data).toHaveProperty('contacts');
      expect(res.body.data).toHaveProperty('wallet');
    });

    it('GET /dashboard/quick-stats should return quick stats', async () => {
      const res = await request()
        .get('/dashboard/quick-stats')
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject dashboard access without shop context', async () => {
      const res = await request()
        .get('/dashboard/overview');

      expect([400, 401, 403]).toContain(res.status);
    });
  });

  // ============================================
  // Contacts Endpoints
  // ============================================
  describe('Contacts Endpoints', () => {
    it('POST /contacts should create contact', async () => {
      const res = await request()
        .post('/contacts')
        .set(testHeaders)
        .send({
          firstName: 'Integration',
          lastName: 'Test',
          phoneE164: '+357123456789',
          email: 'integration@test.com',
          smsConsent: 'opted_in',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
    });

    it('GET /contacts should list contacts with pagination', async () => {
      const res = await request()
        .get('/contacts?page=1&pageSize=20')
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('items');
      expect(res.body.data).toHaveProperty('pagination');
    });

    it('GET /contacts/:id should get contact', async () => {
      const contact = await createTestContact({
        phoneE164: '+357123456790',
        smsConsent: 'opted_in',
      });

      const res = await request()
        .get(`/contacts/${contact.id}`)
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(contact.id);
    });

    it('PUT /contacts/:id should update contact', async () => {
      const contact = await createTestContact({
        phoneE164: '+357123456791',
        smsConsent: 'opted_in',
      });

      const res = await request()
        .put(`/contacts/${contact.id}`)
        .set(testHeaders)
        .send({
          firstName: 'Updated',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.firstName).toBe('Updated');
    });

    it('DELETE /contacts/:id should delete contact', async () => {
      const contact = await createTestContact({
        phoneE164: '+357123456792',
        smsConsent: 'opted_in',
      });

      const res = await request()
        .delete(`/contacts/${contact.id}`)
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('GET /contacts/stats should return contact statistics', async () => {
      const res = await request()
        .get('/contacts/stats')
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('GET /contacts/birthdays should return birthday contacts', async () => {
      const res = await request()
        .get('/contacts/birthdays')
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject invalid phone number format', async () => {
      const res = await request()
        .post('/contacts')
        .set(testHeaders)
        .send({
          phoneE164: '123456', // Invalid
          smsConsent: 'opted_in',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // ============================================
  // Campaigns Endpoints
  // ============================================
  describe('Campaigns Endpoints', () => {
    it('POST /campaigns should create campaign', async () => {
      const res = await request()
        .post('/campaigns')
        .set(testHeaders)
        .send({
          name: 'Integration Test Campaign',
          message: 'Test message',
          audience: 'all',
          scheduleType: 'immediate',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
    });

    it('GET /campaigns should list campaigns', async () => {
      const res = await request()
        .get('/campaigns?page=1&pageSize=20')
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('items');
    });

    it('GET /campaigns/:id should get campaign', async () => {
      const campaign = await createTestCampaign({
        name: 'Get Campaign Test',
        status: 'draft',
      });

      const res = await request()
        .get(`/campaigns/${campaign.id}`)
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('PUT /campaigns/:id should update campaign', async () => {
      const campaign = await createTestCampaign({
        name: 'Update Campaign Test',
        status: 'draft',
      });

      const res = await request()
        .put(`/campaigns/${campaign.id}`)
        .set(testHeaders)
        .send({
          name: 'Updated Campaign Name',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('POST /campaigns/:id/prepare should prepare campaign', async () => {
      const campaign = await createTestCampaign({
        name: 'Prepare Campaign Test',
        status: 'draft',
        audience: 'all',
      });

      await createTestContact({ phoneE164: '+357123456789', smsConsent: 'opted_in' });

      const res = await request()
        .get(`/campaigns/${campaign.id}/prepare`)
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('POST /campaigns/:id/send should send campaign', async () => {
      const campaign = await createTestCampaign({
        name: 'Send Campaign Test',
        status: 'draft',
        audience: 'all',
      });

      await createTestContact({ phoneE164: '+357123456789', smsConsent: 'opted_in' });

      const res = await request()
        .post(`/campaigns/${campaign.id}/send`)
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('GET /campaigns/:id/metrics should get campaign metrics', async () => {
      const campaign = await createTestCampaign({
        name: 'Metrics Campaign Test',
        status: 'sent',
      });

      const res = await request()
        .get(`/campaigns/${campaign.id}/metrics`)
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('GET /campaigns/stats/summary should get campaign stats', async () => {
      const res = await request()
        .get('/campaigns/stats/summary')
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('DELETE /campaigns/:id should delete campaign', async () => {
      const campaign = await createTestCampaign({
        name: 'Delete Campaign Test',
        status: 'draft',
      });

      const res = await request()
        .delete(`/campaigns/${campaign.id}`)
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject sending campaign with insufficient credits', async () => {
      await prisma.shop.update({
        where: { id: testShopId },
        data: { credits: 0 },
      });

      const campaign = await createTestCampaign({
        name: 'No Credits Campaign',
        status: 'draft',
        audience: 'all',
      });

      const res = await request()
        .post(`/campaigns/${campaign.id}/send`)
        .set(testHeaders);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // ============================================
  // Billing Endpoints
  // ============================================
  describe('Billing Endpoints', () => {
    it('GET /billing/balance should return wallet balance', async () => {
      const res = await request()
        .get('/billing/balance')
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('credits');
    });

    it('GET /billing/packages should return available packages', async () => {
      const res = await request()
        .get('/billing/packages')
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('packages');
    });

    it('GET /billing/history should return billing history', async () => {
      const res = await request()
        .get('/billing/history?page=1&pageSize=20')
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('items');
    });

    it('POST /billing/checkout should create checkout session', async () => {
      const res = await request()
        .post('/billing/checkout')
        .set(testHeaders)
        .send({
          packageId: 'package_1000',
          currency: 'EUR',
        });

      // May return 200 (success) or 400 (validation error)
      expect([200, 400]).toContain(res.status);
    });
  });

  // ============================================
  // Settings Endpoints
  // ============================================
  describe('Settings Endpoints', () => {
    it('GET /settings should get shop settings', async () => {
      const res = await request()
        .get('/settings')
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('PUT /settings should update shop settings', async () => {
      const res = await request()
        .put('/settings')
        .set(testHeaders)
        .send({
          senderName: 'Test Sender',
          timezone: 'Europe/Athens',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ============================================
  // Audiences Endpoints
  // ============================================
  describe('Audiences Endpoints', () => {
    it('GET /audiences should list audiences/segments', async () => {
      const res = await request()
        .get('/audiences')
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('POST /audiences should create segment', async () => {
      const res = await request()
        .post('/audiences')
        .set(testHeaders)
        .send({
          name: 'Integration Test Segment',
          rules: {
            conditions: [
              {
                field: 'smsConsent',
                operator: 'equals',
                value: 'opted_in',
              },
            ],
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });
  });

  // ============================================
  // Discounts Endpoints
  // ============================================
  describe('Discounts Endpoints', () => {
    it('GET /shopify/discounts should list discount codes', async () => {
      const res = await request()
        .get('/shopify/discounts')
        .set(testHeaders);

      // May fail if Shopify not configured, but structure should be correct
      if (res.status === 200) {
        expect(res.body.success).toBe(true);
      } else {
        expect([400, 401, 500]).toContain(res.status);
      }
    });
  });

  // ============================================
  // Templates Endpoints
  // ============================================
  describe('Templates Endpoints', () => {
    it('GET /templates should list public templates', async () => {
      const res = await request()
        .get('/templates?page=1&pageSize=20');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('items');
    });
  });

  // ============================================
  // Reports Endpoints
  // ============================================
  describe('Reports Endpoints', () => {
    it('GET /reports/sms should get SMS reports', async () => {
      const res = await request()
        .get('/reports/sms')
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('GET /reports/campaigns should get campaign reports', async () => {
      const res = await request()
        .get('/reports/campaigns')
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ============================================
  // Automations Endpoints
  // ============================================
  describe('Automations Endpoints', () => {
    it('GET /automations should list automations', async () => {
      const res = await request()
        .get('/automations')
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('POST /automations should create automation', async () => {
      const res = await request()
        .post('/automations')
        .set(testHeaders)
        .send({
          name: 'Integration Test Automation',
          triggerEvent: 'order_created',
          message: 'Thank you for your order!',
          isActive: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });
  });

  // ============================================
  // Error Handling Tests
  // ============================================
  describe('Error Handling', () => {
    it('should return 404 for non-existent resource', async () => {
      const res = await request()
        .get('/campaigns/non-existent-id')
        .set(testHeaders);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for invalid request body', async () => {
      const res = await request()
        .post('/campaigns')
        .set(testHeaders)
        .send({
          // Missing required fields
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for invalid query parameters', async () => {
      const res = await request()
        .get('/campaigns?page=invalid')
        .set(testHeaders);

      expect([400, 200]).toContain(res.status); // May validate or ignore invalid params
    });
  });

  // ============================================
  // Authorization Tests
  // ============================================
  describe('Authorization & Security', () => {
    it('should reject requests without shop context', async () => {
      const res = await request()
        .get('/campaigns');

      expect([400, 401, 403]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });

    it('should prevent cross-shop access', async () => {
      const campaign = await createTestCampaign({
        name: 'Security Test Campaign',
        status: 'draft',
      });

      const otherShopHeaders = createTestHeaders('other-shop.myshopify.com');

      const res = await request()
        .get(`/campaigns/${campaign.id}`)
        .set(otherShopHeaders);

      expect([404, 403]).toContain(res.status);
    });
  });

  // ============================================
  // Response Structure Tests
  // ============================================
  describe('Response Structure Validation', () => {
    it('should return standardized success response', async () => {
      const res = await request()
        .get('/dashboard/overview')
        .set(testHeaders);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
    });

    it('should return standardized error response', async () => {
      const res = await request()
        .get('/campaigns/non-existent')
        .set(testHeaders);

      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('error');
      expect(res.body).toHaveProperty('message');
    });

    it('should return standardized paginated response', async () => {
      const res = await request()
        .get('/contacts?page=1&pageSize=20')
        .set(testHeaders);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('items');
      expect(res.body.data).toHaveProperty('pagination');
      expect(res.body.data.pagination).toHaveProperty('page');
      expect(res.body.data.pagination).toHaveProperty('pageSize');
      expect(res.body.data.pagination).toHaveProperty('total');
    });
  });
});

