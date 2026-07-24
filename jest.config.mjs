/** @type {import('jest').Config} */
export default {
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  },
  globals: {
    __DEV__: true,
  },
  moduleNameMapper: {
    '^@kupola/components$': '<rootDir>/packages/components/src/index.js',
    '^@kupola/core$': '<rootDir>/packages/core/src/index.js',
    '^@kupola/core/i18n$': '<rootDir>/packages/core/src/i18n.js',
    '^@kupola/core/server$': '<rootDir>/packages/core/src/server.js',
    '^@kupola/core/directives$': '<rootDir>/packages/core/src/directives.js',
    '^@kupola/core/template$': '<rootDir>/packages/core/src/template.js',
    '^@kupola/core/render$': '<rootDir>/packages/core/src/render.js',
    '^@kupola/core/component$': '<rootDir>/packages/core/src/component.js',
    '^@kupola/core/theme$': '<rootDir>/packages/core/src/theme.js',
    '^@kupola/core/lazy$': '<rootDir>/packages/core/src/lazy.js',
    '^@kupola/core/scheduler$': '<rootDir>/packages/core/src/scheduler.js',
    '^@kupola/platform$': '<rootDir>/packages/core/src/platform.js',
  },
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
    'packages/components/src/**/*.js',
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
    '\\.js$': 'esbuild-jest',
  },
  setupFilesAfterEnv: [
    './test/setup.js',
  ],
};
