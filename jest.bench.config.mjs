/** @type {import('jest').Config} */
import base from './jest.config.mjs';

export default {
  ...base,
  globals: {
    __DEV__: false,
  },
  // Disable coverage for benchmarks
  collectCoverage: false,
  coverageThreshold: undefined,
  // Shorter timeout for benchmarks
  testTimeout: 30000,
};