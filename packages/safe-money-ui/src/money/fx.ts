import type { CurrencyCode, Money } from './types.js';

export const PER_USD_MICRO: Readonly<Record<CurrencyCode, number>> = {
  USD: 1_000_000,
  EUR: 920_000,
  GBP: 780_000,
  PLN: 4_000_000,
  INR: 83_500_000,
  JPY: 150_000_000,
  KWD: 307_000,
};

/**
 * Converts a Money amount to a target currency.
 * @example convert({ currency: 'USD', minor: 10000 }, 'EUR')
 */
export function convert(source: Money, _target: CurrencyCode): Money {
  // Placeholder for WP-07
  return source;
}
