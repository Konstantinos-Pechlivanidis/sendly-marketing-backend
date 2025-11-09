/* eslint-disable no-console */
/**
 * Test All Endpoints and Verify Responses
 * Tests all endpoints against the dev store and verifies response structures
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fetch from 'node-fetch';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env') });

const BASE_URL = process.env.BACKEND_URL || process.env.HOST || 'https://sendly-marketing-backend.onrender.com';
const SHOP_DOMAIN = 'sms-blossom-dev.myshopify.com';

const results = {
  passed: [],
  failed: [],
  errors: [],
};

async function makeRequest(method, endpoint, data = null) {
  const url = `${BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Shop-Domain': SHOP_DOMAIN,
    },
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const responseData = await response.json().catch(() => ({}));

    return {
      status: response.status,
      ok: response.ok,
      data: responseData,
      headers: Object.fromEntries(response.headers.entries()),
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message,
    };
  }
}

async function testEndpoint(name, method, endpoint, data = null, expectedStatus = 200, validator = null) {
  console.log(`\n🧪 Testing: ${name}`);
  console.log(`   ${method} ${endpoint}`);

  try {
    const result = await makeRequest(method, endpoint, data);

    // Check status code
    if (result.status !== expectedStatus) {
      console.log(`   ❌ FAILED - Status: ${result.status} (expected ${expectedStatus})`);
      if (result.data?.error || result.data?.message) {
        console.log(`   Error: ${result.data.error || result.data.message}`);
      }
      results.failed.push({ name, endpoint, status: result.status, expected: expectedStatus, error: 'Wrong status code' });
      return { success: false, result };
    }

    // Check response structure
    if (!result.data.success && result.status < 400) {
      console.log('   ⚠️  WARNING - Response missing \'success\' field');
    }

    // Run custom validator if provided
    if (validator) {
      try {
        validator(result.data);
        console.log(`   ✅ PASSED (${result.status}) - Structure validated`);
      } catch (validationError) {
        console.log(`   ❌ FAILED - Validation error: ${validationError.message}`);
        results.failed.push({ name, endpoint, status: result.status, error: validationError.message });
        return { success: false, result };
      }
    } else {
      console.log(`   ✅ PASSED (${result.status})`);
    }

    results.passed.push({ name, endpoint, status: result.status });
    return { success: true, result };
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    results.errors.push({ name, endpoint, error: error.message });
    return { success: false, error: error.message };
  }
}

// Validators
const validators = {
  successResponse: (data) => {
    if (!data.success) throw new Error('Missing success field');
    if (!data.data) throw new Error('Missing data field');
  },
  paginatedResponse: (data) => {
    if (!data.success) throw new Error('Missing success field');
    if (!data.data.items && !data.data.contacts && !data.data.campaigns && !data.data.transactions) {
      throw new Error('Missing items/contacts/campaigns/transactions array');
    }
    if (!data.data.pagination) throw new Error('Missing pagination object');
  },
  accountResponse: (data) => {
    if (!data.success) throw new Error('Missing success field');
    if (!data.data.shopDomain) throw new Error('Missing shopDomain');
    if (typeof data.data.credits !== 'number') throw new Error('Missing or invalid credits');
  },
  packagesResponse: (data) => {
    if (!data.success) throw new Error('Missing success field');
    // Check if packages exists either directly in data or nested
    const packages = data.data?.packages || data.data;
    if (!packages || !Array.isArray(packages)) {
      throw new Error('Missing packages array');
    }
  },
};

async function runTests() {
  console.log('🚀 Starting Endpoint Response Testing');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`🏪 Shop Domain: ${SHOP_DOMAIN}`);
  console.log('='.repeat(60));

  // Core Endpoints
  console.log('\n📊 Core/Health Endpoints');
  await testEndpoint('Root', 'GET', '/', null, 200);
  await testEndpoint('Health', 'GET', '/health', null, 200);
  await testEndpoint('Health Config', 'GET', '/health/config', null, 200);
  await testEndpoint('Health Full', 'GET', '/health/full', null, 200);

  // Dashboard Endpoints
  console.log('\n📊 Dashboard Endpoints');
  await testEndpoint('Dashboard Overview', 'GET', '/dashboard/overview', null, 200, validators.successResponse);
  await testEndpoint('Dashboard Quick Stats', 'GET', '/dashboard/quick-stats', null, 200, validators.successResponse);

  // Contacts Endpoints
  console.log('\n📇 Contacts Endpoints');
  await testEndpoint('List Contacts', 'GET', '/contacts', null, 200, validators.paginatedResponse);
  await testEndpoint('Contact Stats', 'GET', '/contacts/stats', null, 200, validators.successResponse);
  await testEndpoint('Birthday Contacts', 'GET', '/contacts/birthdays', null, 200, validators.successResponse);

  // Campaigns Endpoints
  console.log('\n📢 Campaigns Endpoints');
  await testEndpoint('List Campaigns', 'GET', '/campaigns', null, 200, validators.paginatedResponse);
  await testEndpoint('Campaign Stats', 'GET', '/campaigns/stats/summary', null, 200, validators.successResponse);

  // Billing Endpoints
  console.log('\n💰 Billing Endpoints');
  await testEndpoint('Get Balance', 'GET', '/billing/balance', null, 200, validators.successResponse);
  await testEndpoint('Get Packages', 'GET', '/billing/packages', null, 200, validators.packagesResponse);
  await testEndpoint('Billing History', 'GET', '/billing/history', null, 200, validators.paginatedResponse);
  await testEndpoint('Billing Transactions', 'GET', '/billing/billing-history', null, 200, validators.paginatedResponse);

  // Settings Endpoints
  console.log('\n⚙️ Settings Endpoints');
  await testEndpoint('Get Settings', 'GET', '/settings', null, 200, validators.successResponse);
  await testEndpoint('Get Account Info', 'GET', '/settings/account', null, 200, validators.accountResponse);

  // Reports Endpoints
  console.log('\n📈 Reports Endpoints');
  await testEndpoint('Reports Overview', 'GET', '/reports/overview', null, 200, validators.successResponse);
  await testEndpoint('Reports KPIs', 'GET', '/reports/kpis', null, 200, validators.successResponse);

  // Automations Endpoints
  console.log('\n🤖 Automations Endpoints');
  await testEndpoint('Get Automations', 'GET', '/automations', null, 200, validators.successResponse);
  await testEndpoint('Automation Stats', 'GET', '/automations/stats', null, 200, validators.successResponse);

  // Audiences Endpoints
  console.log('\n👥 Audiences Endpoints');
  await testEndpoint('List Audiences', 'GET', '/audiences', null, 200, validators.paginatedResponse);

  // Discounts Endpoints
  console.log('\n🎟️ Discounts Endpoints');
  await testEndpoint('Get Discounts', 'GET', '/discounts', null, 200, validators.successResponse);

  // Tracking Endpoints
  console.log('\n📡 Tracking Endpoints');
  await testEndpoint('Metrics', 'GET', '/metrics', null, 200);

  // Print Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${results.passed.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log(`⚠️  Errors: ${results.errors.length}`);
  console.log(`📈 Total: ${results.passed.length + results.failed.length + results.errors.length}`);
  console.log(`📊 Pass Rate: ${((results.passed.length / (results.passed.length + results.failed.length + results.errors.length)) * 100).toFixed(1)}%`);

  if (results.failed.length > 0) {
    console.log('\n❌ Failed Tests:');
    results.failed.forEach(test => {
      console.log(`   - ${test.name}: ${test.endpoint}`);
      console.log(`     Status: ${test.status} (expected ${test.expected || '200'})`);
      if (test.error) console.log(`     Error: ${test.error}`);
    });
  }

  if (results.errors.length > 0) {
    console.log('\n⚠️  Errors:');
    results.errors.forEach(error => {
      console.log(`   - ${error.name}: ${error.error}`);
    });
  }

  // Exit with appropriate code
  process.exit(results.failed.length + results.errors.length > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

