export default {
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['js'],
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  testMatch: ['**/__tests__/**/*.test.js'],
  verbose: true,
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
};
