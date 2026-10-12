import fc from 'fast-check';

export const CURRENCIES = ['USD', 'EUR', 'GBP', 'PLN', 'INR', 'JPY', 'KWD'] as const;
export type CurrencyCode = (typeof CURRENCIES)[number];

export const SOURCE_CURRENCIES = ['USD', 'EUR', 'GBP'] as const;
export type SourceCurrencyCode = (typeof SOURCE_CURRENCIES)[number];

export const LOCALES = ['en-US', 'de-DE', 'pl-PL', 'en-IN'] as const;
export type LocaleCode = (typeof LOCALES)[number];

export const MAX_MINOR = 1_000_000_000_000;

export const currencyArb = fc.constantFrom<CurrencyCode>(...CURRENCIES);
export const sourceCurrencyArb = fc.constantFrom<SourceCurrencyCode>(...SOURCE_CURRENCIES);
export const localeArb = fc.constantFrom<LocaleCode>(...LOCALES);

export const minorArb = fc.integer({ min: 0, max: MAX_MINOR });
export const fxAmountArb = fc.integer({ min: 0, max: 1_000_000_000 });

export const denseAlphabetChars = [
  '0',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '.',
  ',',
  ' ',
  '\u00A0',
  '-',
  '+',
  '$',
  '€',
  'e',
  'E',
] as const;

export const denseAlphabetArb = fc.stringOf(fc.constantFrom(...denseAlphabetChars), {
  maxLength: 60,
});

export const unicodeInputArb = fc.fullUnicodeString({ maxLength: 200 });

export const moneyArb = fc.record({
  currency: currencyArb,
  minor: minorArb,
});

export function getPropertyConfig(): { numRuns: number; seed: number } {
  return {
    numRuns: Number(process.env.FC_NUM_RUNS ?? 100),
    seed: Number(process.env.FC_SEED ?? 20261012),
  };
}
