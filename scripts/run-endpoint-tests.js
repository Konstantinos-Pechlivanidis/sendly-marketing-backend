/**
 * Run Endpoint Tests
 * Executes comprehensive endpoint testing with database verification
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const testScript = join(__dirname, 'test-all-endpoints.js');

console.log('🚀 Starting Endpoint Tests...\n');
console.log('⚠️  Make sure your server is running on http://localhost:3001\n');

const child = spawn('node', [testScript], {
  stdio: 'inherit',
  shell: true,
});

child.on('close', (code) => {
  process.exit(code);
});

child.on('error', (error) => {
  console.error('Failed to start test script:', error);
  process.exit(1);
});

