import { CURRENCIES, MAX_MINOR, createMoney } from '../../src/money/currencies.js';
import type { CurrencyCode, ParseResult } from '../../src/money/types.js';

describe('Currency Model & Metadata', () => {
  it('defines exactly the 7 supported currencies with exact decimal metadata', () => {
    const expectedCurrencies = {
      USD: { decimals: 2 },
      EUR: { decimals: 2 },
      GBP: { decimals: 2 },
      PLN: { decimals: 2 },
      INR: { decimals: 2 },
      JPY: { decimals: 0 },
      KWD: { decimals: 3 },
    };

    expect(Object.keys(CURRENCIES).sort()).toEqual(
      ['EUR', 'GBP', 'INR', 'JPY', 'KWD', 'PLN', 'USD'].sort(),
    );
    expect(CURRENCIES).toEqual(expectedCurrencies);
    expect(Object.keys(CURRENCIES)).toHaveLength(7);
  });

  it('defines MAX_MINOR as exactly 1_000_000_000_000 (10^12)', () => {
    expect(MAX_MINOR).toBe(1_000_000_000_000);
  });
});

describe('createMoney factory', () => {
  describe('valid input', () => {
    it('creates Money with zero minor units', () => {
      const money = createMoney('USD', 0);
      expect(money).toEqual({ currency: 'USD', minor: 0 });
    });

    it('creates Money with one minor unit', () => {
      const money = createMoney('EUR', 1);
      expect(money).toEqual({ currency: 'EUR', minor: 1 });
    });

    it('creates Money with standard normal amounts', () => {
      const money = createMoney('GBP', 123456);
      expect(money).toEqual({ currency: 'GBP', minor: 123456 });
    });

    it('creates Money with exact MAX_MINOR ceiling', () => {
      const money = createMoney('KWD', MAX_MINOR);
      expect(money).toEqual({ currency: 'KWD', minor: MAX_MINOR });
    });

    it('supports all seven currency codes', () => {
      const currencies: CurrencyCode[] = ['USD', 'EUR', 'GBP', 'PLN', 'INR', 'JPY', 'KWD'];
      for (const currency of currencies) {
        const money = createMoney(currency, 500);
        expect(money).toEqual({ currency, minor: 500 });
      }
    });
  });

  describe('invalid input - throws RangeError', () => {
    it('throws RangeError for negative integers', () => {
      expect(() => createMoney('USD', -1)).toThrow(
        'Invalid minor amount: -1. Must be a safe non-negative integer <= 1000000000000.',
      );
      expect(() => createMoney('USD', -1000)).toThrow(RangeError);
    });

    it('throws RangeError for fractional numbers', () => {
      expect(() => createMoney('USD', 10.5)).toThrow(RangeError);
      expect(() => createMoney('EUR', 0.1)).toThrow(RangeError);
      expect(() => createMoney('GBP', 99.99)).toThrow(RangeError);
    });

    it('throws RangeError for NaN', () => {
      expect(() => createMoney('USD', NaN)).toThrow(RangeError);
    });

    it('throws RangeError for positive infinity', () => {
      expect(() => createMoney('USD', Infinity)).toThrow(RangeError);
    });

    it('throws RangeError for negative infinity', () => {
      expect(() => createMoney('USD', -Infinity)).toThrow(RangeError);
    });

    it('throws RangeError for integers outside safe integer range', () => {
      expect(() => createMoney('USD', Number.MAX_SAFE_INTEGER + 10)).toThrow(RangeError);
    });

    it('throws RangeError for safe integers exceeding MAX_MINOR', () => {
      expect(() => createMoney('USD', MAX_MINOR + 1)).toThrow(RangeError);
      expect(() => createMoney('USD', MAX_MINOR + 1_000_000)).toThrow(RangeError);
    });
  });
});

describe('Type Contract Verification', () => {
  it('allows valid discriminated ParseResult usage', () => {
    const success: ParseResult = {
      ok: true,
      money: { currency: 'USD', minor: 100 },
    };
    expect(success.ok).toBe(true);

    const failure: ParseResult = {
      ok: false,
      error: { code: 'INVALID_GROUPING' },
    };
    expect(failure.ok).toBe(false);
  });
});
