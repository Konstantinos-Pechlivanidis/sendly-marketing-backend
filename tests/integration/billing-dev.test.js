/* eslint-disable no-console */
/**
 * Billing Endpoints Tests - Development Environment
 * Tests using sms-blossom-dev.myshopify.com store
 * Designed to run with npm run dev
 *
 * Usage: npm run test:billing
 *
 * Prerequisites:
 * 1. Development database must be running
 * 2. Run: npm run seed:dev (to seed dev store data)
 * 3. Ensure .env file has DATABASE_URL configured
 */

// Load .env FIRST before any other imports
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file explicitly
const envPath = join(__dirname, '..', '..', '.env');
const envResult = config({ path: envPath });

if (envResult.error) {
  console.warn('⚠️  Could not load .env file:', envResult.error.message);
} else {
  console.log('✅ Loaded .env file from:', envPath);
}

// Verify DATABASE_URL is loaded
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
  console.error('   Make sure .env file exists and contains DATABASE_URL');
} else {
  console.log('✅ DATABASE_URL is configured');
}

// Set development environment
process.env.NODE_ENV = 'development';
process.env.LOG_LEVEL = 'error';

// Force Prisma to reconnect with new DATABASE_URL
// Clear global Prisma instance if it exists
if (global.__prisma) {
  try {
    await global.__prisma.$disconnect();
  } catch (e) {
    // Ignore disconnect errors
  }
  delete global.__prisma;
}

// Now import services (Prisma will use DATABASE_URL from .env)
import { request } from '../helpers/test-client.js';
import prisma from '../../services/prisma.js';
import billingService from '../../services/billing.js';
// import * as stripeService from '../../services/stripe.js'; // Unused in this test file

const DEV_STORE_DOMAIN = 'sms-blossom-dev.myshopify.com';

