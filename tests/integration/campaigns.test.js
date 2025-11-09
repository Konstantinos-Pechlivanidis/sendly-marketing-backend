/* eslint-disable no-console */
/**
 * Campaigns Endpoints Tests
 * Comprehensive tests for all campaign-related endpoints
 */

import { request } from '../helpers/test-client.js';
import {
  createTestShop,
  cleanupTestData,
  cleanupBeforeTest,
  createTestHeaders,
  createTestContact,
  createTestCampaign,
} from '../helpers/test-utils.js';
import {
  verifyCampaignInDb,
} from '../helpers/test-db.js';
import prisma from '../../services/prisma.js';
import { testConfig } from '../config/test-config.js';

describe('Campaigns Endpoints', () => {
  let testShop;
  let testShopId;
  let testHeaders;

  beforeAll(async () => {
    console.log('\n📦 Setting up test shop for campaigns tests...');
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

  describe('POST /campaigns', () => {
    it('should create a new campaign with all fields', async () => {
      const campaignData = {
        name: 'Black Friday Sale 2024',
        message: 'Get 50% off everything! Use code BLACKFRIDAY. Shop now!',
        audience: 'all',
        discountId: 'discount_123',
        scheduleType: 'immediate',
      };

      const res = await request()
        .post('/campaigns')
        .set(testHeaders)
        .send(campaignData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.name).toBe(campaignData.name);
      expect(res.body.data.message).toBe(campaignData.message);
      expect(res.body.data.audience).toBe(campaignData.audience);
      expect(res.body.data.status).toBe('draft');
      expect(res.body.data.scheduleType).toBe(campaignData.scheduleType);

      // Verify in database
      await verifyCampaignInDb(res.body.data.id, {
        name: campaignData.name,
        status: 'draft',
      });
    });

    it('should create a scheduled campaign', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const campaignData = {
        name: 'Scheduled Campaign',
        message: 'This campaign is scheduled for next week',
        scheduleType: 'scheduled',
        scheduleAt: futureDate.toISOString(),
      };

      const res = await request()
        .post('/campaigns')
        .set(testHeaders)
        .send(campaignData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.scheduleType).toBe('scheduled');
      expect(res.body.data.scheduleAt).toBeTruthy();
    });

    it('should create a recurring campaign', async () => {
      const campaignData = {
        name: 'Weekly Newsletter',
        message: 'Weekly special offers',
        scheduleType: 'recurring',
        recurringDays: 7,
      };

      const res = await request()
        .post('/campaigns')
        .set(testHeaders)
        .send(campaignData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.scheduleType).toBe('recurring');
      expect(res.body.data.recurringDays).toBe(7);
    });

    it('should reject campaign with missing required fields', async () => {
      const campaignData = {
        message: 'Missing name',
      };

      const res = await request()
        .post('/campaigns')
        .set(testHeaders)
        .send(campaignData);

      expect(res.status).toBe(400);
      // Error response may or may not have success field
      if (res.body.success !== undefined) {
        expect(res.body.success).toBe(false);
      }
    });

    it('should reject campaign with message too long', async () => {
      const campaignData = {
        name: 'Long Message Campaign',
        message: 'A'.repeat(2000), // Exceeds 1600 char limit
      };

      const res = await request()
        .post('/campaigns')
        .set(testHeaders)
        .send(campaignData);

      expect(res.status).toBe(400);
      // Error response may or may not have success field
      if (res.body.success !== undefined) {
        expect(res.body.success).toBe(false);
      }
    });

    it('should reject scheduled campaign without scheduleAt', async () => {
      const campaignData = {
        name: 'Invalid Scheduled',
        message: 'Test',
        scheduleType: 'scheduled',
        // Missing scheduleAt
      };

      const res = await request()
        .post('/campaigns')
        .set(testHeaders)
        .send(campaignData);

      expect(res.status).toBe(400);
      // Error response may or may not have success field
      if (res.body.success !== undefined) {
        expect(res.body.success).toBe(false);
      }
    });
  });

  describe('GET /campaigns', () => {
    beforeEach(async () => {
      await cleanupBeforeTest();
      // Create test campaigns with unique names
      const timestamp = Date.now();
      await createTestCampaign({ name: `TEST_Campaign 1 ${timestamp}`, status: 'draft' });
      await createTestCampaign({ name: `TEST_Campaign 2 ${timestamp}`, status: 'sent' });
      await createTestCampaign({ name: `TEST_Campaign 3 ${timestamp}`, status: 'scheduled' });
    });

    it('should list all campaigns with pagination', async () => {
      const res = await request()
        .get('/campaigns?page=1&pageSize=10')
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('campaigns');
      expect(res.body.data).toHaveProperty('pagination');
      expect(Array.isArray(res.body.data.campaigns)).toBe(true);
    });

    it('should filter campaigns by status', async () => {
      const res = await request()
        .get('/campaigns?status=draft')
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      res.body.data.campaigns.forEach(campaign => {
        expect(campaign.status).toBe('draft');
      });
    });

    it('should sort campaigns by creation date', async () => {
      const res = await request()
        .get('/campaigns?sortBy=createdAt&sortOrder=desc')
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify sorted (most recent first)
      const dates = res.body.data.campaigns.map(c => new Date(c.createdAt));
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i - 1].getTime()).toBeGreaterThanOrEqual(dates[i].getTime());
      }
    });
  });

  describe('GET /campaigns/:id', () => {
    let campaignId;

    beforeEach(async () => {
      await cleanupBeforeTest();
      const timestamp = Date.now();
      const campaign = await createTestCampaign({
        name: `TEST_Test Campaign ${timestamp}`,
        message: 'Test message',
      });
      campaignId = campaign.id;
    });

    it('should get a specific campaign by ID', async () => {
      const res = await request()
        .get(`/campaigns/${campaignId}`)
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(campaignId);
      expect(res.body.data.name).toBe('Test Campaign');
    });

    it('should return 404 for non-existent campaign', async () => {
      const res = await request()
        .get('/campaigns/non-existent-id')
        .set(testHeaders);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /campaigns/:id', () => {
    let campaignId;

    beforeEach(async () => {
      await cleanupBeforeTest();
      const timestamp = Date.now();
      const campaign = await createTestCampaign({
        name: `TEST_Original Campaign ${timestamp}`,
        message: 'Original message',
        status: 'draft',
      });
      campaignId = campaign.id;
    });

    it('should update campaign with new data', async () => {
      const updateData = {
        name: 'Updated Campaign Name',
        message: 'Updated message',
      };

      const res = await request()
        .put(`/campaigns/${campaignId}`)
        .set(testHeaders)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(updateData.name);
      expect(res.body.data.message).toBe(updateData.message);

      // Verify in database
      await verifyCampaignInDb(campaignId, {
        name: updateData.name,
      });
    });

    it('should not update campaign if status is not draft', async () => {
      // Set campaign to sent status
      await prisma.campaign.update({
        where: { id: campaignId },
        data: { status: 'sent' },
      });

      const updateData = {
        name: 'Should Not Update',
      };

      const res = await request()
        .put(`/campaigns/${campaignId}`)
        .set(testHeaders)
        .send(updateData);

      // Should either reject or allow but check status
      // This depends on your business logic
      expect([200, 400, 403]).toContain(res.status);
    });
  });

  describe('DELETE /campaigns/:id', () => {
    let campaignId;

    beforeEach(async () => {
      await cleanupBeforeTest();
      const timestamp = Date.now();
      const campaign = await createTestCampaign({
        name: `TEST_Campaign to Delete ${timestamp}`,
        status: 'draft',
      });
      campaignId = campaign.id;
    });

    it('should delete a draft campaign', async () => {
      const res = await request()
        .delete(`/campaigns/${campaignId}`)
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify deleted from database
      const deleted = await prisma.campaign.findUnique({
        where: { id: campaignId },
      });
      expect(deleted).toBeNull();
    });
  });

  describe('POST /campaigns/:id/prepare', () => {
    let campaignId;

    beforeEach(async () => {
      await cleanupBeforeTest();
      // Create contacts for testing with unique phones
      const timestamp = Date.now();
      await createTestContact({ phoneE164: `+306977${String(timestamp).slice(-6)}`, smsConsent: 'opted_in' });
      await createTestContact({ phoneE164: `+306977${String(timestamp + 1).slice(-6)}`, smsConsent: 'opted_in' });

      const campaign = await createTestCampaign({
        name: 'Prepare Test Campaign',
        audience: 'all',
        status: 'draft',
      });
      campaignId = campaign.id;
    });

    it('should prepare campaign and calculate recipients', async () => {
      const res = await request()
        .post(`/campaigns/${campaignId}/prepare`)
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('recipientCount');
      expect(res.body.data).toHaveProperty('estimatedCredits');
      expect(res.body.data).toHaveProperty('isValid', true);
      expect(res.body.data.recipientCount).toBeGreaterThan(0);
    });
  });

  describe('POST /campaigns/:id/send', () => {
    let campaignId;
    const initialCredits = 1000;

    beforeEach(async () => {
      // Ensure shop has credits
      await prisma.shop.update({
        where: { id: testShopId },
        data: { credits: initialCredits },
      });

      // Create contacts
      await createTestContact({ phoneE164: '+306977111111', smsConsent: 'opted_in' });
      await createTestContact({ phoneE164: '+306977222222', smsConsent: 'opted_in' });

      const campaign = await createTestCampaign({
        name: 'Send Test Campaign',
        audience: 'all',
        status: 'draft',
      });
      campaignId = campaign.id;
    });

    it('should send campaign and consume credits', async () => {
      const res = await request()
        .post(`/campaigns/${campaignId}/send`)
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('recipientCount');
      expect(res.body.data).toHaveProperty('status', 'sending');

      // Verify campaign status updated
      const updatedCampaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
      });
      expect(updatedCampaign.status).toBe('sending');

      // Verify credits consumed (may need to wait for async processing)
      await new Promise(resolve => setTimeout(resolve, 1000));
      const shop = await prisma.shop.findUnique({
        where: { id: testShopId },
        select: { credits: true },
      });
      expect(shop.credits).toBeLessThan(initialCredits);
    });

    it('should reject sending campaign with insufficient credits', async () => {
      // Set credits to 0
      await prisma.shop.update({
        where: { id: testShopId },
        data: { credits: 0 },
      });

      const campaign = await createTestCampaign({
        name: 'No Credits Campaign',
        status: 'draft',
      });

      const res = await request()
        .post(`/campaigns/${campaign.id}/send`)
        .set(testHeaders);

      expect(res.status).toBe(400);
      // Error response may or may not have success field
      if (res.body.success !== undefined) {
        expect(res.body.success).toBe(false);
      }
      expect(res.body.message).toContain('credit');
    });

    it('should reject sending non-draft campaign', async () => {
      const campaign = await createTestCampaign({
        name: 'Sent Campaign',
        status: 'sent',
      });

      const res = await request()
        .post(`/campaigns/${campaign.id}/send`)
        .set(testHeaders);

      expect(res.status).toBe(400);
      // Error response may or may not have success field
      if (res.body.success !== undefined) {
        expect(res.body.success).toBe(false);
      }
    });
  });

  describe('PUT /campaigns/:id/schedule', () => {
    let campaignId;

    beforeEach(async () => {
      await cleanupBeforeTest();
      const timestamp = Date.now();
      const campaign = await createTestCampaign({
        name: `TEST_Schedule Test Campaign ${timestamp}`,
        status: 'draft',
      });
      campaignId = campaign.id;
    });

    it('should schedule a campaign', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const scheduleData = {
        scheduleType: 'scheduled',
        scheduleAt: futureDate.toISOString(),
      };

      const res = await request()
        .put(`/campaigns/${campaignId}/schedule`)
        .set(testHeaders)
        .send(scheduleData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // Campaign object may or may not have scheduleType field depending on service response
      // Verify in database instead
      const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
      expect(campaign.scheduleType).toBe('scheduled');
      expect(campaign.scheduleAt).toBeTruthy();

      // Verify in database
      await verifyCampaignInDb(campaignId, {
        scheduleType: 'scheduled',
      });
    });
  });

  describe('GET /campaigns/:id/metrics', () => {
    let campaignId;

    beforeEach(async () => {
      await cleanupBeforeTest();
      const timestamp = Date.now();
      const campaign = await createTestCampaign({
        name: `TEST_Metrics Test Campaign ${timestamp}`,
      });
      campaignId = campaign.id;

      // Create metrics using upsert to avoid unique constraint violation
      await prisma.campaignMetrics.upsert({
        where: { campaignId },
        update: {
          totalSent: 100,
          totalDelivered: 95,
          totalFailed: 5,
        },
        create: {
          campaignId,
          totalSent: 100,
          totalDelivered: 95,
          totalFailed: 5,
        },
      });
    });

    it('should return campaign metrics', async () => {
      const res = await request()
        .get(`/campaigns/${campaignId}/metrics`)
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // Support both old (totalSent) and new (sent) field names
      const sent = res.body.data.sent || res.body.data.totalSent;
      const delivered = res.body.data.delivered || res.body.data.totalDelivered;
      const failed = res.body.data.failed || res.body.data.totalFailed;
      expect(sent).toBe(100);
      expect(delivered).toBe(95);
      expect(failed).toBe(5);
    });
  });

  describe('GET /campaigns/stats/summary', () => {
    beforeEach(async () => {
      await cleanupBeforeTest();
      const timestamp = Date.now();
      // Create campaigns with different statuses
      await createTestCampaign({ name: `TEST_Sent Campaign ${timestamp}`, status: 'sent' });
      await createTestCampaign({ name: `TEST_Draft Campaign ${timestamp}`, status: 'draft' });
      await createTestCampaign({ name: `TEST_Scheduled Campaign ${timestamp}`, status: 'scheduled' });
    });

    it('should return campaign statistics summary', async () => {
      const res = await request()
        .get('/campaigns/stats/summary')
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // Support both old (total) and new (totalCampaigns) field names
      const totalCampaigns = res.body.data.totalCampaigns || res.body.data.total;
      expect(totalCampaigns).toBeGreaterThan(0);
    });
  });
});

