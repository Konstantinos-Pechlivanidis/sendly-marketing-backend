/**
 * Tracking Endpoints Tests
 * Comprehensive tests for all tracking endpoints
 */

import request from 'supertest';
import app from '../../app.js';
import {
  createTestShop,
  cleanupTestData,
  createTestHeaders,
  createTestCampaign,
} from '../helpers/test-utils.js';
import prisma from '../../services/prisma.js';

describe('Tracking Endpoints', () => {
  let testShop;
  let testShopId;
  let testHeaders;

  beforeAll(async () => {
    testShop = await createTestShop({
      shopDomain: 'tracking-test.myshopify.com',
    });
    testShopId = testShop.id;
    testHeaders = createTestHeaders(testShop.shopDomain);
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('GET /tracking/mitto/:messageId', () => {
    beforeEach(async () => {
      // Create message log
      await prisma.messageLog.create({
        data: {
          shopId: testShopId,
          phoneE164: '+306977123456',
          mittoMessageId: 'mitto_msg_123',
          status: 'sent',
          messageType: 'campaign',
        },
      });
    });

    it('should return delivery status for Mitto message', async () => {
      const res = await request(app)
        .get('/tracking/mitto/mitto_msg_123');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('messageId', 'mitto_msg_123');
      expect(res.body.data).toHaveProperty('status');
    });

    it('should return 404 for non-existent message', async () => {
      const res = await request(app)
        .get('/tracking/mitto/non-existent-id');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /tracking/campaign/:campaignId', () => {
    let campaignId;

    beforeEach(async () => {
      const campaign = await createTestCampaign({
        name: 'Tracking Test Campaign',
      });
      campaignId = campaign.id;

      // Create message logs for campaign
      await prisma.messageLog.createMany({
        data: [
          {
            shopId: testShopId,
            campaignId,
            phoneE164: '+306977111111',
            status: 'sent',
            messageType: 'campaign',
          },
          {
            shopId: testShopId,
            campaignId,
            phoneE164: '+306977222222',
            status: 'delivered',
            messageType: 'campaign',
          },
          {
            shopId: testShopId,
            campaignId,
            phoneE164: '+306977333333',
            status: 'failed',
            messageType: 'campaign',
          },
        ],
      });
    });

    it('should return delivery status for all messages in campaign', async () => {
      const res = await request(app)
        .get(`/tracking/campaign/${campaignId}`)
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('campaignId', campaignId);
      expect(res.body.data).toHaveProperty('messages');
      expect(res.body.data).toHaveProperty('summary');
      expect(res.body.data.summary).toHaveProperty('total');
      expect(res.body.data.summary).toHaveProperty('sent');
      expect(res.body.data.summary).toHaveProperty('delivered');
      expect(res.body.data.summary).toHaveProperty('failed');
    });

    it('should return correct counts in summary', async () => {
      const res = await request(app)
        .get(`/tracking/campaign/${campaignId}`)
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.data.summary.total).toBe(3);
      expect(res.body.data.summary.sent).toBeGreaterThanOrEqual(1);
      expect(res.body.data.summary.delivered).toBeGreaterThanOrEqual(1);
    });
  });

  describe('POST /tracking/bulk-update', () => {
    beforeEach(async () => {
      // Create message logs
      await prisma.messageLog.createMany({
        data: [
          {
            shopId: testShopId,
            phoneE164: '+306977111111',
            mittoMessageId: 'msg_1',
            status: 'sent',
            messageType: 'campaign',
          },
          {
            shopId: testShopId,
            phoneE164: '+306977222222',
            mittoMessageId: 'msg_2',
            status: 'sent',
            messageType: 'campaign',
          },
        ],
      });
    });

    it('should bulk update delivery status', async () => {
      const updateData = {
        updates: [
          {
            messageId: 'msg_1',
            status: 'delivered',
          },
          {
            messageId: 'msg_2',
            status: 'delivered',
          },
        ],
      };

      const res = await request(app)
        .post('/tracking/bulk-update')
        .set(testHeaders)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('updated');
      expect(res.body.data.updated).toBeGreaterThan(0);

      // Verify updates in database
      const msg1 = await prisma.messageLog.findFirst({
        where: { mittoMessageId: 'msg_1' },
      });
      expect(msg1.status).toBe('delivered');

      const msg2 = await prisma.messageLog.findFirst({
        where: { mittoMessageId: 'msg_2' },
      });
      expect(msg2.status).toBe('delivered');
    });

    it('should handle partial updates', async () => {
      const updateData = {
        updates: [
          {
            messageId: 'msg_1',
            status: 'delivered',
          },
          {
            messageId: 'non-existent',
            status: 'delivered',
          },
        ],
      };

      const res = await request(app)
        .post('/tracking/bulk-update')
        .set(testHeaders)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.data.updated).toBe(1);
      expect(res.body.data.errors.length).toBeGreaterThan(0);
    });
  });
});

