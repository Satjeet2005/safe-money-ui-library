// @ts-check
/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
const config = {
  testRunner: 'jest',
  jest: {
    configFile: 'jest.config.ts',
  },
  checkers: ['typescript'],
  tsconfigFile: 'tsconfig.json',
  mutate: ['src/money/**/*.ts', 'src/submit/**/*.ts', '!src/**/index.ts'],
  coverageAnalysis: 'perTest',
  thresholds: {
    high: 90,
    low: 85,
    break: 80,
  },
  reporters: ['clear-text', 'html', 'json'],
  timeoutMS: 10000,
  plugins: ['@stryker-mutator/jest-runner', '@stryker-mutator/typescript-checker'],
};

export default config;
