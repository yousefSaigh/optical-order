module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  modulePathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/build/'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/'
  ],
  verbose: true
};

