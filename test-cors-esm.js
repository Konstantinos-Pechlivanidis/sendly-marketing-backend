#!/usr/bin/env node
/**
 * CORS and ESM Compatibility Test Script
 * Tests both CORS configuration and ESM import functionality
 */

import fetch from 'node-fetch';
import { logger } from './utils/logger.js';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const FRONTEND_ORIGIN = 'https://investments-brand-numerous-voters.trycloudflare.com';

async function testCORSHeaders() {
  console.log('🧪 Testing CORS Headers Configuration...\n');

  // Test 1: OPTIONS preflight request with all custom headers
  console.log('1. Testing OPTIONS preflight request with custom headers...');
  try {
    const response = await fetch(`${BACKEND_URL}/campaigns`, {
      method: 'OPTIONS',
      headers: {
        'Origin': FRONTEND_ORIGIN,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type,X-Shopify-Shop-Domain,X-Requested-With,X-Client-Version,X-Client-Platform,X-Shopify-Shop,X-Shopify-Shop-Name,X-Store-ID',
      },
    });

    console.log(`   Status: ${response.status}`);
    console.log(`   Access-Control-Allow-Origin: ${response.headers.get('Access-Control-Allow-Origin')}`);
    console.log(`   Access-Control-Allow-Methods: ${response.headers.get('Access-Control-Allow-Methods')}`);
    console.log(`   Access-Control-Allow-Headers: ${response.headers.get('Access-Control-Allow-Headers')}`);
    console.log(`   Access-Control-Allow-Credentials: ${response.headers.get('Access-Control-Allow-Credentials')}`);
    console.log(`   Access-Control-Max-Age: ${response.headers.get('Access-Control-Max-Age')}`);
    
    if (response.status === 200) {
      console.log('   ✅ OPTIONS preflight request successful\n');
    } else {
      console.log('   ❌ OPTIONS preflight request failed\n');
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
  }

  // Test 2: POST request with all custom headers
  console.log('2. Testing POST request with all custom headers...');
  try {
    const response = await fetch(`${BACKEND_URL}/campaigns`, {
      method: 'POST',
      headers: {
        'Origin': FRONTEND_ORIGIN,
        'Content-Type': 'application/json',
        'X-Shopify-Shop-Domain': 'test-shop.myshopify.com',
        'X-Requested-With': 'XMLHttpRequest',
        'X-Client-Version': '1.0.0',
        'X-Client-Platform': 'web',
        'X-Shopify-Shop': 'test-shop',
        'X-Shopify-Shop-Name': 'Test Shop',
        'X-Store-ID': '12345',
      },
      body: JSON.stringify({
        name: 'Test Campaign',
        subject: 'Test Subject',
        content: 'Test content',
      }),
    });

    console.log(`   Status: ${response.status}`);
    console.log(`   Access-Control-Allow-Origin: ${response.headers.get('Access-Control-Allow-Origin')}`);
    
    if (response.status === 200 || response.status === 201) {
      console.log('   ✅ POST request successful\n');
    } else {
      console.log(`   ⚠️  POST request returned status ${response.status} (expected for test without auth)\n`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
  }

  // Test 3: Test blocked origin
  console.log('3. Testing blocked origin...');
  try {
    const response = await fetch(`${BACKEND_URL}/campaigns`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://malicious-site.com',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    console.log(`   Status: ${response.status}`);
    console.log(`   Access-Control-Allow-Origin: ${response.headers.get('Access-Control-Allow-Origin')}`);
    
    if (response.status === 403 || response.status === 500) {
      console.log('   ✅ Blocked origin correctly rejected\n');
    } else {
      console.log('   ❌ Blocked origin was not rejected\n');
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
  }
}

async function testESMCompatibility() {
  console.log('🔧 Testing ESM Compatibility...\n');

  // Test 1: Import error classes
  console.log('1. Testing error classes import...');
  try {
    const { AppError, ValidationError, AuthenticationError } = await import('./utils/errors.js');
    
    const testError = new ValidationError('Test validation error');
    console.log(`   ✅ Error classes imported successfully: ${testError.constructor.name}`);
    console.log(`   ✅ Error message: ${testError.message}`);
    console.log(`   ✅ Error code: ${testError.code}`);
    console.log(`   ✅ Error status: ${testError.statusCode}\n`);
  } catch (error) {
    console.log(`   ❌ Error importing error classes: ${error.message}\n`);
  }

  // Test 2: Test logger import
  console.log('2. Testing logger import...');
  try {
    const { logger } = await import('./utils/logger.js');
    console.log('   ✅ Logger imported successfully');
    console.log('   ✅ Logger type:', typeof logger);
    console.log('   ✅ Logger methods available:', Object.getOwnPropertyNames(logger).filter(name => typeof logger[name] === 'function').join(', '));
    console.log('');
  } catch (error) {
    console.log(`   ❌ Error importing logger: ${error.message}\n`);
  }

  // Test 3: Test global error handler
  console.log('3. Testing global error handler...');
  try {
    const { globalErrorHandler } = await import('./utils/errors.js');
    console.log('   ✅ Global error handler imported successfully');
    console.log('   ✅ Handler type:', typeof globalErrorHandler);
    console.log('   ✅ Handler is async:', globalErrorHandler.constructor.name === 'AsyncFunction');
    console.log('');
  } catch (error) {
    console.log(`   ❌ Error importing global error handler: ${error.message}\n`);
  }
}

async function runAllTests() {
  console.log('🚀 Starting CORS and ESM Compatibility Tests...\n');
  
  await testCORSHeaders();
  await testESMCompatibility();
  
  console.log('🏁 All tests completed!');
}

// Run the tests
runAllTests().catch(console.error);
