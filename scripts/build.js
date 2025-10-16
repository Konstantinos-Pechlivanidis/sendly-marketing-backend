#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger.js';

const BUILD_STEPS = [
  'Installing dependencies',
  'Generating Prisma client',
  'Running database migrations',
  'Seeding initial data',
  'Building application',
  'Verifying build'
];

async function runBuildStep(step, command, description) {
  try {
    logger.info(`🔄 ${description}...`);
    const startTime = Date.now();
    
    execSync(command, { 
      stdio: 'inherit',
      cwd: process.cwd(),
      env: { ...process.env, NODE_ENV: 'production' }
    });
    
    const duration = Date.now() - startTime;
    logger.info(`✅ ${description} completed in ${duration}ms`);
    return true;
  } catch (error) {
    logger.error(`❌ ${description} failed:`, error.message);
    throw error;
  }
}

async function checkEnvironment() {
  logger.info('🔍 Checking build environment...');
  
  const requiredEnvVars = [
    'DATABASE_URL',
    'SHOPIFY_API_KEY',
    'SHOPIFY_API_SECRET',
    'HOST'
  ];
  
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    logger.warn(`⚠️  Missing environment variables: ${missing.join(', ')}`);
    logger.warn('Build will continue but some features may not work properly.');
  } else {
    logger.info('✅ All required environment variables are set');
  }
}

async function createProductionConfig() {
  logger.info('📝 Creating production configuration...');
  
  // Create production .env if it doesn't exist
  const envPath = '.env.production';
  if (!fs.existsSync(envPath)) {
    const envContent = `# Production Environment Variables
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=${process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/sendly_marketing'}

# Shopify
SHOPIFY_API_KEY=${process.env.SHOPIFY_API_KEY || 'your_api_key'}
SHOPIFY_API_SECRET=${process.env.SHOPIFY_API_SECRET || 'your_api_secret'}
SCOPES=read_customers,write_customers,read_orders,read_discounts,write_discounts
HOST=${process.env.HOST || 'https://your-app.onrender.com'}

# SMS Provider
MITTO_API_KEY=${process.env.MITTO_API_KEY || 'your_mitto_key'}
MITTO_API_BASE=${process.env.MITTO_API_BASE || 'https://api.mitto.ch'}
MITTO_SENDER_NAME=${process.env.MITTO_SENDER_NAME || 'Sendly'}

# Cache & Queue
REDIS_URL=${process.env.REDIS_URL || 'redis://localhost:6379'}

# Security
MITTO_WEBHOOK_SECRET=${process.env.MITTO_WEBHOOK_SECRET || 'your_webhook_secret'}
API_KEY=${process.env.API_KEY || 'your_api_key'}

# Optional
LOG_DIR=./logs
ALLOWED_ORIGINS=${process.env.ALLOWED_ORIGINS || 'https://your-app.onrender.com'}
APP_DEFAULT_CURRENCY=${process.env.APP_DEFAULT_CURRENCY || 'EUR'}
`;

    fs.writeFileSync(envPath, envContent);
    logger.info('✅ Production .env file created');
  } else {
    logger.info('✅ Production .env file already exists');
  }
}

async function runDatabaseSetup() {
  logger.info('🗄️  Setting up database...');
  
  try {
    // Generate Prisma client
    await runBuildStep('prisma-generate', 'npx prisma generate', 'Generating Prisma client');
    
    // Push schema to database (creates tables)
    await runBuildStep('prisma-push', 'npx prisma db push', 'Creating database tables');
    
    logger.info('✅ Database setup completed');
  } catch (error) {
    logger.error('❌ Database setup failed:', error.message);
    throw error;
  }
}

async function seedInitialData() {
  logger.info('🌱 Seeding initial data...');
  
  try {
    // Seed SMS packages
    await runBuildStep('seed-packages', 'node -e "import(\'./scripts/seed-packages.js\').then(m => m.default())"', 'Seeding SMS packages');
    
    // Seed templates
    await runBuildStep('seed-templates', 'node -e "import(\'./scripts/seed-templates.js\').then(m => m.default())"', 'Seeding SMS templates');
    
    // Seed automations
    await runBuildStep('seed-automations', 'node -e "import(\'./scripts/seed-automations.js\').then(m => m.default())"', 'Seeding automations');
    
    logger.info('✅ Initial data seeding completed');
  } catch (error) {
    logger.warn('⚠️  Data seeding failed, but build will continue:', error.message);
    // Don't throw here as seeding is optional for build
  }
}

async function verifyBuild() {
  logger.info('🔍 Verifying build...');
  
  try {
    // Check if main files exist
    const requiredFiles = [
      'index.js',
      'app.js',
      'package.json',
      'prisma/schema.prisma'
    ];
    
    for (const file of requiredFiles) {
      if (!fs.existsSync(file)) {
        throw new Error(`Required file missing: ${file}`);
      }
    }
    
    // Test that the app can be imported
    await runBuildStep('verify-import', 'node -e "import(\'./app.js\').then(() => console.log(\'App import successful\'))"', 'Verifying app import');
    
    logger.info('✅ Build verification completed');
  } catch (error) {
    logger.error('❌ Build verification failed:', error.message);
    throw error;
  }
}

async function createRenderConfig() {
  logger.info('📄 Creating Render.com configuration...');
  
  const renderYaml = `services:
  - type: web
    name: sendly-marketing-api
    env: node
    plan: starter
    buildCommand: npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: sendly-db
          property: connectionString
      - key: REDIS_URL
        fromService:
          type: redis
          name: sendly-redis
          property: connectionString
      - key: SHOPIFY_API_KEY
        sync: false
      - key: SHOPIFY_API_SECRET
        sync: false
      - key: HOST
        sync: false
      - key: MITTO_API_KEY
        sync: false
      - key: MITTO_WEBHOOK_SECRET
        sync: false
      - key: API_KEY
        sync: false

databases:
  - name: sendly-db
    plan: starter

  - name: sendly-redis
    type: redis
    plan: starter
`;

  fs.writeFileSync('render.yaml', renderYaml);
  logger.info('✅ Render.com configuration created');
}

async function main() {
  const startTime = Date.now();
  
  try {
    logger.info('🚀 Starting production build for Render.com...');
    
    // Step 1: Check environment
    await checkEnvironment();
    
    // Step 2: Create production config
    await createProductionConfig();
    
    // Step 3: Install dependencies
    await runBuildStep('install', 'npm ci --only=production', 'Installing production dependencies');
    
    // Step 4: Database setup
    await runDatabaseSetup();
    
    // Step 5: Seed initial data
    await seedInitialData();
    
    // Step 6: Verify build
    await verifyBuild();
    
    // Step 7: Create Render config
    await createRenderConfig();
    
    const totalTime = Date.now() - startTime;
    logger.info(`🎉 Build completed successfully in ${totalTime}ms`);
    
    console.log('\n📋 Next steps for Render.com deployment:');
    console.log('1. Push your code to GitHub');
    console.log('2. Connect your GitHub repo to Render.com');
    console.log('3. Set the following environment variables in Render:');
    console.log('   - SHOPIFY_API_KEY');
    console.log('   - SHOPIFY_API_SECRET');
    console.log('   - HOST (your Render app URL)');
    console.log('   - MITTO_API_KEY');
    console.log('   - MITTO_WEBHOOK_SECRET');
    console.log('   - API_KEY');
    console.log('4. Deploy!');
    
  } catch (error) {
    logger.error('💥 Build failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default main;
