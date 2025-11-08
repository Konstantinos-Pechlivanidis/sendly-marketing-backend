/**
 * Mock Middleware for Testing
 * Provides mock implementations for middleware that require external services
 */

/**
 * Mock store resolution middleware
 * Creates a mock store context for testing
 */
export function mockStoreResolution(testShopId, testShopDomain) {
  return (req, res, next) => {
    // Set store context on request
    req.shop = {
      id: testShopId,
      shopDomain: testShopDomain,
      credits: 1000,
      currency: 'EUR',
    };
    req.storeId = testShopId;
    next();
  };
}

/**
 * Mock authentication middleware
 */
export function mockAuth() {
  return (req, res, next) => {
    // Skip authentication in tests
    next();
  };
}

export default {
  mockStoreResolution,
  mockAuth,
};

