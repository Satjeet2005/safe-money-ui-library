import fs from 'node:fs';
import path from 'node:path';
import * as MoneyEntry from '../../src/money/index.js';

describe('Public Money Entry Point (@satjeetsingh1/safe-money-ui/money)', () => {
  it('exports exactly the 9 runtime members specified in PRD §8.1', () => {
    const expectedRuntimeExports = [
      'CURRENCIES',
      'MAX_MINOR',
      'createMoney',
      'parseAmount',
      'formatAmountInput',
      'formatMoney',
      'convert',
      'computeFee',
      'PER_USD_MICRO',
    ].sort();

    const actualExports = Object.keys(MoneyEntry).sort();
    expect(actualExports).toEqual(expectedRuntimeExports);
  });

  it('declares valid package.json export targets matching tsup build outputs', () => {
    const pkgJsonPath = path.resolve(__dirname, '../../package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));

    expect(pkg.exports['.']).toEqual({
      types: './dist/money/index.d.ts',
      import: './dist/money/index.mjs',
      require: './dist/money/index.js',
    });

    expect(pkg.exports['./money']).toEqual({
      types: './dist/money/index.d.ts',
      import: './dist/money/index.mjs',
      require: './dist/money/index.js',
    });
  });
});
