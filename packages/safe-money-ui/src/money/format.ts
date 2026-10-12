import type { LocaleCode, Money } from './types.js';

export type FormatMoneyOptions = {
  locale: LocaleCode;
  display?: 'symbol' | 'code';
};

/**
 * Formats an amount for input editing.
 * @example formatAmountInput({ currency: 'USD', minor: 100 }, 'en-US')
 */
export function formatAmountInput(_money: Money, _locale: LocaleCode): string {
  // Placeholder for WP-06
  return '';
}

/**
 * Formats a Money instance for display.
 * @example formatMoney({ currency: 'USD', minor: 100 }, { locale: 'en-US' })
 */
export function formatMoney(_money: Money, _opts: FormatMoneyOptions): string {
  // Placeholder for WP-06
  return '';
}
