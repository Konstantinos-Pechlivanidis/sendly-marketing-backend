/* eslint-disable no-console */
/**
 * Test Configuration
 * Uses hard-coded production environment variables from env_data.md
 */

import { PRODUCTION_ENV, setProductionEnv } from './production-env.js';

// Set production environment variables
setProductionEnv();

/**
 * Get test configuration from environment variables
 * Uses production .env variables for all services (Redis, Mitto, Stripe, Shopify)
 */
export const testConfig = {
  // Production server URL
  baseUrl: process.env.TEST_BASE_URL || PRODUCTION_ENV.HOST || 'http://localhost:3000',

  // Shop domain - sms-blossom-dev.myshopify.com
  shopDomain: PRODUCTION_ENV.TEST_SHOP_DOMAIN,

  // Database connection (production database)
  databaseUrl: PRODUCTION_ENV.DATABASE_URL,

  // Shopify credentials (from production env)
  shopifyApiKey: PRODUCTION_ENV.SHOPIFY_API_KEY,
  shopifyApiSecret: PRODUCTION_ENV.SHOPIFY_API_SECRET,
  shopifyScopes: PRODUCTION_ENV.SCOPES,

  // Redis configuration (from production env - Redis Cloud)
  redis: {
    host: PRODUCTION_ENV.REDIS_HOST,
    port: PRODUCTION_ENV.REDIS_PORT,
    username: PRODUCTION_ENV.REDIS_USERNAME,
    password: PRODUCTION_ENV.REDIS_PASSWORD,
    db: 0,
  },

  // Mitto SMS configuration (from production env)
  mitto: {
    apiBase: PRODUCTION_ENV.MITTO_API_BASE,
    apiKey: PRODUCTION_ENV.MITTO_API_KEY,
    trafficAccountId: PRODUCTION_ENV.MITTO_TRAFFIC_ACCOUNT_ID,
    senderName: PRODUCTION_ENV.MITTO_SENDER_NAME,
    webhookSecret: PRODUCTION_ENV.MITTO_WEBHOOK_SECRET,
  },

  // Stripe configuration (from production env)
  stripe: {
    secretKey: PRODUCTION_ENV.STRIPE_SECRET_KEY,
    webhookSecret: PRODUCTION_ENV.STRIPE_WEBHOOK_SECRET,
    priceIds: {
      eur: {
        '1000': PRODUCTION_ENV.STRIPE_PRICE_ID_1000_EUR,
        '5000': PRODUCTION_ENV.STRIPE_PRICE_ID_5000_EUR,
        '10000': PRODUCTION_ENV.STRIPE_PRICE_ID_10000_EUR,
        '25000': PRODUCTION_ENV.STRIPE_PRICE_ID_25000_EUR,
      },
      usd: {
        '1000': PRODUCTION_ENV.STRIPE_PRICE_ID_1000_USD,
        '5000': PRODUCTION_ENV.STRIPE_PRICE_ID_5000_USD,
        '10000': PRODUCTION_ENV.STRIPE_PRICE_ID_10000_USD,
        '25000': PRODUCTION_ENV.STRIPE_PRICE_ID_25000_USD,
      },
    },
  },

  // Test shop configuration - sms-blossom-dev.myshopify.com
  testShop: {
    shopDomain: PRODUCTION_ENV.TEST_SHOP_DOMAIN,
    shopName: PRODUCTION_ENV.TEST_SHOP_NAME,
    accessToken: process.env.TEST_SHOP_ACCESS_TOKEN || 'pending',
    credits: PRODUCTION_ENV.TEST_SHOP_CREDITS,
    currency: PRODUCTION_ENV.TEST_SHOP_CURRENCY,
  },

  // Test data configuration
  testData: {
    prefix: 'TEST_',
    cleanup: process.env.TEST_CLEANUP !== 'false',
  },
};

/**
 * Create test headers with shop domain
 */
export function createTestHeaders(shopDomain = testConfig.testShop.shopDomain) {
  return {
    'X-Shopify-Shop-Domain': shopDomain,
    'Content-Type': 'application/json',
    ...(process.env.TEST_AUTH_TOKEN && {
      'Authorization': `Bearer ${process.env.TEST_AUTH_TOKEN}`,
    }),
  };
}

/**
 * Get full URL for an endpoint
 */
export function getTestUrl(path) {
  const baseUrl = testConfig.baseUrl.replace(/\/$/, ''); // Remove trailing slash
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

/**
 * Validate that all required .env variables are present
 */
export function validateTestEnvironment() {
  const errors = [];
  const warnings = [];

  // Required for production testing
  if (!testConfig.databaseUrl) {
    errors.push('DATABASE_URL is required');
  }

  if (!testConfig.shopifyApiKey || !testConfig.shopifyApiSecret) {
    warnings.push('SHOPIFY_API_KEY and SHOPIFY_API_SECRET should be set for full testing');
  }

  // Redis validation
  if (!testConfig.redis.url && !testConfig.redis.host) {
    warnings.push('REDIS_URL or REDIS_HOST should be set for queue/cache testing');
  }

  // Mitto validation
  if (!testConfig.mitto.apiKey) {
    warnings.push('MITTO_API_KEY should be set for SMS testing');
  }

  // Stripe validation
  if (!testConfig.stripe.secretKey) {
    warnings.push('STRIPE_SECRET_KEY should be set for billing testing');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Log test environment configuration
 */
export function logTestEnvironment() {
  const validation = validateTestEnvironment();

  console.log('\n🧪 Test Environment Configuration:');
  console.log(`📡 Base URL: ${testConfig.baseUrl}`);
  console.log(`🏪 Shop Domain: ${testConfig.testShop.shopDomain}`);
  console.log(`🗄️  Database: ${testConfig.databaseUrl ? '✅ Configured' : '❌ Missing'}`);
  console.log(`🔴 Redis: ${testConfig.redis.url || testConfig.redis.host ? '✅ Configured' : '⚠️  Not configured'}`);
  console.log(`📱 Mitto: ${testConfig.mitto.apiKey ? '✅ Configured' : '⚠️  Not configured'}`);
  console.log(`💳 Stripe: ${testConfig.stripe.secretKey ? '✅ Configured' : '⚠️  Not configured'}`);
  console.log(`🔑 Shopify: ${testConfig.shopifyApiKey ? '✅ Configured' : '⚠️  Not configured'}`);

  if (validation.errors.length > 0) {
    console.log('\n❌ Errors:');
    validation.errors.forEach(error => console.log(`   - ${error}`));
  }

  if (validation.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    validation.warnings.forEach(warning => console.log(`   - ${warning}`));
  }

  console.log('');

  return validation;
}

export default testConfig;

