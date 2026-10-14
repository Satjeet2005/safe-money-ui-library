import { createMoney } from '../../src/money/currencies.js';
import { computeFee } from '../../src/money/fee.js';
import type { CurrencyCode, Money } from '../../src/money/types.js';

describe('computeFee - Golden fee cases (FE-01..FE-05)', () => {
  it('FE-01: computes fee for USD 10000 -> EUR as USD 100 (minimum floor applied)', () => {
    const source = createMoney('USD', 10000);
    const fee = computeFee(source, 'EUR');
    expect(fee).toEqual({ currency: 'USD', minor: 100 });
  });

  it('FE-02: computes fee for USD 100000 -> EUR as USD 500', () => {
    const source = createMoney('USD', 100000);
    const fee = computeFee(source, 'EUR');
    expect(fee).toEqual({ currency: 'USD', minor: 500 });
  });

  it('FE-03: computes fee for USD 300100 -> EUR as USD 1500 (1500.5 half-even rounds to 1500)', () => {
    const source = createMoney('USD', 300100);
    const fee = computeFee(source, 'EUR');
    expect(fee).toEqual({ currency: 'USD', minor: 1500 });
  });

  it('FE-04: computes fee for USD 300300 -> EUR as USD 1502 (1501.5 half-even rounds to 1502)', () => {
    const source = createMoney('USD', 300300);
    const fee = computeFee(source, 'EUR');
    expect(fee).toEqual({ currency: 'USD', minor: 1502 });
  });

  it('FE-05: computes fee for EUR 50000 -> EUR as EUR 0 (same currency)', () => {
    const source = createMoney('EUR', 50000);
    const fee = computeFee(source, 'EUR');
    expect(fee).toEqual({ currency: 'EUR', minor: 0 });
  });
});

describe('computeFee - Invariants and edge cases', () => {
  it('returns zero fee in source currency for same-currency transfers, even with 0 amount', () => {
    const zeroUsd = createMoney('USD', 0);
    expect(computeFee(zeroUsd, 'USD')).toEqual({ currency: 'USD', minor: 0 });

    const regularGbp = createMoney('GBP', 75000);
    expect(computeFee(regularGbp, 'GBP')).toEqual({ currency: 'GBP', minor: 0 });
  });

  it('applies the 100 minor unit minimum for small cross-currency amounts', () => {
    const oneMinor = createMoney('USD', 1);
    expect(computeFee(oneMinor, 'EUR')).toEqual({ currency: 'USD', minor: 100 });

    const zeroMinor = createMoney('USD', 0);
    expect(computeFee(zeroMinor, 'EUR')).toEqual({ currency: 'USD', minor: 100 });
  });

  it('preserves the source currency denomination regardless of target currency', () => {
    const jpy = createMoney('JPY', 1000000);
    const feeInJpy = computeFee(jpy, 'USD');
    expect(feeInJpy.currency).toBe('JPY');
    expect(feeInJpy.minor).toBe(5000);

    const kwd = createMoney('KWD', 50000);
    const feeInKwd = computeFee(kwd, 'EUR');
    expect(feeInKwd.currency).toBe('KWD');
    expect(feeInKwd.minor).toBe(250);
  });

  it('handles MAX_MINOR amount without throwing', () => {
    const maxSource = createMoney('USD', 1_000_000_000_000);
    expect(computeFee(maxSource, 'USD')).toEqual({ currency: 'USD', minor: 0 });
    const feeCross = computeFee(maxSource, 'EUR');
    expect(feeCross.currency).toBe('USD');
    expect(feeCross.minor).toBe(5_000_000_000);
  });

  it('throws RangeError on invalid source money or unsupported currency', () => {
    expect(() => computeFee(null as unknown as Money, 'EUR')).toThrow(
      'source must be a valid Money object',
    );
    expect(() => computeFee('not-an-object' as unknown as Money, 'EUR')).toThrow(
      'source must be a valid Money object',
    );
    expect(() => computeFee({ currency: 'INVALID' as CurrencyCode, minor: 100 }, 'EUR')).toThrow(
      'Unsupported source currency: INVALID',
    );
    expect(() => computeFee(createMoney('USD', 100), 'INVALID' as CurrencyCode)).toThrow(
      'Unsupported target currency: INVALID',
    );
    expect(() => computeFee({ currency: 'USD', minor: -10 }, 'EUR')).toThrow(
      'Invalid minor amount: -10. Must be a safe non-negative integer <= 1000000000000.',
    );
    expect(() => computeFee({ currency: 'USD', minor: 1.5 }, 'EUR')).toThrow(
      'Invalid minor amount: 1.5. Must be a safe non-negative integer <= 1000000000000.',
    );
    expect(() => computeFee({ currency: 'USD', minor: 1_000_000_000_000 + 1 }, 'EUR')).toThrow(
      'Invalid minor amount: 1000000000001. Must be a safe non-negative integer <= 1000000000000.',
    );
  });
});
