/* eslint-disable no-console */
/**
 * Redis Connection Check for Tests
 * Uses 'redis' package with createClient (as per production requirements)
 */

import { testRedisConnection } from './redis-client.js';
import { testConfig } from '../config/test-config.js';

/**
 * Check Redis connection using production configuration
 */
export async function checkTestRedisConnection() {
  console.log('\n🔴 Checking Redis Configuration...');

  // Check if Redis is configured
  if (!testConfig.redis.host) {
    console.log('⚠️  Redis not configured (REDIS_HOST not set)');
    return {
      configured: false,
      connected: false,
      error: 'Redis not configured',
    };
  }

  try {
    const result = await testRedisConnection();

    if (result.success) {
      console.log('✅ Redis connected successfully');
      console.log(`   Using REDIS_HOST: ${testConfig.redis.host}:${testConfig.redis.port}`);
      console.log(`   Username: ${testConfig.redis.username}`);
      return {
        configured: true,
        connected: true,
        health: { status: 'healthy' },
      };
    } else {
      console.log(`⚠️  Redis connection failed: ${result.message}`);
      return {
        configured: true,
        connected: false,
        error: result.message,
      };
    }
  } catch (error) {
    console.log(`❌ Redis connection failed: ${error.message}`);
    return {
      configured: true,
      connected: false,
      error: error.message,
    };
  }
}

/**
 * Verify Redis configuration matches production setup
 */
export function verifyRedisConfig() {
  const config = testConfig.redis;
  const issues = [];

  // Check if Redis URL or host/port is set
  if (!config.url && !config.host) {
    issues.push('REDIS_URL or REDIS_HOST must be set');
  }

  // If using host/port, check both are set
  if (config.host && !config.port) {
    issues.push('REDIS_PORT must be set when using REDIS_HOST');
  }

  // Check password if username is set (Redis Cloud requirement)
  if (config.username && !config.password) {
    issues.push('REDIS_PASSWORD should be set when using REDIS_USERNAME');
  }

  return {
    valid: issues.length === 0,
    issues,
    config: {
      hasUrl: !!config.url,
      hasHost: !!config.host,
      hasPort: !!config.port,
      hasUsername: !!config.username,
      hasPassword: !!config.password,
    },
  };
}

export default {
  checkTestRedisConnection,
  verifyRedisConfig,
};

