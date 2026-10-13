import fc from 'fast-check';
import { MAX_MINOR, createMoney } from '../../src/money/currencies.js';
import { formatAmountInput } from '../../src/money/format.js';
import { parseAmount } from '../../src/money/parse.js';
import type { LocaleCode } from '../../src/money/types.js';
import {
  currencyArb,
  denseAlphabetArb,
  getPropertyConfig,
  localeArb,
  minorArb,
} from '../helpers/arbitraries.js';

function stripGroupSeparators(formatted: string, locale: LocaleCode): string {
  switch (locale) {
    case 'en-US':
    case 'en-IN':
      return formatted.replace(/,/g, '');
    case 'de-DE':
      return formatted.replace(/\./g, '');
    case 'pl-PL':
      return formatted.replace(/[\u00A0\u202F ]/g, '');
  }
}

describe('Property tests: Money invariants (P1, P2, P4, P5)', () => {
  it('P1: format then parse round trip (FM-13)', () => {
    fc.assert(
      fc.property(currencyArb, localeArb, minorArb, (currency, locale, minor) => {
        const money = createMoney(currency, minor);
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
      }),
      getPropertyConfig(),
    );
  });

  it('P2: grouping is optional', () => {
    fc.assert(
      fc.property(currencyArb, localeArb, minorArb, (currency, locale, minor) => {
        const money = createMoney(currency, minor);
        const formatted = formatAmountInput(money, locale);
        const ungrouped = stripGroupSeparators(formatted, locale);
        const parseResult = parseAmount(ungrouped, {
          currency,
          locale,
          allowZero: true,
        });

        expect(parseResult).toEqual({
          ok: true,
          money,
        });
      }),
      getPropertyConfig(),
    );
  });

  it('P4: parse soundness and idempotent normalization', () => {
    fc.assert(
      fc.property(
        fc.oneof(fc.string(), denseAlphabetArb),
        currencyArb,
        localeArb,
        (input, currency, locale) => {
          const res = parseAmount(input, { currency, locale, allowZero: true });

          if (res.ok) {
            expect(Number.isSafeInteger(res.money.minor)).toBe(true);
            expect(res.money.minor).toBeGreaterThanOrEqual(0);
            expect(res.money.minor).toBeLessThanOrEqual(MAX_MINOR);

            const normalized = formatAmountInput(res.money, locale);
            const reparsed = parseAmount(normalized, {
              currency,
              locale,
              allowZero: true,
            });

            expect(reparsed).toEqual({
              ok: true,
              money: res.money,
            });
          }
        },
      ),
      getPropertyConfig(),
    );
  });

  it('P5: parse is total (never throws and always returns ok boolean)', () => {
    fc.assert(
      fc.property(
        fc.oneof(fc.fullUnicodeString({ maxLength: 200 }), denseAlphabetArb),
        currencyArb,
        localeArb,
        (input, currency, locale) => {
          const res = parseAmount(input, { currency, locale });
          expect(typeof res.ok).toBe('boolean');
          if (res.ok) {
            expect(res.money).toBeDefined();
          } else {
            expect(res.error).toBeDefined();
          }
        },
      ),
      getPropertyConfig(),
    );
  });
});
