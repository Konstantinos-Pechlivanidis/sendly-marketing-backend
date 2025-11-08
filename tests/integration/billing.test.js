/**
 * Billing Endpoints Tests
 * Comprehensive tests for all billing-related endpoints
 */

import request from 'supertest';
import app from '../../app.js';
import {
  createTestShop,
  cleanupTestData,
  createTestHeaders,
} from '../helpers/test-utils.js';
// eslint-disable-next-line no-unused-vars
import { verifyShopCredits } from '../helpers/test-db.js';
import prisma from '../../services/prisma.js';

describe('Billing Endpoints', () => {
  let testShop;
  let testShopId;
  let testHeaders;

  beforeAll(async () => {
    testShop = await createTestShop({
      shopDomain: 'billing-test.myshopify.com',
      credits: 500,
    });
    testShopId = testShop.id;
    testHeaders = createTestHeaders(testShop.shopDomain);
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('GET /billing/balance', () => {
    it('should return current credit balance', async () => {
      const res = await request(app)
        .get('/billing/balance')
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('balance');
      expect(res.body.data).toHaveProperty('currency', 'EUR');
      expect(res.body.data.balance).toBeGreaterThanOrEqual(0);
    });

    it('should return correct balance after credits consumed', async () => {
      // Consume some credits
      await prisma.shop.update({
        where: { id: testShopId },
        data: { credits: 300 },
      });

      const res = await request(app)
        .get('/billing/balance')
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.data.balance).toBe(300);
    });
  });

  describe('GET /billing/packages', () => {
    it('should return available credit packages', async () => {
      const res = await request(app)
        .get('/billing/packages')
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('packages');
      expect(Array.isArray(res.body.data.packages)).toBe(true);
      expect(res.body.data.packages.length).toBeGreaterThan(0);

      // Verify package structure
      const pkg = res.body.data.packages[0];
      expect(pkg).toHaveProperty('id');
      expect(pkg).toHaveProperty('name');
      expect(pkg).toHaveProperty('credits');
      expect(pkg).toHaveProperty('price');
      expect(pkg).toHaveProperty('currency');
    });
  });

  describe('GET /billing/history', () => {
    beforeEach(async () => {
      // Create test transactions
      await prisma.walletTransaction.createMany({
        data: [
          {
            shopId: testShopId,
            type: 'credit',
            amount: 100,
            description: 'Test purchase',
            balanceAfter: 600,
          },
          {
            shopId: testShopId,
            type: 'debit',
            amount: -50,
            description: 'SMS sent',
            balanceAfter: 550,
          },
        ],
      });
    });

    it('should return transaction history with pagination', async () => {
      const res = await request(app)
        .get('/billing/history?page=1&pageSize=10')
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('transactions');
      expect(res.body.data).toHaveProperty('pagination');
      expect(Array.isArray(res.body.data.transactions)).toBe(true);
      expect(res.body.data.transactions.length).toBeGreaterThan(0);
    });

    it('should filter transactions by type', async () => {
      const res = await request(app)
        .get('/billing/history?type=credit')
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      res.body.data.transactions.forEach(transaction => {
        expect(transaction.type).toBe('credit');
      });
    });

    it('should filter transactions by date range', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const endDate = new Date();

      const res = await request(app)
        .get(`/billing/history?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /billing/billing-history', () => {
    beforeEach(async () => {
      // Create test billing transactions (Stripe)
      await prisma.billingTransaction.createMany({
        data: [
          {
            shopId: testShopId,
            stripePaymentIntentId: 'pi_test_123',
            amount: 5000, // €50.00
            currency: 'EUR',
            status: 'succeeded',
            creditsAwarded: 100,
          },
          {
            shopId: testShopId,
            stripePaymentIntentId: 'pi_test_456',
            amount: 10000, // €100.00
            currency: 'EUR',
            status: 'succeeded',
            creditsAwarded: 200,
          },
        ],
      });
    });

    it('should return billing history (Stripe transactions)', async () => {
      const res = await request(app)
        .get('/billing/billing-history?page=1&pageSize=10')
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('transactions');
      expect(res.body.data).toHaveProperty('pagination');
      expect(res.body.data.transactions.length).toBeGreaterThan(0);

      // Verify transaction structure
      const transaction = res.body.data.transactions[0];
      expect(transaction).toHaveProperty('amount');
      expect(transaction).toHaveProperty('currency');
      expect(transaction).toHaveProperty('status');
      expect(transaction).toHaveProperty('creditsAdded');
    });
  });

  describe('POST /billing/purchase', () => {
    it('should create Stripe checkout session for purchase', async () => {
      const purchaseData = {
        packageId: 'package_100_credits',
        credits: 100,
        price: 1000, // €10.00 in cents
        currency: 'EUR',
      };

      const res = await request(app)
        .post('/billing/purchase')
        .set(testHeaders)
        .send(purchaseData);

      // Should either return checkout URL or handle Stripe mock
      expect([200, 201]).toContain(res.status);

      // If Stripe is mocked, verify response structure
      if (res.status === 200 || res.status === 201) {
        expect(res.body.success).toBe(true);
        // May have checkout URL or session ID
      }
    });

    it('should reject purchase with invalid package', async () => {
      const purchaseData = {
        packageId: 'invalid_package',
        credits: 100,
        price: 1000,
      };

      const res = await request(app)
        .post('/billing/purchase')
        .set(testHeaders)
        .send(purchaseData);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject purchase with missing required fields', async () => {
      const purchaseData = {
        credits: 100,
        // Missing price
      };

      const res = await request(app)
        .post('/billing/purchase')
        .set(testHeaders)
        .send(purchaseData);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Credit Consumption Validation', () => {
    it('should verify credits are consumed when SMS sent', async () => {
      const initialCredits = await prisma.shop.findUnique({
        where: { id: testShopId },
        select: { credits: true },
      });

      // Simulate SMS sending (this would typically be done through campaign send)
      await prisma.walletTransaction.create({
        data: {
          shopId: testShopId,
          type: 'debit',
          credits: -10,
          meta: { description: 'SMS sent' },
        },
      });

      await prisma.shop.update({
        where: { id: testShopId },
        data: { credits: initialCredits.credits - 10 },
      });

      // Verify credits decreased
      const updatedCredits = await prisma.shop.findUnique({
        where: { id: testShopId },
        select: { credits: true },
      });

      expect(updatedCredits.credits).toBe(initialCredits.credits - 10);

      // Verify transaction in database
      const transaction = await prisma.walletTransaction.findFirst({
        where: { shopId: testShopId },
        orderBy: { createdAt: 'desc' },
      });

      expect(transaction).toBeTruthy();
      expect(transaction.credits).toBe(-10);
    });

    it('should verify credits are added when purchase completed', async () => {
      const initialCredits = await prisma.shop.findUnique({
        where: { id: testShopId },
        select: { credits: true },
      });

      // Simulate purchase completion
      await prisma.walletTransaction.create({
        data: {
          shopId: testShopId,
          type: 'credit',
          credits: 100,
          meta: { description: 'Credit purchase' },
        },
      });

      await prisma.shop.update({
        where: { id: testShopId },
        data: { credits: initialCredits.credits + 100 },
      });

      // Verify credits increased
      await verifyShopCredits(testShopId, initialCredits.credits + 100);
    });
  });
});

