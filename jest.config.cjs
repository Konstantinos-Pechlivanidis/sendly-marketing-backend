module.exports = {
  testEnvironment: 'node',
  transform: {},
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testMatch: ['**/__tests__/**/*.test.js', '**/?(*.)+(spec|test).js'],
  collectCoverageFrom: [
    'controllers/**/*.js',
    'services/**/*.js',
    'routes/**/*.js',
    'middlewares/**/*.js',
    '!**/node_modules/**',
    '!**/__tests__/**',
    '!**/*.test.js',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 30000,
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  globalSetup: '<rootDir>/tests/global-setup.js',
  globalTeardown: '<rootDir>/tests/global-teardown.js',
  verbose: true,
};