describe('Billing Endpoints - Development Tests (sms-blossom-dev)', () => {
  let devStore;
  let devStoreId;
  let testHeaders;

  beforeAll(async () => {
    // Find dev store
    devStore = await prisma.shop.findUnique({
      where: { shopDomain: DEV_STORE_DOMAIN },
    });

    if (!devStore) {
      throw new Error(`Dev store ${DEV_STORE_DOMAIN} not found. Run seed script first.`);
    }

    devStoreId = devStore.id;
    testHeaders = {
      'X-Shopify-Shop-Domain': DEV_STORE_DOMAIN,
      'Content-Type': 'application/json',
    };

    console.log(`\n📦 Using dev store: ${DEV_STORE_DOMAIN}`);
    console.log(`   Store ID: ${devStoreId}`);
    console.log(`   Current Credits: ${devStore.credits}`);
  });

  afterAll(async () => {
    // Don't disconnect - keep connection for other tests
  });

  describe('GET /billing/balance', () => {
    it('should return current credit balance for dev store', async () => {
      const res = await request()
        .get('/billing/balance')
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('balance');
      expect(res.body.data).toHaveProperty('credits');
      expect(res.body.data).toHaveProperty('currency');
      expect(res.body.data.balance).toBeGreaterThanOrEqual(0);
      expect(res.body.data.currency).toBe('EUR');

      console.log(`   ✅ Balance: ${res.body.data.balance} credits`);
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
      expect(res.body.data.packages.length).toBe(4);

      // Verify all packages exist
      const packageIds = res.body.data.packages.map(p => p.id);
      expect(packageIds).toContain('package_1000');
      expect(packageIds).toContain('package_5000');
      expect(packageIds).toContain('package_10000');
      expect(packageIds).toContain('package_25000');

      console.log(`   ✅ Found ${res.body.data.packages.length} packages`);
    });

    it('should return packages with EUR pricing', async () => {
      const res = await request()
        .get('/billing/packages')
        .set(testHeaders);

      res.body.data.packages.forEach(pkg => {
        expect(pkg.currency).toBe('EUR');
        expect(pkg.price).toBeGreaterThan(0);
      });
    });
  });

  describe('GET /billing/history', () => {
    it('should return wallet transaction history', async () => {
      const res = await request()
        .get('/billing/history?page=1&pageSize=10')
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('transactions');
      expect(res.body.data).toHaveProperty('pagination');
      expect(Array.isArray(res.body.data.transactions)).toBe(true);

      console.log(`   ✅ Found ${res.body.data.transactions.length} wallet transactions`);
    });

    it('should filter transactions by type', async () => {
      const res = await request()
        .get('/billing/history?type=purchase')
        .set(testHeaders);

      expect(res.status).toBe(200);
      if (res.body.data.transactions.length > 0) {
        res.body.data.transactions.forEach(transaction => {
          expect(transaction.type).toBe('purchase');
        });
      }
    });
  });

  describe('GET /billing/billing-history', () => {
    it('should return billing transaction history', async () => {
      const res = await request()
        .get('/billing/billing-history?page=1&pageSize=10')
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('transactions');
      expect(res.body.data).toHaveProperty('pagination');
      expect(Array.isArray(res.body.data.transactions)).toBe(true);

      console.log(`   ✅ Found ${res.body.data.transactions.length} billing transactions`);
    });

    it('should filter transactions by status', async () => {
      const res = await request()
        .get('/billing/billing-history?status=completed')
        .set(testHeaders);

      expect(res.status).toBe(200);
      if (res.body.data.transactions.length > 0) {
        res.body.data.transactions.forEach(transaction => {
          expect(transaction.status).toBe('completed');
        });
      }
    });
  });

  describe('POST /billing/purchase', () => {
    // Note: Stripe will be mocked at runtime if STRIPE_SECRET_KEY is not set
    // For development, we can use a test key or let it fail gracefully

    it('should create Stripe checkout session for valid package', async () => {
      const purchaseData = {
        packageId: 'package_1000',
        successUrl: 'http://localhost:3000/success',
        cancelUrl: 'http://localhost:3000/cancel',
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

      console.log(`   ✅ Created checkout session: ${res.body.data.sessionId}`);
    });

    it('should create BillingTransaction record', async () => {
      const purchaseData = {
        packageId: 'package_5000',
        successUrl: 'http://localhost:3000/success',
        cancelUrl: 'http://localhost:3000/cancel',
      };

      const res = await request()
        .post('/billing/purchase')
        .set(testHeaders)
        .send(purchaseData);

      const transaction = await prisma.billingTransaction.findUnique({
        where: { id: res.body.data.transactionId },
      });

      expect(transaction).toBeTruthy();
      expect(transaction.shopId).toBe(devStoreId);
      expect(transaction.status).toBe('pending');
      expect(transaction.creditsAdded).toBe(5000);
      expect(transaction.packageType).toBe('package_5000');

      console.log(`   ✅ Created transaction: ${transaction.id}`);
    });

    it('should reject invalid package', async () => {
      const purchaseData = {
        packageId: 'invalid_package',
        successUrl: 'http://localhost:3000/success',
        cancelUrl: 'http://localhost:3000/cancel',
      };

      const res = await request()
        .post('/billing/purchase')
        .set(testHeaders)
        .send(purchaseData);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Credit Management - addCredits', () => {
    it('should add credits to dev store', async () => {
      const initialCredits = devStore.credits;

      await billingService.addCredits(
        devStoreId,
        1000,
        'test:dev_add_credits',
        { test: true },
      );

      const updatedStore = await prisma.shop.findUnique({
        where: { id: devStoreId },
        select: { credits: true },
      });

      expect(updatedStore.credits).toBe(initialCredits + 1000);
      console.log(`   ✅ Added 1000 credits. New balance: ${updatedStore.credits}`);
    });

    it('should create WalletTransaction when adding credits', async () => {
      await billingService.addCredits(
        devStoreId,
        500,
        'test:dev_wallet_transaction',
        { description: 'Test credit addition' },
      );

      const transaction = await prisma.walletTransaction.findFirst({
        where: {
          shopId: devStoreId,
          ref: 'test:dev_wallet_transaction',
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(transaction).toBeTruthy();
      expect(transaction.type).toBe('purchase');
      expect(transaction.credits).toBe(500);
    });
  });

  describe('Credit Management - deductCredits', () => {
    it('should deduct credits from dev store', async () => {
      const store = await prisma.shop.findUnique({
        where: { id: devStoreId },
        select: { credits: true },
      });

      const initialCredits = store.credits;

      if (initialCredits >= 100) {
        await billingService.deductCredits(
          devStoreId,
          100,
          'test:dev_deduct_credits',
          { test: true },
        );

        const updatedStore = await prisma.shop.findUnique({
          where: { id: devStoreId },
          select: { credits: true },
        });

        expect(updatedStore.credits).toBe(initialCredits - 100);
        console.log(`   ✅ Deducted 100 credits. New balance: ${updatedStore.credits}`);
      } else {
        console.log(`   ⚠️  Skipping - insufficient credits (${initialCredits})`);
      }
    });
  });

  describe('Stripe Webhook Handling', () => {
    it('should handle checkout.session.completed webhook', async () => {
      // Create pending transaction
      const transaction = await prisma.billingTransaction.create({
        data: {
          shopId: devStoreId,
          creditsAdded: 1000,
          amount: 2999,
          currency: 'EUR',
          packageType: 'package_1000',
          stripeSessionId: 'cs_test_webhook_dev',
          status: 'pending',
        },
      });

      const store = await prisma.shop.findUnique({
        where: { id: devStoreId },
        select: { credits: true },
      });
      const initialCredits = store.credits;

      // Simulate webhook event
      const event = {
        type: 'checkout.session.completed',
        id: `evt_test_dev_${Date.now()}`,
        data: {
          object: {
            id: 'cs_test_webhook_dev',
            payment_status: 'paid',
            payment_intent: 'pi_test_webhook_dev',
            metadata: {
              storeId: devStoreId,
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

      // Verify credits were added
      const updatedStore = await prisma.shop.findUnique({
        where: { id: devStoreId },
        select: { credits: true },
      });
      expect(updatedStore.credits).toBe(initialCredits + 1000);

      console.log(`   ✅ Webhook processed. Credits added: 1000. New balance: ${updatedStore.credits}`);
    });

    it('should handle idempotency - prevent double processing', async () => {
      // Create completed transaction
      const transaction = await prisma.billingTransaction.create({
        data: {
          shopId: devStoreId,
          creditsAdded: 1000,
          amount: 2999,
          currency: 'EUR',
          packageType: 'package_1000',
          stripeSessionId: 'cs_test_idempotent_dev',
          stripePaymentId: 'pi_test_idempotent_dev',
          status: 'completed',
        },
      });

      const store = await prisma.shop.findUnique({
        where: { id: devStoreId },
        select: { credits: true },
      });
      const initialCredits = store.credits;

      // Try to process same event again
      const event = {
        type: 'checkout.session.completed',
        id: 'evt_test_idempotent',
        data: {
          object: {
            id: 'cs_test_idempotent_dev',
            payment_status: 'paid',
            payment_intent: 'pi_test_idempotent_dev',
            metadata: {
              storeId: devStoreId,
              transactionId: transaction.id,
              credits: '1000',
            },
          },
        },
      };

      const result = await billingService.handleStripeWebhook(event);
      expect(result.status).toBe('already_processed');

      // Verify credits were NOT added again
      const updatedStore = await prisma.shop.findUnique({
        where: { id: devStoreId },
        select: { credits: true },
      });
      expect(updatedStore.credits).toBe(initialCredits);

      console.log(`   ✅ Idempotency check passed. Credits unchanged: ${updatedStore.credits}`);
    });
  });

  describe('End-to-End Flow Test', () => {
    it('should complete full purchase flow', async () => {
      // 1. Get initial balance
      const balanceRes = await request()
        .get('/billing/balance')
        .set(testHeaders);
      const initialBalance = balanceRes.body.data.balance;

      // 2. Create purchase session
      const purchaseData = {
        packageId: 'package_1000',
        successUrl: 'http://localhost:3000/success',
        cancelUrl: 'http://localhost:3000/cancel',
      };

      const purchaseRes = await request()
        .post('/billing/purchase')
        .set(testHeaders)
        .send(purchaseData);

      expect(purchaseRes.status).toBe(200);
      const transactionId = purchaseRes.body.data.transactionId;

      // 3. Simulate webhook completion
      const event = {
        type: 'checkout.session.completed',
        id: 'evt_e2e_test',
        data: {
          object: {
            id: purchaseRes.body.data.sessionId,
            payment_status: 'paid',
            payment_intent: 'pi_e2e_test',
            metadata: {
              storeId: devStoreId,
              transactionId,
              credits: '1000',
              packageId: 'package_1000',
            },
          },
        },
      };

      await billingService.handleStripeWebhook(event);

      // 4. Verify final balance
      const finalBalanceRes = await request()
        .get('/billing/balance')
        .set(testHeaders);
      const finalBalance = finalBalanceRes.body.data.balance;

      expect(finalBalance).toBe(initialBalance + 1000);

      console.log('\n   ✅ End-to-End Flow Test:');
      console.log(`      Initial Balance: ${initialBalance}`);
      console.log('      Credits Added: 1000');
      console.log(`      Final Balance: ${finalBalance}`);
    });
  });
});

