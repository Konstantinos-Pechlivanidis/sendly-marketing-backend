/**
 * Reports Endpoints Tests
 * Comprehensive tests for all reporting endpoints
 */

import request from 'supertest';
import app from '../../app.js';
import {
  createTestShop,
  cleanupTestData,
  createTestHeaders,
  createTestCampaign,
  createTestContact,
} from '../helpers/test-utils.js';
import prisma from '../../services/prisma.js';

describe('Reports Endpoints', () => {
  let testShop;
  // eslint-disable-next-line no-unused-vars
  let testShopId;
  let testHeaders;

  beforeAll(async () => {
    testShop = await createTestShop({
      shopDomain: 'reports-test.myshopify.com',
    });
    testShopId = testShop.id;
    testHeaders = createTestHeaders(testShop.shopDomain);
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('GET /reports/overview', () => {
    beforeEach(async () => {
      // Create test data
      await createTestCampaign({ name: 'Campaign 1', status: 'sent' });
      await createTestContact({ phoneE164: '+306977111111', smsConsent: 'opted_in' });

      // Create metrics
      const campaign = await prisma.campaign.findFirst({
        where: { shopId: testShopId },
      });

      if (campaign) {
        await prisma.campaignMetrics.create({
          data: {
            campaignId: campaign.id,
            totalSent: 100,
            totalDelivered: 95,
            totalFailed: 5,
          },
        });
      }
    });

    it('should return reports overview', async () => {
      const res = await request(app)
        .get('/reports/overview')
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('sms');
      expect(res.body.data).toHaveProperty('campaigns');
      expect(res.body.data).toHaveProperty('contacts');
    });
  });

  describe('GET /reports/kpis', () => {
    it('should return KPI metrics', async () => {
      const res = await request(app)
        .get('/reports/kpis')
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('deliveryRate');
      expect(res.body.data).toHaveProperty('totalSent');
      expect(res.body.data).toHaveProperty('totalDelivered');
    });
  });

  describe('GET /reports/campaigns', () => {
    beforeEach(async () => {
      await createTestCampaign({ name: 'Report Campaign 1', status: 'sent' });
      await createTestCampaign({ name: 'Report Campaign 2', status: 'draft' });
    });

    it('should return campaign reports', async () => {
      const res = await request(app)
        .get('/reports/campaigns')
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('campaigns');
      expect(Array.isArray(res.body.data.campaigns)).toBe(true);
    });

    it('should filter campaigns by date range', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const endDate = new Date();

      const res = await request(app)
        .get(`/reports/campaigns?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /reports/campaigns/:id', () => {
    let campaignId;

    beforeEach(async () => {
      const campaign = await createTestCampaign({
        name: 'Detailed Campaign Report',
        status: 'sent',
      });
      campaignId = campaign.id;

      await prisma.campaignMetrics.create({
        data: {
          campaignId,
          totalSent: 200,
          totalDelivered: 190,
          totalFailed: 10,
        },
      });
    });

    it('should return detailed campaign report', async () => {
      const res = await request(app)
        .get(`/reports/campaigns/${campaignId}`)
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('campaign');
      expect(res.body.data).toHaveProperty('metrics');
      expect(res.body.data.metrics).toHaveProperty('sent', 200);
      expect(res.body.data.metrics).toHaveProperty('delivered', 190);
      expect(res.body.data.metrics).toHaveProperty('failed', 10);
    });
  });

  describe('GET /reports/automations', () => {
    beforeEach(async () => {
      // Create automation logs
      await prisma.automationLog.create({
        data: {
          storeId: testShopId,
          automationType: 'abandoned_cart',
          status: 'sent',
          recipientCount: 5,
        },
      });
    });

    it('should return automation reports', async () => {
      const res = await request(app)
        .get('/reports/automations')
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('automations');
    });
  });

  describe('GET /reports/messaging', () => {
    beforeEach(async () => {
      // Create message logs
      await prisma.messageLog.createMany({
        data: [
          {
            shopId: testShopId,
            phoneE164: '+306977111111',
            status: 'sent',
            messageType: 'campaign',
          },
          {
            shopId: testShopId,
            phoneE164: '+306977222222',
            status: 'delivered',
            messageType: 'automation',
          },
        ],
      });
    });

    it('should return messaging reports', async () => {
      const res = await request(app)
        .get('/reports/messaging')
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('messages');
      expect(res.body.data).toHaveProperty('stats');
    });
  });

  describe('GET /reports/credits', () => {
    beforeEach(async () => {
      // Create wallet transactions
      await prisma.walletTransaction.createMany({
        data: [
          {
            shopId: testShopId,
            type: 'credit',
            amount: 100,
            description: 'Purchase',
          },
          {
            shopId: testShopId,
            type: 'debit',
            amount: -50,
            description: 'SMS sent',
          },
        ],
      });
    });

    it('should return credit reports', async () => {
      const res = await request(app)
        .get('/reports/credits')
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('transactions');
      expect(res.body.data).toHaveProperty('summary');
    });
  });

  describe('GET /reports/contacts', () => {
    beforeEach(async () => {
      await createTestContact({ phoneE164: '+306977111111', smsConsent: 'opted_in', gender: 'male' });
      await createTestContact({ phoneE164: '+306977222222', smsConsent: 'opted_in', gender: 'female' });
      await createTestContact({ phoneE164: '+306977333333', smsConsent: 'opted_out' });
    });

    it('should return contact reports', async () => {
      const res = await request(app)
        .get('/reports/contacts')
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('total');
      expect(res.body.data).toHaveProperty('byConsent');
      expect(res.body.data).toHaveProperty('byGender');
    });
  });

  describe('GET /reports/export', () => {
    it('should export reports data', async () => {
      const res = await request(app)
        .get('/reports/export?type=campaigns')
        .set(testHeaders);

      expect(res.status).toBe(200);
      // Could be JSON or CSV depending on implementation
      expect(res.body).toBeTruthy();
    });

    it('should export with date filter', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const endDate = new Date();

      const res = await request(app)
        .get(`/reports/export?type=campaigns&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
        .set(testHeaders);

      expect(res.status).toBe(200);
    });
  });
});

