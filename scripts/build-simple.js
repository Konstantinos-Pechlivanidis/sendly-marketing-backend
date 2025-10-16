#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';

console.log('🚀 SMS Blossom Backend - Production Build');
console.log('==========================================');

// Check if we're in the right directory
if (!fs.existsSync('package.json')) {
  console.error('❌ package.json not found. Please run this script from the project root.');
  process.exit(1);
}

// Check if we're in production mode
if (process.env.NODE_ENV !== 'production') {
  console.log('⚠️  Setting NODE_ENV to production...');
  process.env.NODE_ENV = 'production';
}

try {
  console.log('📦 Installing dependencies...');
  execSync('npm ci --only=production', { stdio: 'inherit' });
  console.log('✅ Dependencies installed');

  console.log('🔧 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma client generated');

  console.log('🗄️  Pushing database schema...');
  execSync('npx prisma db push', { stdio: 'inherit' });
  console.log('✅ Database schema pushed');

  console.log('🌱 Seeding initial data...');
  try {
    execSync('node scripts/seed-packages.js', { stdio: 'inherit' });
    execSync('node scripts/seed-templates.js', { stdio: 'inherit' });
    execSync('node scripts/seed-automations.js', { stdio: 'inherit' });
    console.log('✅ Initial data seeded');
  } catch (error) {
    console.log('⚠️  Seeding failed, but continuing...');
  }

  console.log('🔍 Verifying build...');
  
  // Check required files
  const requiredFiles = ['index.js', 'app.js', 'package.json', 'prisma/schema.prisma'];
  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      throw new Error(`Required file missing: ${file}`);
    }
  }
  
  console.log('✅ Build verification completed');
  console.log('🎉 Production build successful!');
  
  console.log('\n📋 Next steps:');
  console.log('1. Push your code to GitHub');
  console.log('2. Connect your GitHub repo to Render.com');
  console.log('3. Set environment variables in Render dashboard');
  console.log('4. Deploy!');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}