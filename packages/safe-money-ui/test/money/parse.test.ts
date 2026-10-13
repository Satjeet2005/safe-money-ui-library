import { parseAmount } from '../../src/money/parse.js';
import type { CurrencyCode, LocaleCode } from '../../src/money/types.js';

describe('parseAmount - Golden parse cases (PG-01..PG-23)', () => {
  it('PG-01: parses 1,234.56 USD en-US', () => {
    const res = parseAmount('1,234.56', { currency: 'USD', locale: 'en-US' });
    expect(res).toEqual({
      ok: true,
      money: { currency: 'USD', minor: 123456 },
    });
  });

  it('PG-02: parses 1.234,56 EUR de-DE', () => {
    const res = parseAmount('1.234,56', { currency: 'EUR', locale: 'de-DE' });
    expect(res).toEqual({
      ok: true,
      money: { currency: 'EUR', minor: 123456 },
    });
  });

  it('PG-03: parses 1 234,56 with U+00A0 non-breaking space PLN pl-PL', () => {
    const input = '1\u00A0234,56';
    const res = parseAmount(input, { currency: 'PLN', locale: 'pl-PL' });
    expect(res).toEqual({
      ok: true,
      money: { currency: 'PLN', minor: 123456 },
    });
  });

  it('PG-04: parses 12,34,567.89 INR en-IN with Indian grouping', () => {
    const res = parseAmount('12,34,567.89', { currency: 'INR', locale: 'en-IN' });
    expect(res).toEqual({
      ok: true,
      money: { currency: 'INR', minor: 123456789 },
    });
  });

  it('PG-05: rejects 1,234,567.89 INR en-IN with Western grouping as INVALID_GROUPING', () => {
    const res = parseAmount('1,234,567.89', { currency: 'INR', locale: 'en-IN' });
    expect(res).toEqual({
      ok: false,
      error: { code: 'INVALID_GROUPING' },
    });
  });

  it('PG-06: rejects 1,5 USD en-US as INVALID_GROUPING', () => {
    const res = parseAmount('1,5', { currency: 'USD', locale: 'en-US' });
    expect(res).toEqual({
      ok: false,
      error: { code: 'INVALID_GROUPING' },
    });
  });

  it('PG-07: parses 1.234 EUR de-DE as grouped integer without decimals', () => {
    const res = parseAmount('1.234', { currency: 'EUR', locale: 'de-DE' });
    expect(res).toEqual({
      ok: true,
      money: { currency: 'EUR', minor: 123400 },
    });
  });

  it('PG-08: rejects 1,234 EUR de-DE as TOO_MANY_DECIMALS (maxDecimals: 2)', () => {
    const res = parseAmount('1,234', { currency: 'EUR', locale: 'de-DE' });
    expect(res).toEqual({
      ok: false,
      error: { code: 'TOO_MANY_DECIMALS', maxDecimals: 2 },
    });
  });

  it('PG-09: parses 100 JPY en-US', () => {
    const res = parseAmount('100', { currency: 'JPY', locale: 'en-US' });
    expect(res).toEqual({
      ok: true,
      money: { currency: 'JPY', minor: 100 },
    });
  });

  it('PG-10: rejects 100.5 JPY en-US as TOO_MANY_DECIMALS (maxDecimals: 0)', () => {
    const res = parseAmount('100.5', { currency: 'JPY', locale: 'en-US' });
    expect(res).toEqual({
      ok: false,
      error: { code: 'TOO_MANY_DECIMALS', maxDecimals: 0 },
    });
  });

  it('PG-11: parses 1.5 KWD en-US as 1500 minor units (3 decimals)', () => {
    const res = parseAmount('1.5', { currency: 'KWD', locale: 'en-US' });
    expect(res).toEqual({
      ok: true,
      money: { currency: 'KWD', minor: 1500 },
    });
  });

  it('PG-12: rejects 1.2345 KWD en-US as TOO_MANY_DECIMALS (maxDecimals: 3)', () => {
    const res = parseAmount('1.2345', { currency: 'KWD', locale: 'en-US' });
    expect(res).toEqual({
      ok: false,
      error: { code: 'TOO_MANY_DECIMALS', maxDecimals: 3 },
    });
  });

  it('PG-13: parses .5 USD en-US as 50 minor units', () => {
    const res = parseAmount('.5', { currency: 'USD', locale: 'en-US' });
    expect(res).toEqual({
      ok: true,
      money: { currency: 'USD', minor: 50 },
    });
  });

  it('PG-14: parses 5. USD en-US as 500 minor units', () => {
    const res = parseAmount('5.', { currency: 'USD', locale: 'en-US' });
    expect(res).toEqual({
      ok: true,
      money: { currency: 'USD', minor: 500 },
    });
  });

  it('PG-15: rejects $5 USD en-US as NOT_A_NUMBER', () => {
    const res = parseAmount('$5', { currency: 'USD', locale: 'en-US' });
    expect(res).toEqual({
      ok: false,
      error: { code: 'NOT_A_NUMBER' },
    });
  });

  it('PG-16: rejects -5 USD en-US as NEGATIVE_NOT_ALLOWED', () => {
    const res = parseAmount('-5', { currency: 'USD', locale: 'en-US' });
    expect(res).toEqual({
      ok: false,
      error: { code: 'NEGATIVE_NOT_ALLOWED' },
    });
  });

  it('PG-17: rejects 1.2.3 USD en-US as MULTIPLE_DECIMAL_SEPARATORS', () => {
    const res = parseAmount('1.2.3', { currency: 'USD', locale: 'en-US' });
    expect(res).toEqual({
      ok: false,
      error: { code: 'MULTIPLE_DECIMAL_SEPARATORS' },
    });
  });

  it('PG-18: rejects 0 USD en-US as ZERO_NOT_ALLOWED when allowZero is default false', () => {
    const res = parseAmount('0', { currency: 'USD', locale: 'en-US' });
    expect(res).toEqual({
      ok: false,
      error: { code: 'ZERO_NOT_ALLOWED' },
    });
  });

  it('PG-19: rejects whitespace-only string as EMPTY', () => {
    const res = parseAmount('   ', { currency: 'USD', locale: 'en-US' });
    expect(res).toEqual({
      ok: false,
      error: { code: 'EMPTY' },
    });
  });

  it('PG-20: rejects 9999999999999 USD en-US as UNSAFE_MAGNITUDE (> MAX_MINOR)', () => {
    const res = parseAmount('9999999999999', { currency: 'USD', locale: 'en-US' });
    expect(res).toEqual({
      ok: false,
      error: { code: 'UNSAFE_MAGNITUDE' },
    });
  });

  it('PG-21: rejects Arabic-Indic digit ٣ USD en-US as NOT_A_NUMBER', () => {
    const res = parseAmount('٣', { currency: 'USD', locale: 'en-US' });
    expect(res).toEqual({
      ok: false,
      error: { code: 'NOT_A_NUMBER' },
    });
  });

  it('PG-22: rejects 0.99 with minMinor: 100 as BELOW_MIN', () => {
    const res = parseAmount('0.99', {
      currency: 'USD',
      locale: 'en-US',
      minMinor: 100,
    });
    expect(res).toEqual({
      ok: false,
      error: { code: 'BELOW_MIN', limitMinor: 100 },
    });
  });

  it('PG-23: rejects 10000.01 with maxMinor: 1000000 as ABOVE_MAX', () => {
    const res = parseAmount('10000.01', {
      currency: 'USD',
      locale: 'en-US',
      maxMinor: 1000000,
    });
    expect(res).toEqual({
      ok: false,
      error: { code: 'ABOVE_MAX', limitMinor: 1000000 },
    });
  });
});

