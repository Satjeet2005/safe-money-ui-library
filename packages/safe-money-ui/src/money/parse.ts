import type { CurrencyCode, LocaleCode, ParseResult } from './types.js';

export type ParseAmountOptions = {
  currency: CurrencyCode;
  locale: LocaleCode;
  minMinor?: number;
  maxMinor?: number;
  allowZero?: boolean;
};

/**
 * Parses a localized currency string into a ParseResult.
 * @example parseAmount('100.00', { currency: 'USD', locale: 'en-US' })
 */
export function parseAmount(_input: string, _opts: ParseAmountOptions): ParseResult {
  // Placeholder for WP-05
  return { ok: false, error: { code: 'EMPTY' } };
}
