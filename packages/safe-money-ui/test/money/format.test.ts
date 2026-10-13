import { createMoney } from '../../src/money/currencies.js';
import { formatAmountInput, formatMoney } from '../../src/money/format.js';
import { parseAmount } from '../../src/money/parse.js';
import type { CurrencyCode, LocaleCode, Money } from '../../src/money/types.js';

function normalizeSpaces(str: string): string {
  return str.replace(/[\u00A0\u202F]/g, ' ');
}

describe('formatMoney - Golden display cases (FG-01..FG-07)', () => {
  it('FG-01: formats USD 123456 minor in en-US default display', () => {
    const money = createMoney('USD', 123456);
    const result = formatMoney(money, { locale: 'en-US' });
    expect(normalizeSpaces(result)).toBe('$1,234.56');
  });

  it('FG-02: formats EUR 123456 minor in de-DE default display', () => {
    const money = createMoney('EUR', 123456);
    const result = formatMoney(money, { locale: 'de-DE' });
    expect(normalizeSpaces(result)).toBe('1.234,56 €');
  });

  it('FG-03: formats PLN 123456 minor in pl-PL default display', () => {
    const money = createMoney('PLN', 123456);
    const result = formatMoney(money, { locale: 'pl-PL' });
    expect(normalizeSpaces(result)).toBe('1234,56 zł');
  });

  it('FG-04: formats PLN 1234567 minor in pl-PL default display', () => {
    const money = createMoney('PLN', 1234567);
    const result = formatMoney(money, { locale: 'pl-PL' });
    expect(normalizeSpaces(result)).toBe('12 345,67 zł');
  });

  it('FG-05: formats INR 123456789 minor in en-IN default display', () => {
    const money = createMoney('INR', 123456789);
    const result = formatMoney(money, { locale: 'en-IN' });
    expect(normalizeSpaces(result)).toBe('₹12,34,567.89');
  });

  it('FG-06: formats JPY 1234 minor in en-US default display', () => {
    const money = createMoney('JPY', 1234);
    const result = formatMoney(money, { locale: 'en-US' });
    expect(normalizeSpaces(result)).toBe('¥1,234');
  });

  it('FG-07: formats KWD 1500 minor in en-US with display: code', () => {
    const money = createMoney('KWD', 1500);
    const result = formatMoney(money, { locale: 'en-US', display: 'code' });
    expect(normalizeSpaces(result)).toBe('KWD 1.500');
  });
});

describe('formatMoney - Options and edge cases', () => {
  it('formats zero amounts across currencies with correct decimals', () => {
    expect(normalizeSpaces(formatMoney(createMoney('USD', 0), { locale: 'en-US' }))).toBe('$0.00');
    expect(normalizeSpaces(formatMoney(createMoney('JPY', 0), { locale: 'en-US' }))).toBe('¥0');
    expect(
      normalizeSpaces(formatMoney(createMoney('KWD', 0), { locale: 'en-US', display: 'code' })),
    ).toBe('KWD 0.000');
  });

  it('supports explicit display code', () => {
    const money = createMoney('EUR', 123456);
    const res = formatMoney(money, { locale: 'en-US', display: 'code' });
    expect(normalizeSpaces(res)).toBe('EUR 1,234.56');
  });

  it('formats large values up to MAX_MINOR', () => {
    const money = createMoney('USD', 1_000_000_000_000);
    const res = formatMoney(money, { locale: 'en-US' });
    expect(normalizeSpaces(res)).toBe('$10,000,000,000.00');
  });

  it('throws RangeError for unsupported currency or locale', () => {
    const validMoney = createMoney('USD', 100);
    expect(() => formatMoney(validMoney, { locale: 'invalid-locale' as LocaleCode })).toThrow(
      RangeError,
    );

    expect(() =>
      formatMoney({ currency: 'CAD' as CurrencyCode, minor: 100 }, { locale: 'en-US' }),
    ).toThrow(RangeError);
  });

  it('throws RangeError for invalid minor amount or missing options', () => {
    expect(() => formatMoney({ currency: 'USD', minor: -1 }, { locale: 'en-US' })).toThrow(
      RangeError,
    );

    expect(() =>
      formatMoney(createMoney('USD', 100), null as unknown as { locale: LocaleCode }),
    ).toThrow(RangeError);
  });
});

