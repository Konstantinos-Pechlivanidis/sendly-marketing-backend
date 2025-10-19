#!/usr/bin/env node

/**
 * Development Startup Script
 * Starts the server in development mode without Redis
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '..', '.env') });

// Set development environment
process.env.NODE_ENV = 'development';

// Disable Redis for development
if (!process.env.REDIS_URL) {
  console.log('🔧 Development mode: Redis disabled, using memory cache');
}

// Set default development values
process.env.PORT = process.env.PORT || '3000';
process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'debug';

console.log('🚀 Starting Sendly Marketing Backend in development mode...');
console.log(`📡 Port: ${process.env.PORT}`);
console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
console.log(`💾 Cache: ${process.env.REDIS_URL ? 'Redis' : 'Memory'}`);

// Start the server
import('../app.js').catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});
