import request from 'supertest';
import app from '../../app.js';

/**
 * Test Server Helper
 * Creates test server instance for API testing
 */

/**
 * Create authenticated request
 */
export function createAuthenticatedRequest(shopDomain = 'test-store.myshopify.com') {
  return request(app)
    .set('Authorization', 'Bearer test_token')
    .set('X-Shopify-Shop-Domain', shopDomain)
    .set('Content-Type', 'application/json');
}

/**
 * Create unauthenticated request
 */
export function createRequest() {
  return request(app);
}

/**
 * Test helper for common assertions
 */
export function expectSuccessResponse(res) {
  expect(res.status).toBeLessThan(400);
  expect(res.body).toHaveProperty('success', true);
  expect(res.body).toHaveProperty('data');
}

export function expectErrorResponse(res, statusCode = 400) {
  expect(res.status).toBe(statusCode);
  expect(res.body).toHaveProperty('success', false);
  expect(res.body).toHaveProperty('error');
}

export default {
  createAuthenticatedRequest,
  createRequest,
  expectSuccessResponse,
  expectErrorResponse,
};

