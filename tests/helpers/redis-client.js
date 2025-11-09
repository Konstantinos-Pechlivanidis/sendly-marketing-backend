/* eslint-disable no-console */
/**
 * Redis Client for Tests
 * Uses 'redis' package with createClient (as per production requirements)
 */

import { createClient } from 'redis';
import { testConfig } from '../config/test-config.js';

let testRedisClient = null;

/**
 * Create Redis client for tests using production configuration
 */
export async function createTestRedisClient() {
  if (testRedisClient && testRedisClient.isOpen) {
    return testRedisClient;
  }

  const client = createClient({
    username: testConfig.redis.username,
    password: testConfig.redis.password,
    socket: {
      host: testConfig.redis.host,
      port: testConfig.redis.port,
    },
  });

  client.on('error', (err) => {
    console.error('Redis Client Error', err);
  });

  client.on('connect', () => {
    console.log('✅ Redis Client Connected');
  });

  client.on('ready', () => {
    console.log('✅ Redis Client Ready');
  });

  try {
    await client.connect();
    testRedisClient = client;
    return client;
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    throw error;
  }
}

/**
 * Get test Redis client (creates if not exists)
 */
export async function getTestRedisClient() {
  return await createTestRedisClient();
}

/**
 * Close Redis client
 */
export async function closeTestRedisClient() {
  if (testRedisClient && testRedisClient.isOpen) {
    await testRedisClient.quit();
    testRedisClient = null;
    console.log('✅ Redis Client Closed');
  }
}

/**
 * Test Redis connection
 */
export async function testRedisConnection() {
  try {
    const client = await getTestRedisClient();

    // Test set/get
    await client.set('test:connection', 'ok');
    const result = await client.get('test:connection');
    await client.del('test:connection');

    if (result === 'ok') {
      console.log('✅ Redis connection test successful');
      return { success: true, message: 'Redis connection working' };
    } else {
      return { success: false, message: 'Redis test failed' };
    }
  } catch (error) {
    console.error('❌ Redis connection test failed:', error.message);
    return { success: false, message: error.message };
  }
}

export default {
  createTestRedisClient,
  getTestRedisClient,
  closeTestRedisClient,
  testRedisConnection,
};

