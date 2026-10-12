import type { CurrencyCode, Money } from './types.js';

/**
 * Computes the fee for a transfer in the source currency.
 * @example computeFee({ currency: 'USD', minor: 10000 }, 'EUR')
 */
export function computeFee(source: Money, _target: CurrencyCode): Money {
  // Placeholder for WP-07
  return { currency: source.currency, minor: 0 };
}
