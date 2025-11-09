#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Helper script to update Redis URL in .env file
 * Run: node scripts/update-redis-url.js
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env');

const NEW_REDIS_URL = 'redis://default:qFb53Dp7xLU0u7V681eMQwdTdnsbISx8@redis-16617.c10.us-east-1-3.ec2.redns.redis-cloud.com:16617';

try {
  // Read .env file
  let envContent = readFileSync(envPath, 'utf8');

  // Check if REDIS_URL exists
  const redisUrlPattern = /^REDIS_URL=.*$/m;
  const hasRedisUrl = redisUrlPattern.test(envContent);

  if (hasRedisUrl) {
    // Replace existing REDIS_URL
    envContent = envContent.replace(redisUrlPattern, `REDIS_URL=${NEW_REDIS_URL}`);
    console.log('✅ Updated existing REDIS_URL');
  } else {
    // Add REDIS_URL if it doesn't exist
    if (!envContent.endsWith('\n')) {
      envContent += '\n';
    }
    envContent += `\n# Redis Configuration\nREDIS_URL=${NEW_REDIS_URL}\n`;
    console.log('✅ Added REDIS_URL');
  }

  // Write back to .env
  writeFileSync(envPath, envContent, 'utf8');
  console.log('\n✅ .env file updated successfully!');
  console.log(`\nNew REDIS_URL: ${NEW_REDIS_URL}`);
  console.log('\n⚠️  Please restart your server for changes to take effect.');
} catch (error) {
  if (error.code === 'ENOENT') {
    console.error('❌ .env file not found. Please create it first.');
  } else {
    console.error('❌ Error updating .env file:', error.message);
  }
  process.exit(1);
}

