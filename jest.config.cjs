module.exports = {
  testEnvironment: 'jsdom',
  testMatch: [
    '**/test/**/*.test.js',
    '**/test/**/*.spec.js',
  ],
  testPathIgnorePatterns: [
    'node_modules/',
    'dist/',
  ],
  verbose: true,
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html',
  ],
  collectCoverageFrom: [
    'js/**/*.js',
    'src/**/*.js',
    '!js/**/*.min.js',
  ],
  transform: {},
  setupFilesAfterEnv: [
    './test/setup.js',
  ],
};