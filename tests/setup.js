/* eslint-disable no-console */
/**
 * Test Setup
 * Configures test environment before each test suite
 * Uses production .env variables for testing against production server
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load production .env file from project root FIRST
dotenv.config({ path: join(__dirname, '../.env') });

// Import test config to validate environment
// Production env variables are loaded from production-env.js
import { logTestEnvironment, testConfig } from './config/test-config.js';
import { checkTestRedisConnection, verifyRedisConfig } from './helpers/redis-check.js';
import { logEnvironmentVerification, verifyRedisProductionConfig } from './helpers/env-verification.js';
import { closeTestRedisClient } from './helpers/redis-client.js';

// Use production environment variables
// Tests will run against production server on port 3000
// Default shop: sms-blossom-dev.myshopify.com

// Set test-specific overrides (if needed)
// Keep production values but allow test-specific overrides
process.env.TEST_BASE_URL = process.env.TEST_BASE_URL || process.env.HOST || 'http://localhost:3000';
// Normalize shop domain (add .myshopify.com if missing)
const shopDomain = process.env.TEST_SHOP_DOMAIN || 'sms-blossom-dev';
process.env.TEST_SHOP_DOMAIN = shopDomain.includes('.myshopify.com') ? shopDomain : `${shopDomain}.myshopify.com`;
process.env.TEST_DATA_PREFIX = process.env.TEST_DATA_PREFIX || 'TEST_';
process.env.TEST_CLEANUP = process.env.TEST_CLEANUP !== 'false' ? 'true' : 'false';

// Log level for tests (can be overridden)
if (!process.env.LOG_LEVEL) {
  process.env.LOG_LEVEL = 'info';
}

// Validate and log test environment
const validation = logTestEnvironment();

if (!validation.valid) {
  console.error('❌ Test environment validation failed. Please fix the errors above.');
  process.exit(1);
}

// Verify all environment variables are loaded correctly
const envVerification = logEnvironmentVerification();
if (!envVerification) {
  console.error('❌ Critical environment variables are missing. Please check your .env file.');
  process.exit(1);
}

// Verify Redis configuration matches production
const redisConfigCheck = verifyRedisConfig();
const redisProductionCheck = verifyRedisProductionConfig();

if (!redisConfigCheck.valid || !redisProductionCheck.valid) {
  console.warn('\n⚠️  Redis configuration issues:');
  [...(redisConfigCheck.issues || []), ...(redisProductionCheck.issues || [])].forEach(issue =>
    console.warn(`   - ${issue}`),
  );
  if (redisProductionCheck.warnings && redisProductionCheck.warnings.length > 0) {
    redisProductionCheck.warnings.forEach(warning => console.warn(`   ⚠️  ${warning}`));
  }
}

// Check Redis connection (async - will be checked when tests run)
// We log it but don't block tests if Redis is not available
setTimeout(async () => {
  await checkTestRedisConnection();
}, 100);

// Cleanup on exit
process.on('exit', async () => {
  await closeTestRedisClient();
});

process.on('SIGINT', async () => {
  await closeTestRedisClient();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeTestRedisClient();
  process.exit(0);
});

console.log(`🧹 Test Cleanup: ${process.env.TEST_CLEANUP === 'true' ? 'Enabled' : 'Disabled'}`);
console.log(`🏪 Test Shop: ${testConfig.testShop.shopDomain}`);
console.log('✅ Test environment configured and ready\n');
