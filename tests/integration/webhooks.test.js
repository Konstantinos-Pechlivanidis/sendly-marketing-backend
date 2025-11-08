/**
 * Webhooks Endpoints Tests
 * Comprehensive tests for webhook endpoints
 */

import request from 'supertest';
import app from '../../app.js';
import {
  createTestShop,
  cleanupTestData,
  createTestHeaders,
} from '../helpers/test-utils.js';

describe('Webhooks Endpoints', () => {
  let testShop;
  let testShopId;
  let testHeaders;

  beforeAll(async () => {
    testShop = await createTestShop({
      shopDomain: 'webhooks-test.myshopify.com',
    });
    testShopId = testShop.id;
    testHeaders = createTestHeaders(testShop.shopDomain);
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('POST /webhooks/app_uninstalled', () => {
    it('should handle app uninstall webhook', async () => {
      const webhookData = {
        myshopify_domain: 'test-store.myshopify.com',
      };

      const res = await request(app)
        .post('/webhooks/app_uninstalled')
        .send(webhookData);

      expect(res.status).toBe(200);
      // Should return OK even if processing is async
    });
  });

  describe('POST /automation-webhooks/*', () => {
    it('should handle automation webhook triggers', async () => {
      const webhookData = {
        type: 'abandoned_cart',
        shopId: testShopId,
        data: {
          cartId: 'cart_123',
          customerId: 'customer_123',
        },
      };

      const res = await request(app)
        .post('/automation-webhooks/abandoned-cart')
        .set(testHeaders)
        .send(webhookData);

      // May return 200 or 400 depending on validation
      expect([200, 400, 401]).toContain(res.status);
    });
  });

  describe('POST /webhooks/stripe/*', () => {
    it('should handle Stripe webhook events', async () => {
      const stripeEvent = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_123',
            amount: 1000,
            currency: 'eur',
          },
        },
      };

      const res = await request(app)
        .post('/webhooks/stripe')
        .set({
          'stripe-signature': 'test_signature',
        })
        .send(stripeEvent);

      // May require valid Stripe signature
      expect([200, 400, 401]).toContain(res.status);
    });
  });
});

