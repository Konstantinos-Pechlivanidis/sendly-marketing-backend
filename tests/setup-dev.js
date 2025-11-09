/* eslint-disable no-console */
/**
 * Development Test Setup
 * Configures test environment to use development database
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env') });

// Set development environment
process.env.NODE_ENV = 'development';

// Use development database URL
if (!process.env.DATABASE_URL) {
  console.warn('⚠️  DATABASE_URL not set in .env file');
} else {
  console.log('✅ DATABASE_URL configured');
}

// Disable logging in tests (optional)
process.env.LOG_LEVEL = 'error';

// Mock external services for development tests
process.env.MITTO_API_KEY = process.env.MITTO_API_KEY || 'test_key';
process.env.SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY || 'test_key';
process.env.SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET || 'test_secret';
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_mock';
process.env.REDIS_URL = process.env.REDIS_URL || null; // Disable Redis for dev tests

console.log('🔧 Development test environment configured');
console.log(`📊 Database: ${process.env.DATABASE_URL ? 'configured' : 'not configured'}`);
