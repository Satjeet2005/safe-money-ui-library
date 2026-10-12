import type { CurrencyCode, Money } from './types.js';

export const CURRENCIES: Readonly<Record<CurrencyCode, { decimals: 0 | 2 | 3 }>> = {
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
 * Creates a Money instance.
 * @example createMoney('USD', 100)
 */
export function createMoney(currency: CurrencyCode, minor: number): Money {
  if (!Number.isSafeInteger(minor) || minor < 0 || minor > MAX_MINOR) {
    throw new RangeError(`Invalid minor amount: ${minor}`);
  }
  return { currency, minor };
}
