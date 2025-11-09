/* eslint-disable no-console */
/**
 * Integration Test Execution Script
 * Runs all integration tests with proper setup and reporting
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';
import prisma from '../services/prisma.js';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '..', '.env') });

const TEST_SHOP_DOMAIN = 'sms-blossom-dev.myshopify.com';

async function runIntegrationTests() {
  console.log('🚀 Integration Test Execution Script');
  console.log('='.repeat(60));
  console.log(`📅 Started: ${new Date().toISOString()}\n`);

  const testResults = {
    passed: 0,
    failed: 0,
    total: 0,
    duration: 0,
    errors: [],
    testSuites: [],
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

    // Step 2: Verify test shop
    console.log('📋 Step 2: Verifying test shop...');
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

    // Step 3: Run integration tests
    console.log('📋 Step 3: Running integration tests...');
    console.log('='.repeat(60));
    const startTime = Date.now();

    const testFiles = [
      'tests/integration/all-endpoints-comprehensive.test.js',
      'tests/integration/campaigns.test.js',
      'tests/integration/contacts.test.js',
      'tests/integration/billing.test.js',
      'tests/integration/credit-management.test.js',
      'tests/integration/settings.test.js',
      'tests/integration/dashboard.test.js',
      'tests/integration/audiences.test.js',
      'tests/integration/automations.test.js',
      'tests/integration/discounts.test.js',
      'tests/integration/templates.test.js',
      'tests/integration/reports.test.js',
      'tests/integration/tracking.test.js',
      'tests/integration/core.test.js',
    ];

    for (const testFile of testFiles) {
      console.log(`\n📝 Running: ${testFile}`);
      try {
        const { stdout } = await execAsync(
          `node --experimental-vm-modules node_modules/jest/bin/jest.js ${testFile} --forceExit --detectOpenHandles --testTimeout=30000`,
          {
            cwd: join(__dirname, '..'),
            maxBuffer: 10 * 1024 * 1024,
            timeout: 120000, // 2 minutes per test file
          },
        );

        // Parse results
        const passedMatch = stdout.match(/(\d+) passed/);
        const failedMatch = stdout.match(/(\d+) failed/);
        const totalMatch = stdout.match(/Tests:\s+(\d+)/);

        const suiteResults = {
          file: testFile,
          passed: passedMatch ? parseInt(passedMatch[1]) : 0,
          failed: failedMatch ? parseInt(failedMatch[1]) : 0,
          total: totalMatch ? parseInt(totalMatch[1]) : 0,
        };

        testResults.testSuites.push(suiteResults);
        testResults.passed += suiteResults.passed;
        testResults.failed += suiteResults.failed;
        testResults.total += suiteResults.total;

        console.log(`   ✅ Passed: ${suiteResults.passed}, Failed: ${suiteResults.failed}, Total: ${suiteResults.total}`);
      } catch (error) {
        console.error(`   ❌ Error running ${testFile}:`, error.message);
        testResults.errors.push({ file: testFile, error: error.message });
      }
    }

    const duration = Date.now() - startTime;
    testResults.duration = duration;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ Integration tests completed in ${(duration / 1000).toFixed(2)}s\n`);

    // Step 4: Generate test report
    console.log('📋 Step 4: Generating test report...');
    await generateTestReport(testResults);
    console.log('✅ Test report generated\n');

    // Step 5: Summary
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
      console.log('\n✅ All integration tests passed!');
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
    testSuite: 'Integration Tests - All Endpoints',
    results: {
      total: results.total,
      passed: results.passed,
      failed: results.failed,
      passRate: results.total > 0 ? ((results.passed / results.total) * 100).toFixed(2) : 0,
      duration: results.duration,
    },
    testSuites: results.testSuites,
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      shopDomain: TEST_SHOP_DOMAIN,
    },
    errors: results.errors,
  };

  const fs = await import('fs/promises');
  const reportPath = join(__dirname, '..', 'test-results', 'integration-report.json');

  // Ensure directory exists
  await fs.mkdir(join(__dirname, '..', 'test-results'), { recursive: true });

  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(`   Report saved to: ${reportPath}`);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.includes('run-integration-tests')) {
  runIntegrationTests()
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export default runIntegrationTests;

