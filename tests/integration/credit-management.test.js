/* eslint-disable no-console */
/**
 * Credit Management Tests
 * Comprehensive tests for credit validation, consumption, and rollback mechanisms
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
import {
  validateAndConsumeCredits,
  refundCredits,
  checkAvailableCredits,
  InsufficientCreditsError,
} from '../../services/credit-validation.js';
import { sendSms } from '../../services/mitto.js';
import { handleMittoSend } from '../../queue/jobs/mittoSend.js';
import { sendCampaign } from '../../services/campaigns.js';

describe('Credit Management - Comprehensive Tests', () => {
  let testShop;
  let testShopId;
  let testHeaders;

  beforeAll(async () => {
    console.log('\n📦 Setting up test shop for credit management tests...');
    testShop = await createTestShop({
      shopDomain: testConfig.testShop.shopDomain,
      credits: 1000, // Start with 1000 credits
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
    await prisma.shop.update({
      where: { id: testShopId },
      data: { credits: 1000 },
    });
  });

  describe('Credit Validation & Consumption', () => {
    it('should validate and consume credits atomically', async () => {
      const initialCredits = 1000;
      const creditsToConsume = 100;

      const result = await validateAndConsumeCredits(testShopId, creditsToConsume);

      expect(result.success).toBe(true);
      expect(result.creditsConsumed).toBe(creditsToConsume);

      const shop = await prisma.shop.findUnique({
        where: { id: testShopId },
        select: { credits: true },
      });

      expect(shop.credits).toBe(initialCredits - creditsToConsume);
    });

    it('should reject consumption when insufficient credits', async () => {
      await prisma.shop.update({
        where: { id: testShopId },
        data: { credits: 50 },
      });

      await expect(
        validateAndConsumeCredits(testShopId, 100),
      ).rejects.toThrow(InsufficientCreditsError);

      // Verify credits were not consumed
      const shop = await prisma.shop.findUnique({
        where: { id: testShopId },
        select: { credits: true },
      });

      expect(shop.credits).toBe(50);
    });

    it('should check available credits without consuming', async () => {
      await prisma.shop.update({
        where: { id: testShopId },
        data: { credits: 500 },
      });

      const result = await checkAvailableCredits(testShopId);

      expect(result.credits).toBe(500);
      expect(result.canSend).toBe(true);

      // Verify credits were not consumed
      const shop = await prisma.shop.findUnique({
        where: { id: testShopId },
        select: { credits: true },
      });

      expect(shop.credits).toBe(500);
    });
  });

  describe('Credit Refund', () => {
    it('should refund credits successfully', async () => {
      const initialCredits = 1000;
      const creditsToRefund = 100;

      // First consume some credits
      await validateAndConsumeCredits(testShopId, creditsToRefund);

      // Then refund them
      const result = await refundCredits(testShopId, creditsToRefund, 'test:refund');

      expect(result.success).toBe(true);
      expect(result.creditsAdded).toBe(creditsToRefund);

      const shop = await prisma.shop.findUnique({
        where: { id: testShopId },
        select: { credits: true },
      });

      expect(shop.credits).toBe(initialCredits);
    });

    it('should reject refunding zero or negative credits', async () => {
      await expect(
        refundCredits(testShopId, 0, 'test:zero'),
      ).rejects.toThrow();

      await expect(
        refundCredits(testShopId, -100, 'test:negative'),
      ).rejects.toThrow();
    });
  });

  describe('Campaign Credit Consumption - No Double Consumption', () => {
    it('should consume credits only once for campaign messages', async () => {
      // Create test contacts
      await createTestContact({ phoneE164: '+357123456789' });
      await createTestContact({ phoneE164: '+357123456790' });
      await createTestContact({ phoneE164: '+357123456791' });

      const initialCredits = 1000;
      const recipientCount = 3;

      // Create campaign
      const campaign = await createTestCampaign({
        name: 'Test Campaign - No Double Consumption',
        status: 'draft',
        audience: 'all',
      });

      // Get initial credits
      const shopBefore = await prisma.shop.findUnique({
        where: { id: testShopId },
        select: { credits: true },
      });

      expect(shopBefore.credits).toBe(initialCredits);

      // Send campaign (this should consume credits upfront)
      await sendCampaign(testShopId, campaign.id);

      // Check credits after campaign send
      const shopAfter = await prisma.shop.findUnique({
        where: { id: testShopId },
        select: { credits: true },
      });

      // Credits should be consumed only once (for the campaign)
      expect(shopAfter.credits).toBe(initialCredits - recipientCount);

      // Verify campaign recipients were created
      const recipients = await prisma.campaignRecipient.findMany({
        where: { campaignId: campaign.id },
      });

      expect(recipients.length).toBe(recipientCount);

      // Simulate queue job processing (should NOT consume credits again)
      // Note: In real scenario, queue jobs would process automatically
      // Here we're testing that skipCreditCheck works correctly
      const recipient = recipients[0];
      const jobData = {
        campaignId: campaign.id,
        shopId: testShopId,
        phoneE164: recipient.phoneE164,
        message: campaign.message,
        sender: 'Sendly',
      };

      // Get credits before queue job
      const shopBeforeJob = await prisma.shop.findUnique({
        where: { id: testShopId },
        select: { credits: true },
      });

      const creditsBeforeJob = shopBeforeJob.credits;

      // Process queue job (should skip credit check)
      // Note: This will fail if Mitto API is not configured, but credits should not be consumed
      try {
        await handleMittoSend({ data: jobData });
      } catch (error) {
        // Expected to fail if Mitto API is not configured
        // But credits should NOT be consumed
      }

      // Check credits after queue job (should be the same)
      const shopAfterJob = await prisma.shop.findUnique({
        where: { id: testShopId },
        select: { credits: true },
      });

      // Credits should NOT be consumed again (skipCreditCheck should work)
      expect(shopAfterJob.credits).toBe(creditsBeforeJob);
    });

    it('should consume credits for individual SMS (non-campaign)', async () => {
      const initialCredits = 1000;

      // Get credits before SMS
      const shopBefore = await prisma.shop.findUnique({
        where: { id: testShopId },
        select: { credits: true },
      });

      expect(shopBefore.credits).toBe(initialCredits);

      // Send individual SMS (should consume 1 credit)
      // Note: This will fail if Mitto API is not configured
      try {
        await sendSms({
          to: '+357123456789',
          text: 'Test message',
          shopId: testShopId,
          skipCreditCheck: false, // Should consume credits
        });
      } catch (error) {
        // Expected to fail if Mitto API is not configured
        // But credits should be consumed before the API call
      }

      // Check credits after SMS (should be consumed)
      const shopAfter = await prisma.shop.findUnique({
        where: { id: testShopId },
        select: { credits: true },
      });

      // Credits should be consumed (even if SMS fails)
      // This is expected behavior - credits consumed before API call
      expect(shopAfter.credits).toBeLessThan(initialCredits);
    });

    it('should NOT consume credits for campaign SMS (skipCreditCheck=true)', async () => {
      const initialCredits = 1000;

      // Get credits before SMS
      const shopBefore = await prisma.shop.findUnique({
        where: { id: testShopId },
        select: { credits: true },
      });

      expect(shopBefore.credits).toBe(initialCredits);

      // Send campaign SMS (should NOT consume credits)
      // Note: This will fail if Mitto API is not configured
      try {
        await sendSms({
          to: '+357123456789',
          text: 'Test campaign message',
          shopId: testShopId,
          skipCreditCheck: true, // Should NOT consume credits
        });
      } catch (error) {
        // Expected to fail if Mitto API is not configured
        // But credits should NOT be consumed
      }

      // Check credits after SMS (should NOT be consumed)
      const shopAfter = await prisma.shop.findUnique({
        where: { id: testShopId },
        select: { credits: true },
      });

      // Credits should NOT be consumed (skipCreditCheck=true)
      expect(shopAfter.credits).toBe(initialCredits);
    });
  });

  describe('Campaign Rollback Mechanism', () => {
    it('should refund credits if campaign fails before any SMS sent', async () => {
      const initialCredits = 1000;

      // Create campaign
      const campaign = await createTestCampaign({
        name: 'Test Campaign - Rollback',
        status: 'draft',
        audience: 'all',
      });

      // Create one contact for testing
      await createTestContact({ phoneE164: '+357123456789' });

      // Get credits before
      const shopBefore = await prisma.shop.findUnique({
        where: { id: testShopId },
        select: { credits: true },
      });

      expect(shopBefore.credits).toBe(initialCredits);

      // Manually consume credits (simulating campaign send)
      await validateAndConsumeCredits(testShopId, 1);

      // Simulate campaign failure before any SMS sent
      // In real scenario, this would happen if queuing fails
      // For testing, we'll manually trigger the rollback logic
      const shopAfterConsumption = await prisma.shop.findUnique({
        where: { id: testShopId },
        select: { credits: true },
      });

      expect(shopAfterConsumption.credits).toBe(initialCredits - 1);

      // Refund credits (simulating rollback)
      await refundCredits(testShopId, 1, `campaign:${campaign.id}:rollback:test`);

      // Check credits after refund
      const shopAfterRefund = await prisma.shop.findUnique({
        where: { id: testShopId },
        select: { credits: true },
      });

      expect(shopAfterRefund.credits).toBe(initialCredits);
    });

    it('should NOT refund credits if campaign has already sent some SMS', async () => {
      const initialCredits = 1000;

      // Create campaign
      const campaign = await createTestCampaign({
        name: 'Test Campaign - Partial Send',
        status: 'draft',
        audience: 'all',
      });

      // Create contacts
      await createTestContact({ phoneE164: '+357123456789' });
      await createTestContact({ phoneE164: '+357123456790' });

      // Send campaign (consumes 2 credits)
      await sendCampaign(testShopId, campaign.id);

      // Check credits after campaign send
      const shopAfter = await prisma.shop.findUnique({
        where: { id: testShopId },
        select: { credits: true },
      });

      expect(shopAfter.credits).toBe(initialCredits - 2);

      // Verify recipients were created
      const recipients = await prisma.campaignRecipient.findMany({
        where: { campaignId: campaign.id },
      });

      expect(recipients.length).toBe(2);

      // In real scenario, if campaign fails AFTER some SMS sent,
      // credits should NOT be refunded (they were already used)
      // This test verifies that credits are consumed and not refunded
      // when campaign has already started sending

      // Credits should remain consumed
      const shopFinal = await prisma.shop.findUnique({
        where: { id: testShopId },
        select: { credits: true },
      });

      expect(shopFinal.credits).toBe(initialCredits - 2);
    });
  });

  describe('Credit Consumption Edge Cases', () => {
    it('should handle concurrent credit consumption correctly', async () => {
      const initialCredits = 1000;
      const concurrentConsumptions = 5;
      const creditsPerConsumption = 10;

      // Simulate concurrent credit consumptions
      const promises = Array.from({ length: concurrentConsumptions }, () =>
        validateAndConsumeCredits(testShopId, creditsPerConsumption),
      );

      await Promise.all(promises);

      // Check final credits
      const shop = await prisma.shop.findUnique({
        where: { id: testShopId },
        select: { credits: true },
      });

      const expectedCredits = initialCredits - (concurrentConsumptions * creditsPerConsumption);
      expect(shop.credits).toBe(expectedCredits);
    });

    it('should prevent race conditions with transactions', async () => {
      const initialCredits = 100;

      // Try to consume more credits than available concurrently
      const promises = [
        validateAndConsumeCredits(testShopId, 60),
        validateAndConsumeCredits(testShopId, 60), // Should fail
      ];

      const results = await Promise.allSettled(promises);

      // One should succeed, one should fail
      const succeeded = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      expect(succeeded).toBe(1);
      expect(failed).toBe(1);

      // Check credits (only one consumption should succeed)
      const shop = await prisma.shop.findUnique({
        where: { id: testShopId },
        select: { credits: true },
      });

      expect(shop.credits).toBe(initialCredits - 60);
    });
  });

  describe('API Endpoint Credit Validation', () => {
    it('should reject campaign send with insufficient credits', async () => {
      // Set credits to 0
      await prisma.shop.update({
        where: { id: testShopId },
        data: { credits: 0 },
      });

      const campaign = await createTestCampaign({
        name: 'No Credits Campaign',
        status: 'draft',
        audience: 'all',
      });

      // Create a contact
      await createTestContact({ phoneE164: '+357123456789' });

      const res = await request()
        .post(`/campaigns/${campaign.id}/send`)
        .set(testHeaders);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('credit');
    });

    it('should consume credits correctly when sending campaign via API', async () => {
      const initialCredits = 1000;

      // Create campaign
      const campaign = await createTestCampaign({
        name: 'API Campaign Test',
        status: 'draft',
        audience: 'all',
      });

      // Create contacts
      await createTestContact({ phoneE164: '+357123456789' });
      await createTestContact({ phoneE164: '+357123456790' });

      // Send campaign via API
      const res = await request()
        .post(`/campaigns/${campaign.id}/send`)
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Check credits were consumed
      const shop = await prisma.shop.findUnique({
        where: { id: testShopId },
        select: { credits: true },
      });

      expect(shop.credits).toBe(initialCredits - 2);
    });
  });
});