describe('formatAmountInput - Locale separators and grouping', () => {
  it('formats USD 123456 in en-US as 1,234.56', () => {
    expect(formatAmountInput(createMoney('USD', 123456), 'en-US')).toBe('1,234.56');
  });

  it('formats EUR 123456 in de-DE as 1.234,56', () => {
    expect(formatAmountInput(createMoney('EUR', 123456), 'de-DE')).toBe('1.234,56');
  });

  it('formats PLN 1234567 in pl-PL with exact U+00A0 non-breaking space', () => {
    const res = formatAmountInput(createMoney('PLN', 1234567), 'pl-PL');
    expect(res).toBe('12\u00A0345,67');
  });

  it('formats INR 123456789 in en-IN with Indian grouping tiers', () => {
    expect(formatAmountInput(createMoney('INR', 123456789), 'en-IN')).toBe('12,34,567.89');
  });

  it('formats JPY with 0 decimal places', () => {
    expect(formatAmountInput(createMoney('JPY', 1234), 'en-US')).toBe('1,234');
    expect(formatAmountInput(createMoney('JPY', 1234567), 'de-DE')).toBe('1.234.567');
    expect(formatAmountInput(createMoney('JPY', 100), 'en-US')).toBe('100');
    expect(formatAmountInput(createMoney('JPY', 0), 'en-US')).toBe('0');
  });

  it('formats KWD with 3 decimal places preserving trailing zeros', () => {
    expect(formatAmountInput(createMoney('KWD', 1500), 'en-US')).toBe('1.500');
    expect(formatAmountInput(createMoney('KWD', 5), 'en-US')).toBe('0.005');
    expect(formatAmountInput(createMoney('KWD', 1234567), 'de-DE')).toBe('1.234,567');
    expect(formatAmountInput(createMoney('KWD', 0), 'en-US')).toBe('0.000');
  });

  it('formats short integer parts without grouping separators', () => {
    expect(formatAmountInput(createMoney('USD', 123), 'en-US')).toBe('1.23');
    expect(formatAmountInput(createMoney('EUR', 50), 'de-DE')).toBe('0,50');
    expect(formatAmountInput(createMoney('PLN', 99), 'pl-PL')).toBe('0,99');
    expect(formatAmountInput(createMoney('INR', 500), 'en-IN')).toBe('5.00');
  });

  it('formats multi-tier Indian grouping for en-IN across different magnitudes', () => {
    // 3 digits: no grouping
    expect(formatAmountInput(createMoney('INR', 50000), 'en-IN')).toBe('500.00');
    // 4 digits: 1,000
    expect(formatAmountInput(createMoney('INR', 100000), 'en-IN')).toBe('1,000.00');
    // 5 digits: 10,000
    expect(formatAmountInput(createMoney('INR', 1000000), 'en-IN')).toBe('10,000.00');
    // 6 digits: 1,00,000 (1 Lakh)
    expect(formatAmountInput(createMoney('INR', 10000000), 'en-IN')).toBe('1,00,000.00');
    // 7 digits: 10,00,000 (10 Lakh)
    expect(formatAmountInput(createMoney('INR', 100000000), 'en-IN')).toBe('10,00,000.00');
    // 8 digits: 1,00,00,000 (1 Crore)
    expect(formatAmountInput(createMoney('INR', 1000000000), 'en-IN')).toBe('1,00,00,000.00');
  });

  it('formats zero amounts across all locales', () => {
    expect(formatAmountInput(createMoney('USD', 0), 'en-US')).toBe('0.00');
    expect(formatAmountInput(createMoney('EUR', 0), 'de-DE')).toBe('0,00');
    expect(formatAmountInput(createMoney('PLN', 0), 'pl-PL')).toBe('0,00');
    expect(formatAmountInput(createMoney('INR', 0), 'en-IN')).toBe('0.00');
    expect(formatAmountInput(createMoney('JPY', 0), 'en-US')).toBe('0');
    expect(formatAmountInput(createMoney('KWD', 0), 'en-US')).toBe('0.000');
  });

  it('formats large values up to MAX_MINOR', () => {
    expect(formatAmountInput(createMoney('USD', 1_000_000_000_000), 'en-US')).toBe(
      '10,000,000,000.00',
    );
    expect(formatAmountInput(createMoney('EUR', 1_000_000_000_000), 'de-DE')).toBe(
      '10.000.000.000,00',
    );
    expect(formatAmountInput(createMoney('INR', 1_000_000_000_000), 'en-IN')).toBe(
      '10,00,00,00,000.00',
    );
  });

  it('throws RangeError for unsupported currency or locale', () => {
    const validMoney = createMoney('USD', 100);
    expect(() => formatAmountInput(validMoney, 'fr-FR' as LocaleCode)).toThrow(RangeError);
    expect(() =>
      formatAmountInput({ currency: 'CAD' as CurrencyCode, minor: 100 }, 'en-US'),
    ).toThrow(RangeError);
  });

  it('throws RangeError for invalid minor amount', () => {
    expect(() => formatAmountInput({ currency: 'USD', minor: -5 }, 'en-US')).toThrow(RangeError);
    expect(() => formatAmountInput({ currency: 'USD', minor: 1.5 }, 'en-US')).toThrow(RangeError);
  });
});

describe('formatAmountInput and parseAmount round-trip consistency', () => {
  const currencies: CurrencyCode[] = ['USD', 'EUR', 'GBP', 'PLN', 'INR', 'JPY', 'KWD'];
  const locales: LocaleCode[] = ['en-US', 'de-DE', 'pl-PL', 'en-IN'];
  const testAmounts = [0, 1, 50, 100, 123456, 1234567, 10000000, 1_000_000_000_000];

  for (const currency of currencies) {
    for (const locale of locales) {
      it(`round-trips ${currency} in ${locale} across representative amounts`, () => {
        for (const minor of testAmounts) {
          const money: Money = createMoney(currency, minor);
          const formatted = formatAmountInput(money, locale);
          const parseResult = parseAmount(formatted, {
            currency,
            locale,
            allowZero: true,
          });

          expect(parseResult).toEqual({
            ok: true,
            money,
          });
        }
      });
    }
  }
});
