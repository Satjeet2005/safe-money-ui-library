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
  setupFilesAfterEnv: ['<rootDir>/../../packages/safe-money-ui/test/helpers/setup.ts'],
  moduleNameMapper: {
    '^@satjeetsingh1/safe-money-ui/styles\\.css$':
      '<rootDir>/../../packages/safe-money-ui/src/react/styles.css',
    '^@satjeetsingh1/safe-money-ui/(.*)$': '<rootDir>/../../packages/safe-money-ui/src/$1/index.ts',
    '^@satjeetsingh1/safe-money-ui$': '<rootDir>/../../packages/safe-money-ui/src/money/index.ts',
    '^@satjeet2005/safe-money-ui/styles\\.css$':
      '<rootDir>/../../packages/safe-money-ui/src/react/styles.css',
    '^@satjeet2005/safe-money-ui/(.*)$': '<rootDir>/../../packages/safe-money-ui/src/$1/index.ts',
    '^@satjeet2005/safe-money-ui$': '<rootDir>/../../packages/safe-money-ui/src/money/index.ts',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/index.ts', '!src/**/*.d.ts'],
  coverageThreshold: {
    global: {
      statements: 80,
      lines: 80,
      functions: 80,
      branches: 75,
    },
  },
};

export default config;
