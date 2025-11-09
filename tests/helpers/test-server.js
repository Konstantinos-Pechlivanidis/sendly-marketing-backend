import axios from 'axios';
import { testConfig, createTestHeaders, getTestUrl } from '../config/test-config.js';

/**
 * Test Server Helper
 * Creates requests to production server for API testing
 */

/**
 * Create authenticated request to production server
 */
export function createAuthenticatedRequest(shopDomain = testConfig.testShop.shopDomain) {
  const headers = createTestHeaders(shopDomain);

  // Use axios for production server requests
  return {
    get: (path) => axios.get(getTestUrl(path), { headers }),
    post: (path, data) => axios.post(getTestUrl(path), data, { headers }),
    put: (path, data) => axios.put(getTestUrl(path), data, { headers }),
    delete: (path) => axios.delete(getTestUrl(path), { headers }),
    patch: (path, data) => axios.patch(getTestUrl(path), data, { headers }),
  };
}

/**
 * Create unauthenticated request to production server
 */
export function createRequest() {
  return {
    get: (path) => axios.get(getTestUrl(path)),
    post: (path, data) => axios.post(getTestUrl(path), data),
    put: (path, data) => axios.put(getTestUrl(path), data),
    delete: (path) => axios.delete(getTestUrl(path)),
    patch: (path, data) => axios.patch(getTestUrl(path), data),
  };
}

/**
 * Helper to convert axios response to supertest-like format for compatibility
 */
export function normalizeResponse(axiosResponse) {
  return {
    status: axiosResponse.status,
    statusCode: axiosResponse.status,
    body: axiosResponse.data,
    headers: axiosResponse.headers,
    text: JSON.stringify(axiosResponse.data),
  };
}

/**
 * Test helper for common assertions
 */
export function expectSuccessResponse(res) {
  const response = res.status ? res : normalizeResponse(res);
  expect(response.status).toBeLessThan(400);
  expect(response.body).toHaveProperty('success', true);
  expect(response.body).toHaveProperty('data');
}

export function expectErrorResponse(res, statusCode = 400) {
  const response = res.status ? res : normalizeResponse(res);
  expect(response.status).toBe(statusCode);
  expect(response.body).toHaveProperty('success', false);
  expect(response.body).toHaveProperty('error');
}

export default {
  createAuthenticatedRequest,
  createRequest,
  expectSuccessResponse,
  expectErrorResponse,
  normalizeResponse,
};

