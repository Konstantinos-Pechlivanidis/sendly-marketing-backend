/**
 * Settings Endpoints Tests
 * Comprehensive tests for all settings endpoints
 */

import request from 'supertest';
import app from '../../app.js';
import {
  createTestShop,
  cleanupTestData,
  createTestHeaders,
} from '../helpers/test-utils.js';
import prisma from '../../services/prisma.js';

describe('Settings Endpoints', () => {
  let testShop;
  let testShopId;
  let testHeaders;

  beforeAll(async () => {
    testShop = await createTestShop({
      shopDomain: 'settings-test.myshopify.com',
    });
    testShopId = testShop.id;
    testHeaders = createTestHeaders(testShop.shopDomain);
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('GET /settings', () => {
    it('should return shop settings', async () => {
      const res = await request(app)
        .get('/settings')
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('currency');
      expect(res.body.data).toHaveProperty('timezone');
      expect(res.body.data).toHaveProperty('senderNumber');
      expect(res.body.data).toHaveProperty('senderName');
    });
  });

  describe('GET /settings/account', () => {
    it('should return account information', async () => {
      const res = await request(app)
        .get('/settings/account')
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('shopDomain');
      expect(res.body.data).toHaveProperty('shopName');
      expect(res.body.data).toHaveProperty('credits');
    });
  });

  describe('PUT /settings/sender', () => {
    it('should update sender number with E.164 format', async () => {
      const updateData = {
        senderNumber: '+306977123456',
      };

      const res = await request(app)
        .put('/settings/sender')
        .set(testHeaders)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.senderNumber).toBe(updateData.senderNumber);

      // Verify in database
      const settings = await prisma.shopSettings.findUnique({
        where: { shopId: testShopId },
      });
      expect(settings.senderNumber).toBe(updateData.senderNumber);
    });

    it('should update sender number with alphanumeric format', async () => {
      const updateData = {
        senderNumber: 'TestStore',
      };

      const res = await request(app)
        .put('/settings/sender')
        .set(testHeaders)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.senderNumber).toBe(updateData.senderNumber);

      // Verify in database
      const settings = await prisma.shopSettings.findUnique({
        where: { shopId: testShopId },
      });
      expect(settings.senderNumber).toBe(updateData.senderNumber);
    });

    it('should reject invalid sender number format', async () => {
      const updateData = {
        senderNumber: 'invalid-format-123',
      };

      const res = await request(app)
        .put('/settings/sender')
        .set(testHeaders)
        .send(updateData);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject sender number that is too long', async () => {
      const updateData = {
        senderNumber: 'A'.repeat(20), // Exceeds 11 char limit for alphanumeric
      };

      const res = await request(app)
        .put('/settings/sender')
        .set(testHeaders)
        .send(updateData);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});

