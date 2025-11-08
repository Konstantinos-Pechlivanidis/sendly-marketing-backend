/**
 * Test Setup
 * Configures test environment before each test suite
 */

import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/sendly_test';

// Disable logging in tests (optional)
process.env.LOG_LEVEL = 'error';

// Mock external services
process.env.MITTO_API_KEY = 'test_key';
process.env.SHOPIFY_API_KEY = 'test_key';
process.env.SHOPIFY_API_SECRET = 'test_secret';
process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Mock logger to reduce noise in tests
const originalLog = console.log;
const originalError = console.error;

console.log = () => {};
console.error = () => {};

// Restore console after tests
if (typeof afterAll !== 'undefined') {
  afterAll(() => {
    console.log = originalLog;
    console.error = originalError;
  });
}
