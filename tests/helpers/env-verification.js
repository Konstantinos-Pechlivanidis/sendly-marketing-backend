/* eslint-disable no-console */
/**
 * Environment Variables Verification
 * Ensures all production .env variables are properly loaded and used
 */

import { testConfig } from '../config/test-config.js';

/**
 * Verify that all critical .env variables are loaded
 */
export function verifyEnvironmentVariables() {
  const checks = {
    database: {
      configured: !!testConfig.databaseUrl,
      value: testConfig.databaseUrl ? '✅ Set' : '❌ Missing',
      required: true,
    },
    redis: {
      configured: !!(testConfig.redis.url || testConfig.redis.host),
      value: testConfig.redis.url
        ? '✅ REDIS_URL set'
        : testConfig.redis.host
          ? `✅ REDIS_HOST:${testConfig.redis.port} set`
          : '❌ Not configured',
      required: false,
    },
    mitto: {
      configured: !!testConfig.mitto.apiKey,
      value: testConfig.mitto.apiKey ? '✅ MITTO_API_KEY set' : '❌ Missing',
      required: false,
      details: {
        apiBase: testConfig.mitto.apiBase,
        trafficAccountId: testConfig.mitto.trafficAccountId ? '✅ Set' : '⚠️  Missing',
        senderName: testConfig.mitto.senderName,
      },
    },
    stripe: {
      configured: !!testConfig.stripe.secretKey,
      value: testConfig.stripe.secretKey ? '✅ STRIPE_SECRET_KEY set' : '❌ Missing',
      required: false,
      details: {
        webhookSecret: testConfig.stripe.webhookSecret ? '✅ Set' : '⚠️  Missing',
        priceIdsEUR: {
          '1000': testConfig.stripe.priceIds.eur['1000'] ? '✅' : '❌',
          '5000': testConfig.stripe.priceIds.eur['5000'] ? '✅' : '❌',
          '10000': testConfig.stripe.priceIds.eur['10000'] ? '✅' : '❌',
          '25000': testConfig.stripe.priceIds.eur['25000'] ? '✅' : '❌',
        },
      },
    },
    shopify: {
      configured: !!(testConfig.shopifyApiKey && testConfig.shopifyApiSecret),
      value: (testConfig.shopifyApiKey && testConfig.shopifyApiSecret)
        ? '✅ SHOPIFY_API_KEY & SECRET set'
        : '❌ Missing',
      required: false,
      details: {
        apiKey: testConfig.shopifyApiKey ? '✅ Set' : '❌ Missing',
        apiSecret: testConfig.shopifyApiSecret ? '✅ Set' : '❌ Missing',
        scopes: testConfig.shopifyScopes || '⚠️  Not set',
      },
    },
    shop: {
      configured: true,
      value: `✅ Shop: ${testConfig.testShop.shopDomain}`,
      required: true,
      details: {
        shopDomain: testConfig.testShop.shopDomain,
        shopName: testConfig.testShop.shopName,
        credits: testConfig.testShop.credits,
        currency: testConfig.testShop.currency,
      },
    },
  };

  return checks;
}

/**
 * Log environment variables verification
 */
export function logEnvironmentVerification() {
  const checks = verifyEnvironmentVariables();

  console.log('\n🔍 Environment Variables Verification:');
  console.log('═'.repeat(60));

  Object.entries(checks).forEach(([key, check]) => {
    const status = check.configured ? '✅' : check.required ? '❌' : '⚠️';
    console.log(`${status} ${key.toUpperCase()}: ${check.value}`);

    if (check.details) {
      Object.entries(check.details).forEach(([detailKey, detailValue]) => {
        if (typeof detailValue === 'object') {
          console.log(`   ${detailKey}:`);
          Object.entries(detailValue).forEach(([subKey, subValue]) => {
            console.log(`     - ${subKey}: ${subValue}`);
          });
        } else {
          console.log(`   - ${detailKey}: ${detailValue}`);
        }
      });
    }
  });

  console.log('═'.repeat(60));

  // Check for critical missing variables
  const criticalMissing = Object.entries(checks)
    .filter(([_, check]) => check.required && !check.configured)
    .map(([key]) => key);

  if (criticalMissing.length > 0) {
    console.log(`\n❌ Critical variables missing: ${criticalMissing.join(', ')}`);
    return false;
  }

  // Check for recommended missing variables
  const recommendedMissing = Object.entries(checks)
    .filter(([_, check]) => !check.required && !check.configured)
    .map(([key]) => key);

  if (recommendedMissing.length > 0) {
    console.log(`\n⚠️  Recommended variables missing: ${recommendedMissing.join(', ')}`);
    console.log('   Some tests may not work correctly without these variables.');
  }

  console.log('');
  return true;
}

/**
 * Verify Redis configuration matches production setup
 */
export function verifyRedisProductionConfig() {
  const redis = testConfig.redis;
  const issues = [];
  const warnings = [];

  // Check if Redis is configured
  if (!redis.url && !redis.host) {
    issues.push('Redis not configured (REDIS_URL or REDIS_HOST must be set)');
    return { valid: false, issues, warnings };
  }

  // If using REDIS_URL, it should be in correct format
  if (redis.url) {
    if (!redis.url.startsWith('redis://') && !redis.url.startsWith('rediss://')) {
      warnings.push('REDIS_URL should start with redis:// or rediss://');
    }
  }

  // If using host/port, both should be set
  if (redis.host && !redis.port) {
    issues.push('REDIS_PORT must be set when using REDIS_HOST');
  }

  // For Redis Cloud, username and password are usually required
  if (redis.username && !redis.password) {
    warnings.push('REDIS_PASSWORD should be set when using REDIS_USERNAME (Redis Cloud requirement)');
  }

  return {
    valid: issues.length === 0,
    issues,
    warnings,
    config: {
      method: redis.url ? 'REDIS_URL' : 'REDIS_HOST/REDIS_PORT',
      hasUrl: !!redis.url,
      hasHost: !!redis.host,
      hasPort: !!redis.port,
      hasUsername: !!redis.username,
      hasPassword: !!redis.password,
    },
  };
}

export default {
  verifyEnvironmentVariables,
  logEnvironmentVerification,
  verifyRedisProductionConfig,
};

