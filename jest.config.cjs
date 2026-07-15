module.exports = {
  testEnvironment: 'jsdom',
  testMatch: [
    '**/test/**/*.test.js',
    '**/test/**/*.spec.js',
    '**/packages/**/__tests__/**/*.test.js',
    '**/packages/**/__tests__/**/*.spec.js',
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
    'packages/core/src/**/*.js',
  ],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 65,
      functions: 80,
      lines: 85,
    },
  },
  transform: {
    '\\.js$': ['babel-jest', {
      presets: [['@babel/preset-env', { targets: { node: 'current' }, modules: 'commonjs' }]],
    }],
  },
  setupFilesAfterEnv: [
    './test/setup.js',
  ],
};