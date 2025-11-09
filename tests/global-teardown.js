/* eslint-disable no-console */
/**
 * Global Test Teardown
 * Runs once after all tests
 */

export default async () => {
  console.log('Cleaning up test environment...');

  // Clean up test database if needed

  console.log('Test environment cleaned up');
};

