module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!**/dist/**'
  ],
  coverageReporters: ['text', 'lcov', 'clover', 'html'],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 100,
      lines: 95,
      statements: 95
    }
  },
  // Specify test pattern to exclude fixtures
  testMatch: ['**/__tests__/**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/__tests__/fixtures/'],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  }
};
