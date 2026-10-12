import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(t|j)sx?$': [
      '@swc/jest',
      {
        jsc: {
          parser: {
            syntax: 'typescript',
            tsx: true,
          },
          transform: {
            react: {
              runtime: 'automatic',
            },
          },
          target: 'es2022',
        },
      },
    ],
  },
  setupFilesAfterEnv: ['<rootDir>/test/helpers/setup.ts'],
  moduleNameMapper: {
    '^@satjeet2005/safe-money-ui/styles\\.css$': '<rootDir>/src/react/styles.css',
    '^@satjeet2005/safe-money-ui/(.*)$': '<rootDir>/src/$1/index.ts',
    '^@satjeet2005/safe-money-ui$': '<rootDir>/src/money/index.ts',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/index.ts', '!src/**/*.d.ts'],
  coverageThreshold: {
    global: {
      statements: 90,
      lines: 90,
      functions: 90,
      branches: 85,
    },
  },
};

export default config;
