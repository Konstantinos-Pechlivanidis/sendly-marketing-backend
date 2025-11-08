/**
 * Automations Endpoints Tests
 * Comprehensive tests for all automation-related endpoints
 */

import request from 'supertest';
import app from '../../app.js';
import {
  createTestShop,
  cleanupTestData,
  createTestHeaders,
} from '../helpers/test-utils.js';
import prisma from '../../services/prisma.js';

describe('Automations Endpoints', () => {
  let testShop;
  let testShopId;
  let testHeaders;

  beforeAll(async () => {
    testShop = await createTestShop({
      shopDomain: 'automations-test.myshopify.com',
    });
    testShopId = testShop.id;
    testHeaders = createTestHeaders(testShop.shopDomain);
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('GET /automations', () => {
    beforeEach(async () => {
      // Create user automations
      await prisma.userAutomation.createMany({
        data: [
          {
            shopId: testShopId,
            automationType: 'abandoned_cart',
            isEnabled: true,
            settings: { delay: 60 },
          },
          {
            shopId: testShopId,
            automationType: 'order_confirmation',
            isEnabled: true,
            settings: {},
          },
        ],
      });
    });

    it('should return user automations', async () => {
      const res = await request(app)
        .get('/automations')
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('automations');
      expect(Array.isArray(res.body.data.automations)).toBe(true);
      expect(res.body.data.automations.length).toBeGreaterThan(0);
    });

    it('should return only enabled automations when filtered', async () => {
      // Disable one automation
      await prisma.userAutomation.updateMany({
        where: {
          shopId: testShopId,
          automationType: 'order_confirmation',
        },
        data: { isEnabled: false },
      });

      const res = await request(app)
        .get('/automations?enabled=true')
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      res.body.data.automations.forEach(automation => {
        expect(automation.isEnabled).toBe(true);
      });
    });
  });

  describe('GET /automations/stats', () => {
    beforeEach(async () => {
      // Create automation logs
      await prisma.automationLog.createMany({
        data: [
          {
            storeId: testShopId,
            automationType: 'abandoned_cart',
            status: 'sent',
            recipientCount: 10,
          },
          {
            storeId: testShopId,
            automationType: 'order_confirmation',
            status: 'sent',
            recipientCount: 5,
          },
        ],
      });
    });

    it('should return automation statistics', async () => {
      const res = await request(app)
        .get('/automations/stats')
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('totalSent');
      expect(res.body.data).toHaveProperty('byType');
      expect(res.body.data.totalSent).toBeGreaterThan(0);
    });
  });

  describe('PUT /automations/:id', () => {
    let automationId;

    beforeEach(async () => {
      const automation = await prisma.userAutomation.create({
        data: {
          shopId: testShopId,
          automationType: 'abandoned_cart',
          isEnabled: true,
          settings: { delay: 60 },
        },
      });
      automationId = automation.id;
    });

    it('should update automation settings', async () => {
      const updateData = {
        isEnabled: false,
        settings: { delay: 120 },
      };

      const res = await request(app)
        .put(`/automations/${automationId}`)
        .set(testHeaders)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isEnabled).toBe(false);
      expect(res.body.data.settings.delay).toBe(120);

      // Verify in database
      const updated = await prisma.userAutomation.findUnique({
        where: { id: automationId },
      });
      expect(updated.isEnabled).toBe(false);
    });

    it('should enable/disable automation', async () => {
      const updateData = {
        isEnabled: false,
      };

      const res = await request(app)
        .put(`/automations/${automationId}`)
        .set(testHeaders)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.data.isEnabled).toBe(false);
    });
  });

  describe('GET /automations/defaults', () => {
    beforeEach(async () => {
      // Create system default automations
      await prisma.automation.createMany({
        data: [
          {
            type: 'abandoned_cart',
            name: 'Abandoned Cart',
            description: 'Send SMS when cart is abandoned',
            isActive: true,
            defaultSettings: { delay: 60 },
          },
          {
            type: 'order_confirmation',
            name: 'Order Confirmation',
            description: 'Send SMS on order confirmation',
            isActive: true,
            defaultSettings: {},
          },
        ],
      });
    });

    it('should return system default automations', async () => {
      const res = await request(app)
        .get('/automations/defaults')
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('automations');
      expect(Array.isArray(res.body.data.automations)).toBe(true);
    });
  });

  describe('POST /automations/sync', () => {
    it('should sync system defaults with user automations', async () => {
      const res = await request(app)
        .post('/automations/sync')
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});

