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
    '^@kupola/platform$': '<rootDir>/packages/platform/src/platform.js',
    '^@kupola/platform/template$': '<rootDir>/packages/platform/src/template.js',
    '^@kupola/platform/render$': '<rootDir>/packages/platform/src/render.js',
    '^@kupola/platform/component$': '<rootDir>/packages/platform/src/component.js',
    '^@kupola/platform/directives$': '<rootDir>/packages/platform/src/directives.js',
    '^@kupola/platform/theme$': '<rootDir>/packages/platform/src/theme.js',
    '^@kupola/platform/lazy$': '<rootDir>/packages/platform/src/lazy.js',
    '^@kupola/platform/server$': '<rootDir>/packages/platform/src/server.js',
    '^@kupola/platform/i18n$': '<rootDir>/packages/platform/src/i18n.js',
    '^@kupola/platform/errors$': '<rootDir>/packages/platform/src/errors.js',
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
    'packages/platform/src/**/*.js',
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
