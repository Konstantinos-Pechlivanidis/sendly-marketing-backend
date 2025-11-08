#!/usr/bin/env node
/**
 * Comprehensive Endpoint Testing Script
 * Tests all API endpoints with dummy data and verifies database operations
 */

import dotenv from 'dotenv';
// node-fetch is available via @shopify/shopify-api dependency
import fetch from 'node-fetch';

dotenv.config();

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const SHOP_DOMAIN = 'sms-blossom-dev.myshopify.com';

// Test results tracking
const results = {
  passed: [],
  failed: [],
  errors: [],
};

/**
 * Make API request with proper headers
 */
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
      headers: response.headers,
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message,
    };
  }
}

/**
 * Test endpoint and log results
 */
async function testEndpoint(name, method, endpoint, data = null, expectedStatus = 200) {
  console.log(`\n🧪 Testing: ${name}`);
  console.log(`   ${method} ${endpoint}`);

  try {
    const result = await makeRequest(method, endpoint, data);

    if (result.status === expectedStatus || (expectedStatus === 200 && result.ok)) {
      console.log(`   ✅ PASSED (${result.status})`);
      results.passed.push({ name, endpoint, status: result.status });
      return { success: true, result };
    } else {
      console.log(`   ❌ FAILED (${result.status}, expected ${expectedStatus})`);
      if (result.data?.error) {
        console.log(`   Error: ${result.data.error}`);
      }
      results.failed.push({ name, endpoint, status: result.status, expected: expectedStatus });
      return { success: false, result };
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    results.errors.push({ name, endpoint, error: error.message });
    return { success: false, error: error.message };
  }
}

/**
 * Main test execution
 */
async function runTests() {
  console.log('🚀 Starting Comprehensive Endpoint Testing');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`🏪 Shop Domain: ${SHOP_DOMAIN}`);
  console.log('='.repeat(60));

  // Core/Health Endpoints
  console.log('\n📊 Core/Health Endpoints');
  await testEndpoint('Root', 'GET', '/');
  await testEndpoint('Health', 'GET', '/health');
  await testEndpoint('Health Config', 'GET', '/health/config');
  await testEndpoint('Health Full', 'GET', '/health/full');

  // Dashboard Endpoints
  console.log('\n📊 Dashboard Endpoints');
  await testEndpoint('Dashboard Overview', 'GET', '/dashboard/overview');
  await testEndpoint('Dashboard Quick Stats', 'GET', '/dashboard/quick-stats');

  // Contacts Endpoints
  console.log('\n📇 Contacts Endpoints');
  const contactData = {
    phoneE164: '+306977123456',
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    smsConsent: 'opted_in',
  };

  const createContact = await testEndpoint('Create Contact', 'POST', '/contacts', contactData, 201);
  let contactId = null;
  if (createContact.success && createContact.result?.data?.id) {
    contactId = createContact.result.data.id;
    await testEndpoint('Get Contact', 'GET', `/contacts/${contactId}`);
    await testEndpoint('Update Contact', 'PUT', `/contacts/${contactId}`, { firstName: 'Updated' });
    await testEndpoint('Contact Stats', 'GET', '/contacts/stats');
    await testEndpoint('List Contacts', 'GET', '/contacts');
  }

  // Campaigns Endpoints
  console.log('\n📢 Campaigns Endpoints');
  const campaignData = {
    name: 'Test Campaign',
    message: 'This is a test campaign message',
    audience: 'all',
    scheduleType: 'immediate',
    status: 'draft',
  };

  const createCampaign = await testEndpoint('Create Campaign', 'POST', '/campaigns', campaignData, 201);
  let campaignId = null;
  if (createCampaign.success && createCampaign.result?.data?.id) {
    campaignId = createCampaign.result.data.id;
    await testEndpoint('Get Campaign', 'GET', `/campaigns/${campaignId}`);
    await testEndpoint('Update Campaign', 'PUT', `/campaigns/${campaignId}`, { name: 'Updated Campaign' });
    await testEndpoint('Campaign Metrics', 'GET', `/campaigns/${campaignId}/metrics`);
    await testEndpoint('List Campaigns', 'GET', '/campaigns');
  }

  // Billing Endpoints
  console.log('\n💰 Billing Endpoints');
  await testEndpoint('Get Balance', 'GET', '/billing/balance');
  await testEndpoint('Get Packages', 'GET', '/billing/packages');
  await testEndpoint('Billing History', 'GET', '/billing/history');
  await testEndpoint('Billing Transactions', 'GET', '/billing/billing-history');

  // Reports Endpoints
  console.log('\n📈 Reports Endpoints');
  await testEndpoint('Reports Overview', 'GET', '/reports/overview');
  await testEndpoint('Reports KPIs', 'GET', '/reports/kpis');
  await testEndpoint('Reports Campaigns', 'GET', '/reports/campaigns');
  await testEndpoint('Reports Automations', 'GET', '/reports/automations');
  await testEndpoint('Reports Messaging', 'GET', '/reports/messaging');
  await testEndpoint('Reports Credits', 'GET', '/reports/credits');
  await testEndpoint('Reports Contacts', 'GET', '/reports/contacts');

  // Settings Endpoints
  console.log('\n⚙️ Settings Endpoints');
  await testEndpoint('Get Settings', 'GET', '/settings');
  await testEndpoint('Get Account Info', 'GET', '/settings/account');
  await testEndpoint('Update Sender Number', 'PUT', '/settings/sender', {
    senderNumber: '+306977123456',
    senderName: 'Test Store',
  });

  // Templates Endpoints
  console.log('\n📝 Templates Endpoints');
  await testEndpoint('Get Templates', 'GET', '/templates');
  await testEndpoint('Get Template Categories', 'GET', '/templates/categories');

  // Automations Endpoints
  console.log('\n🤖 Automations Endpoints');
  await testEndpoint('Get Automations', 'GET', '/automations');
  await testEndpoint('Automation Stats', 'GET', '/automations/stats');
  await testEndpoint('Get Defaults', 'GET', '/automations/defaults');

  // Audiences Endpoints
  console.log('\n👥 Audiences Endpoints');
  await testEndpoint('List Audiences', 'GET', '/audiences');

  // Discounts Endpoints
  console.log('\n🎟️ Discounts Endpoints');
  await testEndpoint('Get Discounts', 'GET', '/discounts');

  // Tracking Endpoints
  console.log('\n📡 Tracking Endpoints');
  await testEndpoint('Metrics', 'GET', '/metrics');

  // Print Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${results.passed.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log(`⚠️  Errors: ${results.errors.length}`);
  console.log(`📈 Total: ${results.passed.length + results.failed.length + results.errors.length}`);

  if (results.failed.length > 0) {
    console.log('\n❌ Failed Tests:');
    results.failed.forEach(test => {
      console.log(`   - ${test.name}: ${test.endpoint} (${test.status} vs expected ${test.expected})`);
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

