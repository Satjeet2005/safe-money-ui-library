import type { CurrencyCode, Money } from './types.js';

export type { CurrencyCode };

export const CURRENCIES: Readonly<
  Record<CurrencyCode, { decimals: 0 | 2 | 3 }>
> = {
  USD: { decimals: 2 },
  EUR: { decimals: 2 },
  GBP: { decimals: 2 },
  PLN: { decimals: 2 },
  INR: { decimals: 2 },
  JPY: { decimals: 0 },
  KWD: { decimals: 3 },
};

export const MAX_MINOR = 1_000_000_000_000;

/**
 * Creates a validated Money value containing the currency code and minor-unit amount.
 *
 * @param currency - The three-letter ISO currency code.
 * @param minor - Safe non-negative integer amount in minor currency units (bounded by MAX_MINOR).
 * @returns A validated Money value.
 * @throws {RangeError} If minor is not a safe integer, is negative, or exceeds MAX_MINOR.
 *
 * @example
 * ```ts
 * const payment = createMoney('USD', 1250); // $12.50
 * ```
 */
export function createMoney(currency: CurrencyCode, minor: number): Money {
  if (!Number.isSafeInteger(minor) || minor < 0 || minor > MAX_MINOR) {
    throw new RangeError(
      `Invalid minor amount: ${minor}. Must be a safe non-negative integer <= ${MAX_MINOR}.`,
    );
  }
  return { currency, minor };
}
