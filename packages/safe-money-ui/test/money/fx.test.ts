import { MAX_MINOR, createMoney } from '../../src/money/currencies.js';
import { PER_USD_MICRO, convert } from '../../src/money/fx.js';
import type { CurrencyCode, Money } from '../../src/money/types.js';

describe('PER_USD_MICRO constants', () => {
  it('defines exact fictional rates for all seven currencies', () => {
    expect(PER_USD_MICRO).toEqual({
      USD: 1_000_000,
      EUR: 920_000,
      GBP: 780_000,
      PLN: 4_000_000,
      INR: 83_500_000,
      JPY: 150_000_000,
      KWD: 307_000,
    });
  });
});

describe('convert - Golden FX cases (FX-01..FX-05)', () => {
  it('FX-01: converts USD 10000 -> EUR 9200', () => {
    const source = createMoney('USD', 10000);
    const result = convert(source, 'EUR');
    expect(result).toEqual({ currency: 'EUR', minor: 9200 });
  });

  it('FX-02: converts USD 10000 -> JPY 15000', () => {
    const source = createMoney('USD', 10000);
    const result = convert(source, 'JPY');
    expect(result).toEqual({ currency: 'JPY', minor: 15000 });
  });

  it('FX-03: converts USD 10000 -> KWD 30700', () => {
    const source = createMoney('USD', 10000);
    const result = convert(source, 'KWD');
    expect(result).toEqual({ currency: 'KWD', minor: 30700 });
  });

  it('FX-04: converts USD 25 -> GBP 20 (half-even rounds 19.5 to odd-neighbor 20)', () => {
    const source = createMoney('USD', 25);
    const result = convert(source, 'GBP');
    expect(result).toEqual({ currency: 'GBP', minor: 20 });
  });

  it('FX-05: converts USD 75 -> GBP 58 (half-even rounds 58.5 to even-neighbor 58)', () => {
    const source = createMoney('USD', 75);
    const result = convert(source, 'GBP');
    expect(result).toEqual({ currency: 'GBP', minor: 58 });
  });
});

describe('convert - Invariants and edge cases', () => {
  it('returns the exact source object reference when source and target currencies match', () => {
    const source = createMoney('USD', 12345);
    const result = convert(source, 'USD');
    expect(result).toBe(source);
  });

  it('converts zero source money to zero target money', () => {
    const source = createMoney('USD', 0);
    const result = convert(source, 'EUR');
    expect(result).toEqual({ currency: 'EUR', minor: 0 });
  });

  it('correctly handles conversions from 0-decimal currency (JPY)', () => {
    // 150 JPY -> 1 USD (100 minor USD): 150 * 1_000_000 * 10^2 / (150_000_000 * 10^0) = 100
    const source = createMoney('JPY', 150);
    const result = convert(source, 'USD');
    expect(result).toEqual({ currency: 'USD', minor: 100 });
  });

  it('correctly handles conversions to 3-decimal currency (KWD)', () => {
    // 1000 USD (10 USD) -> KWD: 1000 * 307_000 * 10^3 / (1_000_000 * 10^2) = 3070
    const source = createMoney('USD', 1000);
    const result = convert(source, 'KWD');
    expect(result).toEqual({ currency: 'KWD', minor: 3070 });
  });

  it('correctly handles conversions from 3-decimal currency (KWD)', () => {
    // 307 KWD (0.307 KWD = 1 USD = 100 minor USD): 307 * 1_000_000 * 10^2 / (307_000 * 10^3) = 100
    const source = createMoney('KWD', 307);
    const result = convert(source, 'USD');
    expect(result).toEqual({ currency: 'USD', minor: 100 });
  });

  it('converts to exactly MAX_MINOR without throwing', () => {
    // 230_000_000_000 EUR converts to exactly 1_000_000_000_000 PLN (MAX_MINOR)
    const source = createMoney('EUR', 230_000_000_000);
    const result = convert(source, 'PLN');
    expect(result).toEqual({ currency: 'PLN', minor: MAX_MINOR });
  });

  it('throws RangeError if conversion result exceeds MAX_MINOR', () => {
    // USD -> JPY rate multiplies by 150. Converting MAX_MINOR USD yields 150 * MAX_MINOR
    const largeMoney = createMoney('USD', MAX_MINOR);
    expect(() => convert(largeMoney, 'JPY')).toThrow(
      /exceeds MAX_MINOR limit \(1000000000000\)/,
    );
  });

  it('throws RangeError on invalid source money or unsupported currency', () => {
    expect(() => convert(null as unknown as Money, 'EUR')).toThrow(
      'source must be a valid Money object',
    );
    expect(() => convert('not-an-object' as unknown as Money, 'EUR')).toThrow(
      'source must be a valid Money object',
    );
    expect(() => convert({ currency: 'INVALID' as CurrencyCode, minor: 100 }, 'EUR')).toThrow(
      'Unsupported source currency: INVALID',
    );
    expect(() => convert(createMoney('USD', 100), 'INVALID' as CurrencyCode)).toThrow(
      'Unsupported target currency: INVALID',
    );
    expect(() => convert({ currency: 'USD', minor: -10 }, 'EUR')).toThrow(
      'Invalid minor amount: -10. Must be a safe non-negative integer <= 1000000000000.',
    );
    expect(() => convert({ currency: 'USD', minor: 1.5 }, 'EUR')).toThrow(
      'Invalid minor amount: 1.5. Must be a safe non-negative integer <= 1000000000000.',
    );
    expect(() => convert({ currency: 'USD', minor: MAX_MINOR + 1 }, 'EUR')).toThrow(
      'Invalid minor amount: 1000000000001. Must be a safe non-negative integer <= 1000000000000.',
    );
  });
});