describe('parseAmount - Floating-point trap cases (FT-01..FT-05)', () => {
  it('FT-01: parses 19.99 USD en-US without binary floating point inaccuracy', () => {
    const res = parseAmount('19.99', { currency: 'USD', locale: 'en-US' });
    expect(res).toEqual({
      ok: true,
      money: { currency: 'USD', minor: 1999 },
    });
  });

  it('FT-02: parses 4.35 USD en-US without binary floating point inaccuracy', () => {
    const res = parseAmount('4.35', { currency: 'USD', locale: 'en-US' });
    expect(res).toEqual({
      ok: true,
      money: { currency: 'USD', minor: 435 },
    });
  });

  it('FT-03: parses 0.29 USD en-US without binary floating point inaccuracy', () => {
    const res = parseAmount('0.29', { currency: 'USD', locale: 'en-US' });
    expect(res).toEqual({
      ok: true,
      money: { currency: 'USD', minor: 29 },
    });
  });

  it('FT-04: parses 1.15 USD en-US without binary floating point inaccuracy', () => {
    const res = parseAmount('1.15', { currency: 'USD', locale: 'en-US' });
    expect(res).toEqual({
      ok: true,
      money: { currency: 'USD', minor: 115 },
    });
  });

  it('FT-05: rejects 1.005 USD en-US as TOO_MANY_DECIMALS (maxDecimals: 2)', () => {
    const res = parseAmount('1.005', { currency: 'USD', locale: 'en-US' });
    expect(res).toEqual({
      ok: false,
      error: { code: 'TOO_MANY_DECIMALS', maxDecimals: 2 },
    });
  });
});

