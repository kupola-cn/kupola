module.exports = {
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '@kupola/components': '<rootDir>/packages/components/src/index.js',
    '@kupola/core': '<rootDir>/packages/core/src/index.js',
    '@kupola/core/i18n': '<rootDir>/packages/core/src/i18n.js',
    '@kupola/core/server': '<rootDir>/packages/core/src/server.js',
    '@kupola/core/directives': '<rootDir>/packages/core/src/directives.js',
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