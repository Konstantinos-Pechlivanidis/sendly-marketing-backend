/* eslint-disable no-console */
/**
 * E2E Test Execution Script
 * Runs comprehensive E2E test suite with proper setup and teardown
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';
import prisma from '../services/prisma.js';
import seedComprehensive from './seed-dev-store-comprehensive.js';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '..', '.env') });

const TEST_SHOP_DOMAIN = 'sms-blossom-dev.myshopify.com';

async function runE2ETests() {
  console.log('🚀 E2E Test Execution Script');
  console.log('='.repeat(60));
  console.log(`📅 Started: ${new Date().toISOString()}\n`);

  const testResults = {
    passed: 0,
    failed: 0,
    total: 0,
    duration: 0,
    errors: [],
  };

  try {
    // Step 1: Verify environment
    console.log('📋 Step 1: Verifying environment...');
    const envCheck = await verifyEnvironment();
    if (!envCheck.valid) {
      console.error('❌ Environment verification failed:');
      envCheck.errors.forEach(err => console.error(`   - ${err}`));
      process.exit(1);
    }
    console.log('✅ Environment verified\n');

    // Step 2: Seed test data
    console.log('📋 Step 2: Seeding test data...');
    try {
      await seedComprehensive();
      console.log('✅ Test data seeded\n');
    } catch (error) {
      console.warn('⚠️  Seed data warning (continuing):', error.message);
      console.log('   (Using existing test data)\n');
    }

    // Step 3: Verify test shop
    console.log('📋 Step 3: Verifying test shop...');
    const shop = await prisma.shop.findUnique({
      where: { shopDomain: TEST_SHOP_DOMAIN },
      select: { id: true, credits: true, status: true },
    });

    if (!shop) {
      console.error(`❌ Test shop not found: ${TEST_SHOP_DOMAIN}`);
      process.exit(1);
    }

    if (shop.credits < 1000) {
      console.warn(`⚠️  Low credits: ${shop.credits}. Resetting to 10000...`);
      await prisma.shop.update({
        where: { id: shop.id },
        data: { credits: 10000 },
      });
      console.log('✅ Credits reset\n');
    } else {
      console.log(`✅ Test shop verified (Credits: ${shop.credits})\n`);
    }

    // Step 4: Run E2E tests
    console.log('📋 Step 4: Running E2E tests...');
    console.log('='.repeat(60));
    const startTime = Date.now();

    try {
      // Use Jest directly with timeout to prevent hanging
      const { stdout, stderr } = await execAsync(
        'node --experimental-vm-modules node_modules/jest/bin/jest.js tests/e2e/e2e-comprehensive.test.js --verbose --forceExit --detectOpenHandles',
        {
          cwd: join(__dirname, '..'),
          maxBuffer: 10 * 1024 * 1024, // 10MB
          timeout: 300000, // 5 minutes timeout
        },
      );

      const duration = Date.now() - startTime;
      testResults.duration = duration;

      console.log(stdout);
      if (stderr) {
        console.error(stderr);
      }

      // Parse test results from Jest output
      const passedMatch = stdout.match(/(\d+) passed/);
      const failedMatch = stdout.match(/(\d+) failed/);
      const totalMatch = stdout.match(/Tests:\s+(\d+)/);

      if (passedMatch) testResults.passed = parseInt(passedMatch[1]);
      if (failedMatch) testResults.failed = parseInt(failedMatch[1]);
      if (totalMatch) testResults.total = parseInt(totalMatch[1]);

      console.log('='.repeat(60));
      console.log(`✅ E2E tests completed in ${(duration / 1000).toFixed(2)}s\n`);
    } catch (error) {
      testResults.duration = Date.now() - startTime;
      testResults.errors.push(error.message);
      console.error('❌ E2E tests failed:', error.message);
      if (error.stdout) console.log(error.stdout);
      if (error.stderr) console.error(error.stderr);
    }

    // Step 5: Generate test report
    console.log('📋 Step 5: Generating test report...');
    await generateTestReport(testResults);
    console.log('✅ Test report generated\n');

    // Step 6: Summary
    console.log('📊 Test Summary');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${testResults.total}`);
    console.log(`Passed: ${testResults.passed} ✅`);
    console.log(`Failed: ${testResults.failed} ${testResults.failed > 0 ? '❌' : ''}`);
    console.log(`Duration: ${(testResults.duration / 1000).toFixed(2)}s`);
    console.log(`Pass Rate: ${testResults.total > 0 ? ((testResults.passed / testResults.total) * 100).toFixed(2) : 0}%`);
    console.log('='.repeat(60));

    if (testResults.failed > 0) {
      console.log('\n❌ Some tests failed. Please review the output above.');
      process.exit(1);
    } else {
      console.log('\n✅ All E2E tests passed!');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Fatal error:', error);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function verifyEnvironment() {
  const errors = [];
  const requiredVars = [
    'DATABASE_URL',
    'REDIS_HOST',
    'REDIS_PORT',
    'MITTO_API_KEY',
    'MITTO_TRAFFIC_ACCOUNT_ID',
    'SHOPIFY_API_KEY',
    'SHOPIFY_API_SECRET',
  ];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      errors.push(`Missing ${varName}`);
    }
  }

  // Test database connection
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    errors.push(`Database connection failed: ${error.message}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

async function generateTestReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    testSuite: 'E2E Comprehensive',
    results: {
      total: results.total,
      passed: results.passed,
      failed: results.failed,
      passRate: results.total > 0 ? ((results.passed / results.total) * 100).toFixed(2) : 0,
      duration: results.duration,
    },
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      shopDomain: TEST_SHOP_DOMAIN,
    },
    errors: results.errors,
  };

  const fs = await import('fs/promises');
  const reportPath = join(__dirname, '..', 'test-results', 'e2e-report.json');

  // Ensure directory exists
  await fs.mkdir(join(__dirname, '..', 'test-results'), { recursive: true });

  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(`   Report saved to: ${reportPath}`);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.includes('run-e2e-tests')) {
  runE2ETests()
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export default runE2ETests;