describe('parseAmount - Algorithm edge cases and validation order', () => {
  it('rejects negative zero (-0, -0.00, and Unicode minus −0) with NEGATIVE_NOT_ALLOWED', () => {
    expect(parseAmount('-0', { currency: 'USD', locale: 'en-US' })).toEqual({
      ok: false,
      error: { code: 'NEGATIVE_NOT_ALLOWED' },
    });
    expect(parseAmount('-0.00', { currency: 'USD', locale: 'en-US' })).toEqual({
      ok: false,
      error: { code: 'NEGATIVE_NOT_ALLOWED' },
    });
    expect(parseAmount('\u22120', { currency: 'USD', locale: 'en-US' })).toEqual({
      ok: false,
      error: { code: 'NEGATIVE_NOT_ALLOWED' },
    });
    expect(parseAmount('\u221250', { currency: 'USD', locale: 'en-US' })).toEqual({
      ok: false,
      error: { code: 'NEGATIVE_NOT_ALLOWED' },
    });
  });

  it('accepts zero when allowZero: true', () => {
    expect(parseAmount('0', { currency: 'USD', locale: 'en-US', allowZero: true })).toEqual({
      ok: true,
      money: { currency: 'USD', minor: 0 },
    });
    expect(parseAmount('0.00', { currency: 'USD', locale: 'en-US', allowZero: true })).toEqual({
      ok: true,
      money: { currency: 'USD', minor: 0 },
    });
  });

  it('parses valid ungrouped inputs in all four locales', () => {
    expect(parseAmount('123456.78', { currency: 'USD', locale: 'en-US' })).toEqual({
      ok: true,
      money: { currency: 'USD', minor: 12345678 },
    });
    expect(parseAmount('123456,78', { currency: 'EUR', locale: 'de-DE' })).toEqual({
      ok: true,
      money: { currency: 'EUR', minor: 12345678 },
    });
    expect(parseAmount('123456,78', { currency: 'PLN', locale: 'pl-PL' })).toEqual({
      ok: true,
      money: { currency: 'PLN', minor: 12345678 },
    });
    expect(parseAmount('123456.78', { currency: 'INR', locale: 'en-IN' })).toEqual({
      ok: true,
      money: { currency: 'INR', minor: 12345678 },
    });
  });

  it('accepts pl-PL grouping with space, U+00A0, and U+202F', () => {
    expect(parseAmount('1 234,56', { currency: 'PLN', locale: 'pl-PL' })).toEqual({
      ok: true,
      money: { currency: 'PLN', minor: 123456 },
    });
    expect(parseAmount('1\u00A0234,56', { currency: 'PLN', locale: 'pl-PL' })).toEqual({
      ok: true,
      money: { currency: 'PLN', minor: 123456 },
    });
    expect(parseAmount('1\u202F234,56', { currency: 'PLN', locale: 'pl-PL' })).toEqual({
      ok: true,
      money: { currency: 'PLN', minor: 123456 },
    });
  });

  it('accepts multi-tier Indian grouping for INR en-IN', () => {
    const res = parseAmount('1,23,45,678.90', { currency: 'INR', locale: 'en-IN' });
    expect(res).toEqual({
      ok: true,
      money: { currency: 'INR', minor: 1234567890 },
    });
  });

  it('rejects group separators inside the fractional portion as INVALID_GROUPING', () => {
    expect(parseAmount('1234.5,6', { currency: 'USD', locale: 'en-US' })).toEqual({
      ok: false,
      error: { code: 'INVALID_GROUPING' },
    });
    expect(parseAmount('1234,5.6', { currency: 'EUR', locale: 'de-DE' })).toEqual({
      ok: false,
      error: { code: 'INVALID_GROUPING' },
    });
  });

  it('rejects bare decimal separator when no digits are present as NOT_A_NUMBER', () => {
    expect(parseAmount('.', { currency: 'USD', locale: 'en-US' })).toEqual({
      ok: false,
      error: { code: 'NOT_A_NUMBER' },
    });
    expect(parseAmount(',', { currency: 'EUR', locale: 'de-DE' })).toEqual({
      ok: false,
      error: { code: 'NOT_A_NUMBER' },
    });
  });

  it('rejects bare trailing separator for JPY as TOO_MANY_DECIMALS (maxDecimals: 0)', () => {
    expect(parseAmount('100.', { currency: 'JPY', locale: 'en-US' })).toEqual({
      ok: false,
      error: { code: 'TOO_MANY_DECIMALS', maxDecimals: 0 },
    });
  });

  it('normalizes leading zeros correctly', () => {
    expect(parseAmount('00123.45', { currency: 'USD', locale: 'en-US' })).toEqual({
      ok: true,
      money: { currency: 'USD', minor: 12345 },
    });
  });

  it('allows exact minMinor and maxMinor boundary values', () => {
    expect(parseAmount('1.00', { currency: 'USD', locale: 'en-US', minMinor: 100 })).toEqual({
      ok: true,
      money: { currency: 'USD', minor: 100 },
    });
    expect(parseAmount('100.00', { currency: 'USD', locale: 'en-US', maxMinor: 10000 })).toEqual({
      ok: true,
      money: { currency: 'USD', minor: 10000 },
    });
  });

  it('parses exact MAX_MINOR ceiling and rejects amounts above it', () => {
    // MAX_MINOR is 1_000_000_000_000. In USD with 2 decimals, that is 10000000000.00
    const exactMaxStr = '10000000000.00';
    expect(parseAmount(exactMaxStr, { currency: 'USD', locale: 'en-US' })).toEqual({
      ok: true,
      money: { currency: 'USD', minor: 1_000_000_000_000 },
    });

    const overMaxStr = '10000000000.01';
    expect(parseAmount(overMaxStr, { currency: 'USD', locale: 'en-US' })).toEqual({
      ok: false,
      error: { code: 'UNSAFE_MAGNITUDE' },
    });
  });

  it('throws RangeError for unsupported runtime currency or locale', () => {
    expect(() =>
      parseAmount('100', {
        currency: 'CAD' as unknown as CurrencyCode,
        locale: 'en-US',
      }),
    ).toThrow(RangeError);

    expect(() =>
      parseAmount('100', {
        currency: 'USD',
        locale: 'fr-FR' as unknown as LocaleCode,
      }),
    ).toThrow(RangeError);
  });
});
