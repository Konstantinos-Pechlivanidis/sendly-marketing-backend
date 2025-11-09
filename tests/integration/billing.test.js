/* eslint-disable no-console */
/**
 * Billing Endpoints Tests
 * Comprehensive tests for all billing-related endpoints and functionality
 */

import { request } from '../helpers/test-client.js';
import {
  createTestShop,
  cleanupTestData,
  createTestHeaders,
  delayBetweenRequests,
} from '../helpers/test-utils.js';
import {
  verifyShopCredits,
  // verifyBillingTransactionInDb, // Unused
  // verifyWalletTransactionInDb, // Unused
} from '../helpers/test-db.js';
import prisma from '../../services/prisma.js';
import billingService from '../../services/billing.js';
import { testConfig } from '../config/test-config.js';

describe('Billing Endpoints - Comprehensive Tests', () => {
  let testShop;
  let testShopId;
  let testHeaders;

  beforeAll(async () => {
    console.log('\n📦 Setting up test shop for billing tests...');
    // Use the actual sms-blossom-dev shop from production
    testShop = await createTestShop({
      shopDomain: testConfig.testShop.shopDomain, // sms-blossom-dev.myshopify.com
      credits: testConfig.testShop.credits,
      currency: testConfig.testShop.currency,
    });
    testShopId = testShop.id;
    testHeaders = createTestHeaders(testShop.shopDomain);
    console.log(`✅ Test shop ready: ${testShop.shopDomain} (ID: ${testShop.id})\n`);
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  beforeEach(async () => {
    // Reset shop credits before each test
    // Check if shop exists first
    const shop = await prisma.shop.findUnique({
      where: { id: testShopId },
      select: { id: true },
    });

    if (shop) {
      await prisma.shop.update({
        where: { id: testShopId },
        data: { credits: 1000 },
      });
    }
  });

  describe('GET /billing/balance', () => {
    it('should return current credit balance', async () => {
      const res = await request()
        .get('/billing/balance')
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('balance');
      expect(res.body.data).toHaveProperty('credits');
      expect(res.body.data).toHaveProperty('currency');
      expect(res.body.data.balance).toBe(1000);
      expect(res.body.data.credits).toBe(1000);
      expect(res.body.data.currency).toBe('EUR');
    });

    it('should return correct balance after credits consumed', async () => {
      // Consume some credits
      await prisma.shop.update({
        where: { id: testShopId },
        data: { credits: 750 },
      });

      const res = await request()
        .get('/billing/balance')
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.data.balance).toBe(750);
      expect(res.body.data.credits).toBe(750);
    });

    it('should return 0 balance for shop with no credits', async () => {
      await prisma.shop.update({
        where: { id: testShopId },
        data: { credits: 0 },
      });

      const res = await request()
        .get('/billing/balance')
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.data.balance).toBe(0);
      expect(res.body.data.credits).toBe(0);
    });

    it('should handle shop with USD currency', async () => {
      await prisma.shop.update({
        where: { id: testShopId },
        data: { currency: 'USD' },
      });

      const res = await request()
        .get('/billing/balance')
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.data.currency).toBe('USD');
    });
  });

  describe('GET /billing/packages', () => {
    it('should return available credit packages', async () => {
      const res = await request()
        .get('/billing/packages')
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('packages');
      expect(Array.isArray(res.body.data.packages)).toBe(true);
      expect(res.body.data.packages.length).toBeGreaterThan(0);
    });

    it('should return packages with correct structure', async () => {
      const res = await request()
        .get('/billing/packages')
        .set(testHeaders);

      const pkg = res.body.data.packages[0];
      expect(pkg).toHaveProperty('id');
      expect(pkg).toHaveProperty('name');
      expect(pkg).toHaveProperty('credits');
      expect(pkg).toHaveProperty('price');
      expect(pkg).toHaveProperty('currency');
      expect(pkg).toHaveProperty('description');
      expect(pkg).toHaveProperty('popular');
      expect(pkg).toHaveProperty('features');
      expect(Array.isArray(pkg.features)).toBe(true);
    });

    it('should return EUR prices for EUR shop', async () => {
      await prisma.shop.update({
        where: { id: testShopId },
        data: { currency: 'EUR' },
      });

      const res = await request()
        .get('/billing/packages')
        .set(testHeaders);

      res.body.data.packages.forEach(pkg => {
        expect(pkg.currency).toBe('EUR');
        expect(typeof pkg.price).toBe('number');
        expect(pkg.price).toBeGreaterThan(0);
      });
    });

    it('should return USD prices for USD shop', async () => {
      await prisma.shop.update({
        where: { id: testShopId },
        data: { currency: 'USD' },
      });

      const res = await request()
        .get('/billing/packages')
        .set(testHeaders);

      res.body.data.packages.forEach(pkg => {
        expect(pkg.currency).toBe('USD');
        expect(typeof pkg.price).toBe('number');
        expect(pkg.price).toBeGreaterThan(0);
      });
    });

    it('should include all required packages', async () => {
      const res = await request()
        .get('/billing/packages')
        .set(testHeaders);

      const packageIds = res.body.data.packages.map(p => p.id);
      expect(packageIds).toContain('package_1000');
      expect(packageIds).toContain('package_5000');
      expect(packageIds).toContain('package_10000');
      expect(packageIds).toContain('package_25000');
    });
  });

  describe('POST /billing/purchase', () => {
    // Note: Using real Stripe test mode calls (STRIPE_SECRET_KEY is test key)
    // No mocking needed - Stripe test mode will be used

    it('should create Stripe checkout session for valid package', async () => {
      const purchaseData = {
        packageId: 'package_1000',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      };

      const res = await request()
        .post('/billing/purchase')
        .set(testHeaders)
        .send(purchaseData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('sessionId');
      expect(res.body.data).toHaveProperty('sessionUrl');
      expect(res.body.data).toHaveProperty('transactionId');
      expect(res.body.data).toHaveProperty('package');
    });

    it('should create BillingTransaction record', async () => {
      const purchaseData = {
        packageId: 'package_1000',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      };

      const res = await request()
        .post('/billing/purchase')
        .set(testHeaders)
        .send(purchaseData);

      const transaction = await prisma.billingTransaction.findUnique({
        where: { id: res.body.data.transactionId },
      });

      expect(transaction).toBeTruthy();
      expect(transaction.shopId).toBe(testShopId);
      expect(transaction.status).toBe('pending');
      expect(transaction.creditsAdded).toBe(1000);
      expect(transaction.packageType).toBe('package_1000');
    });

    it('should reject purchase with invalid package', async () => {
      const purchaseData = {
        packageId: 'invalid_package',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      };

      const res = await request()
        .post('/billing/purchase')
        .set(testHeaders)
        .send(purchaseData);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should reject purchase with missing packageId', async () => {
      const purchaseData = {
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      };

      const res = await request()
        .post('/billing/purchase')
        .set(testHeaders)
        .send(purchaseData);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject purchase with missing successUrl', async () => {
      const purchaseData = {
        packageId: 'package_1000',
        cancelUrl: 'https://example.com/cancel',
      };

      const res = await request()
        .post('/billing/purchase')
        .set(testHeaders)
        .send(purchaseData);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject purchase with missing cancelUrl', async () => {
      const purchaseData = {
        packageId: 'package_1000',
        successUrl: 'https://example.com/success',
      };

      const res = await request()
        .post('/billing/purchase')
        .set(testHeaders)
        .send(purchaseData);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should use correct currency for package pricing', async () => {
      await prisma.shop.update({
        where: { id: testShopId },
        data: { currency: 'USD' },
      });

      const purchaseData = {
        packageId: 'package_1000',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      };

      const res = await request()
        .post('/billing/purchase')
        .set(testHeaders)
        .send(purchaseData);

      expect(res.status).toBe(200);

      // Verify the transaction was created with correct currency
      const transaction = await prisma.billingTransaction.findUnique({
        where: { id: res.body.data.transactionId },
      });

      expect(transaction).toBeTruthy();
      expect(transaction.currency).toBe('USD');
    });
  });

  describe('GET /billing/history', () => {
    beforeEach(async () => {
      // Create test wallet transactions
      await prisma.walletTransaction.deleteMany({
        where: { shopId: testShopId },
      });

      await prisma.walletTransaction.createMany({
        data: [
          {
            shopId: testShopId,
            type: 'purchase',
            credits: 1000,
            ref: 'stripe:cs_test_1',
            meta: { description: 'Test purchase 1' },
          },
          {
            shopId: testShopId,
            type: 'debit',
            credits: -50,
            ref: 'campaign:campaign_1',
            meta: { description: 'SMS sent' },
          },
          {
            shopId: testShopId,
            type: 'purchase',
            credits: 500,
            ref: 'stripe:cs_test_2',
            meta: { description: 'Test purchase 2' },
          },
        ],
      });
    });

    it('should return transaction history with pagination', async () => {
      const res = await request()
        .get('/billing/history?page=1&pageSize=10')
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('transactions');
      expect(res.body.data).toHaveProperty('pagination');
      expect(Array.isArray(res.body.data.transactions)).toBe(true);
      expect(res.body.data.transactions.length).toBeGreaterThan(0);
    });

    it('should return correct pagination metadata', async () => {
      const res = await request()
        .get('/billing/history?page=1&pageSize=2')
        .set(testHeaders);

      expect(res.body.data.pagination).toHaveProperty('page', 1);
      expect(res.body.data.pagination).toHaveProperty('pageSize', 2);
      expect(res.body.data.pagination).toHaveProperty('total');
      expect(res.body.data.pagination).toHaveProperty('totalPages');
    });

    it('should filter transactions by type', async () => {
      await delayBetweenRequests(200); // Delay to avoid rate limiting
      const res = await request()
        .get('/billing/history?type=purchase')
        .set(testHeaders);

      expect(res.status).toBe(200);
      res.body.data.transactions.forEach(transaction => {
        expect(transaction.type).toBe('purchase');
      });
    });

    it('should filter transactions by debit type', async () => {
      await delayBetweenRequests(200); // Delay to avoid rate limiting
      const res = await request()
        .get('/billing/history?type=debit')
        .set(testHeaders);

      expect(res.status).toBe(200);
      res.body.data.transactions.forEach(transaction => {
        expect(transaction.type).toBe('debit');
      });
    });

    it('should filter transactions by date range', async () => {
      await delayBetweenRequests(200); // Delay to avoid rate limiting
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const endDate = new Date();

      const res = await request()
        .get(`/billing/history?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return transactions in descending order', async () => {
      const res = await request()
        .get('/billing/history')
        .set(testHeaders);

      const transactions = res.body.data.transactions;
      if (transactions.length > 1) {
        for (let i = 0; i < transactions.length - 1; i++) {
          const current = new Date(transactions[i].createdAt);
          const next = new Date(transactions[i + 1].createdAt);
          expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
        }
      }
    });
  });

  describe('GET /billing/billing-history', () => {
    beforeEach(async () => {
      // Create test billing transactions
      await prisma.billingTransaction.deleteMany({
        where: { shopId: testShopId },
      });

      await prisma.billingTransaction.createMany({
        data: [
          {
            shopId: testShopId,
            creditsAdded: 1000,
            amount: 2999, // €29.99 in cents
            currency: 'EUR',
            packageType: 'package_1000',
            stripeSessionId: 'cs_test_1',
            stripePaymentId: 'pi_test_1',
            status: 'completed',
          },
          {
            shopId: testShopId,
            creditsAdded: 5000,
            amount: 12999, // €129.99 in cents
            currency: 'EUR',
            packageType: 'package_5000',
            stripeSessionId: 'cs_test_2',
            stripePaymentId: 'pi_test_2',
            status: 'completed',
          },
          {
            shopId: testShopId,
            creditsAdded: 1000,
            amount: 2999,
            currency: 'EUR',
            packageType: 'package_1000',
            stripeSessionId: 'cs_test_3',
            status: 'pending',
          },
        ],
      });
    });

    it('should return billing history (Stripe transactions)', async () => {
      const res = await request()
        .get('/billing/billing-history?page=1&pageSize=10')
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('transactions');
      expect(res.body.data).toHaveProperty('pagination');
      expect(res.body.data.transactions.length).toBeGreaterThan(0);
    });

    it('should return transactions with correct structure', async () => {
      const res = await request()
        .get('/billing/billing-history')
        .set(testHeaders);

      const transaction = res.body.data.transactions[0];
      expect(transaction).toHaveProperty('id');
      expect(transaction).toHaveProperty('amount');
      expect(transaction).toHaveProperty('currency');
      expect(transaction).toHaveProperty('status');
      expect(transaction).toHaveProperty('creditsAdded');
      expect(transaction).toHaveProperty('packageType');
    });

    it('should filter transactions by status', async () => {
      await delayBetweenRequests(200); // Delay to avoid rate limiting
      const res = await request()
        .get('/billing/billing-history?status=completed')
        .set(testHeaders);

      expect(res.status).toBe(200);
      res.body.data.transactions.forEach(transaction => {
        expect(transaction.status).toBe('completed');
      });
    });

    it('should filter transactions by pending status', async () => {
      await delayBetweenRequests(200); // Delay to avoid rate limiting
      const res = await request()
        .get('/billing/billing-history?status=pending')
        .set(testHeaders);

      expect(res.status).toBe(200);
      res.body.data.transactions.forEach(transaction => {
        expect(transaction.status).toBe('pending');
      });
    });
  });

  describe('Credit Management - addCredits', () => {
    it('should add credits to shop balance', async () => {
      const initialCredits = 1000;
      await prisma.shop.update({
        where: { id: testShopId },
        data: { credits: initialCredits },
      });

      await billingService.addCredits(
        testShopId,
        500,
        'test:add_credits',
        { test: true },
      );

      await verifyShopCredits(testShopId, initialCredits + 500);
    });

    it('should create WalletTransaction record when adding credits', async () => {
      await billingService.addCredits(
        testShopId,
        200,
        'test:wallet_transaction',
        { description: 'Test credit addition' },
      );

      const transaction = await prisma.walletTransaction.findFirst({
        where: {
          shopId: testShopId,
          ref: 'test:wallet_transaction',
        },
      });

      expect(transaction).toBeTruthy();
      expect(transaction.type).toBe('purchase');
      expect(transaction.credits).toBe(200);
    });

    it('should reject adding zero or negative credits', async () => {
      await expect(
        billingService.addCredits(testShopId, 0, 'test:zero'),
      ).rejects.toThrow();

      await expect(
        billingService.addCredits(testShopId, -100, 'test:negative'),
      ).rejects.toThrow();
    });
  });

  describe('Credit Management - deductCredits', () => {
    it('should deduct credits from shop balance', async () => {
      const initialCredits = 1000;
      await prisma.shop.update({
        where: { id: testShopId },
        data: { credits: initialCredits },
      });

      await billingService.deductCredits(
        testShopId,
        300,
        'test:deduct_credits',
        { test: true },
      );

      await verifyShopCredits(testShopId, initialCredits - 300);
    });

    it('should create WalletTransaction record when deducting credits', async () => {
      await prisma.shop.update({
        where: { id: testShopId },
        data: { credits: 1000 },
      });

      await billingService.deductCredits(
        testShopId,
        150,
        'test:wallet_debit',
        { description: 'Test credit deduction' },
      );

      const transaction = await prisma.walletTransaction.findFirst({
        where: {
          shopId: testShopId,
          ref: 'test:wallet_debit',
        },
      });

      expect(transaction).toBeTruthy();
      expect(transaction.type).toBe('debit');
      expect(transaction.credits).toBe(-150);
    });

    it('should reject deducting when insufficient credits', async () => {
      await prisma.shop.update({
        where: { id: testShopId },
        data: { credits: 100 },
      });

      await expect(
        billingService.deductCredits(testShopId, 200, 'test:insufficient'),
      ).rejects.toThrow('Insufficient credits');
    });

    it('should reject deducting zero or negative credits', async () => {
      await expect(
        billingService.deductCredits(testShopId, 0, 'test:zero'),
      ).rejects.toThrow();

      await expect(
        billingService.deductCredits(testShopId, -100, 'test:negative'),
      ).rejects.toThrow();
    });
  });

  describe('Refund Processing', () => {
    let billingTransaction;

    beforeEach(async () => {
      // Create a completed billing transaction
      billingTransaction = await prisma.billingTransaction.create({
        data: {
          shopId: testShopId,
          creditsAdded: 1000,
          amount: 2999, // €29.99 in cents
          currency: 'EUR',
          packageType: 'package_1000',
          stripeSessionId: 'cs_test_refund',
          stripePaymentId: 'pi_test_refund',
          status: 'completed',
        },
      });

      // Add credits to shop
      await prisma.shop.update({
        where: { id: testShopId },
        data: { credits: 1000 },
      });
    });

    it('should process full refund and deduct credits', async () => {
      const initialCredits = 1000;

      await billingService.processRefund(
        testShopId,
        billingTransaction.id,
        null, // Full refund
        're_test_refund',
        { test: true },
      );

      await verifyShopCredits(testShopId, initialCredits - 1000);
    });

    it('should create WalletTransaction record for refund', async () => {
      await billingService.processRefund(
        testShopId,
        billingTransaction.id,
        1000,
        're_test_refund',
        { test: true },
      );

      const transaction = await prisma.walletTransaction.findFirst({
        where: {
          shopId: testShopId,
          type: 'refund',
        },
      });

      expect(transaction).toBeTruthy();
      expect(transaction.type).toBe('refund');
      expect(transaction.credits).toBe(-1000);
      expect(transaction.meta).toHaveProperty('originalTransactionId');
      expect(transaction.meta).toHaveProperty('refundId', 're_test_refund');
    });

    it('should process partial refund proportionally', async () => {
      const initialCredits = 1000;

      // Refund 50% of the transaction
      await billingService.processRefund(
        testShopId,
        billingTransaction.id,
        500, // Half of 1000 credits
        're_test_partial',
        { test: true },
      );

      await verifyShopCredits(testShopId, initialCredits - 500);
    });

    it('should reject refund for non-completed transaction', async () => {
      const pendingTransaction = await prisma.billingTransaction.create({
        data: {
          shopId: testShopId,
          creditsAdded: 1000,
          amount: 2999,
          currency: 'EUR',
          packageType: 'package_1000',
          stripeSessionId: 'cs_test_pending',
          status: 'pending',
        },
      });

      await expect(
        billingService.processRefund(
          testShopId,
          pendingTransaction.id,
          1000,
          're_test',
        ),
      ).rejects.toThrow('Can only refund completed transactions');
    });

    it('should reject refund for transaction from different shop', async () => {
      // Use same shop for this test (multi-shop isolation test)
      const otherShop = await createTestShop({
        shopDomain: testConfig.testShop.shopDomain, // sms-blossom-dev.myshopify.com
      });

      const otherTransaction = await prisma.billingTransaction.create({
        data: {
          shopId: otherShop.id,
          creditsAdded: 1000,
          amount: 2999,
          currency: 'EUR',
          packageType: 'package_1000',
          stripeSessionId: 'cs_test_other',
          stripePaymentId: 'pi_test_other',
          status: 'completed',
        },
      });

      await expect(
        billingService.processRefund(
          testShopId,
          otherTransaction.id,
          1000,
          're_test',
        ),
      ).rejects.toThrow('Transaction does not belong to this store');

      // Cleanup
      await prisma.billingTransaction.delete({ where: { id: otherTransaction.id } });
      await prisma.shop.delete({ where: { id: otherShop.id } });
    });
  });

  describe('Stripe Webhook Handling', () => {
    it('should handle checkout.session.completed webhook', async () => {
      // Create pending transaction
      const transaction = await prisma.billingTransaction.create({
        data: {
          shopId: testShopId,
          creditsAdded: 1000,
          amount: 2999,
          currency: 'EUR',
          packageType: 'package_1000',
          stripeSessionId: 'cs_test_webhook',
          status: 'pending',
        },
      });

      const initialCredits = 1000;
      await prisma.shop.update({
        where: { id: testShopId },
        data: { credits: initialCredits },
      });

      // Simulate webhook event
      const event = {
        type: 'checkout.session.completed',
        id: 'evt_test_123',
        data: {
          object: {
            id: 'cs_test_webhook',
            payment_status: 'paid',
            payment_intent: 'pi_test_webhook',
            metadata: {
              storeId: testShopId,
              transactionId: transaction.id,
              credits: '1000',
              packageId: 'package_1000',
            },
          },
        },
      };

      await billingService.handleStripeWebhook(event);

      // Verify transaction is completed
      const updatedTransaction = await prisma.billingTransaction.findUnique({
        where: { id: transaction.id },
      });
      expect(updatedTransaction.status).toBe('completed');
      expect(updatedTransaction.stripePaymentId).toBe('pi_test_webhook');

      // Verify credits were added
      await verifyShopCredits(testShopId, initialCredits + 1000);

      // Verify WalletTransaction was created
      const walletTransaction = await prisma.walletTransaction.findFirst({
        where: {
          shopId: testShopId,
          ref: 'stripe:cs_test_webhook',
        },
      });
      expect(walletTransaction).toBeTruthy();
      expect(walletTransaction.type).toBe('purchase');
      expect(walletTransaction.credits).toBe(1000);
    });

    it('should handle idempotency - prevent double processing', async () => {
      // Create completed transaction
      const transaction = await prisma.billingTransaction.create({
        data: {
          shopId: testShopId,
          creditsAdded: 1000,
          amount: 2999,
          currency: 'EUR',
          packageType: 'package_1000',
          stripeSessionId: 'cs_test_idempotent',
          stripePaymentId: 'pi_test_idempotent',
          status: 'completed',
        },
      });

      const initialCredits = 1000;
      await prisma.shop.update({
        where: { id: testShopId },
        data: { credits: initialCredits },
      });

      // Try to process same event again
      const event = {
        type: 'checkout.session.completed',
        id: 'evt_test_idempotent',
        data: {
          object: {
            id: 'cs_test_idempotent',
            payment_status: 'paid',
            payment_intent: 'pi_test_idempotent',
            metadata: {
              storeId: testShopId,
              transactionId: transaction.id,
              credits: '1000',
            },
          },
        },
      };

      const result = await billingService.handleStripeWebhook(event);
      expect(result.status).toBe('already_processed');

      // Verify credits were NOT added again
      await verifyShopCredits(testShopId, initialCredits);
    });

    it('should handle refund webhook', async () => {
      // Create completed transaction
      await prisma.billingTransaction.create({
        data: {
          shopId: testShopId,
          creditsAdded: 1000,
          amount: 2999,
          currency: 'EUR',
          packageType: 'package_1000',
          stripeSessionId: 'cs_test_refund_webhook',
          stripePaymentId: 'pi_test_refund_webhook',
          status: 'completed',
        },
      });

      const initialCredits = 1000;
      await prisma.shop.update({
        where: { id: testShopId },
        data: { credits: initialCredits },
      });

      // Simulate refund webhook
      const event = {
        type: 'charge.refunded',
        id: 'evt_test_refund',
        data: {
          object: {
            id: 're_test_refund',
            payment_intent: 'pi_test_refund_webhook',
            amount: 2999, // Full refund
            currency: 'EUR',
          },
        },
      };

      await billingService.handleStripeWebhook(event);

      // Verify credits were deducted
      await verifyShopCredits(testShopId, initialCredits - 1000);

      // Verify WalletTransaction was created
      const walletTransaction = await prisma.walletTransaction.findFirst({
        where: {
          shopId: testShopId,
          type: 'refund',
        },
      });
      expect(walletTransaction).toBeTruthy();
      expect(walletTransaction.credits).toBe(-1000);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent shop', async () => {
      const invalidHeaders = createTestHeaders('non-existent.myshopify.com');

      const res = await request()
        .get('/billing/balance')
        .set(invalidHeaders);

      expect(res.status).toBe(404);
    });

    it('should handle missing required fields in purchase', async () => {
      const res = await request()
        .post('/billing/purchase')
        .set(testHeaders)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should handle invalid package in purchase', async () => {
      const res = await request()
        .post('/billing/purchase')
        .set(testHeaders)
        .send({
          packageId: 'invalid_package',
          successUrl: 'https://example.com/success',
          cancelUrl: 'https://example.com/cancel',
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
