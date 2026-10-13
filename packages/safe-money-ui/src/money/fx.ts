import { CURRENCIES, MAX_MINOR, createMoney } from './currencies.js';
import type { CurrencyCode, Money } from './types.js';

/**
 * Fixed exchange rates relative to USD in micro-units (1 USD * 10^6).
 */
export const PER_USD_MICRO: Readonly<Record<CurrencyCode, number>> = {
  USD: 1_000_000,
  EUR: 920_000,
  GBP: 780_000,
  PLN: 4_000_000,
  INR: 83_500_000,
  JPY: 150_000_000,
  KWD: 307_000,
};

function roundHalfEven(numerator: bigint, denominator: bigint): bigint {
  const q = numerator / denominator;
  const r = numerator % denominator;
  const doubleR = 2n * r;

  if (doubleR > denominator) {
    return q + 1n;
  }
  if (doubleR < denominator) {
    return q;
  }
  return q % 2n === 0n ? q : q + 1n;
}

function validateMoney(money: Money): void {
  if (!money || typeof money !== 'object') {
    throw new RangeError('source must be a valid Money object');
  }
  if (!(money.currency in CURRENCIES)) {
    throw new RangeError(`Unsupported source currency: ${String(money.currency)}`);
  }
  if (!Number.isSafeInteger(money.minor) || money.minor < 0 || money.minor > MAX_MINOR) {
    throw new RangeError(
      `Invalid minor amount: ${String(money.minor)}. Must be a safe non-negative integer <= ${MAX_MINOR}.`,
    );
  }
}

/**
 * Converts a Money instance into a target currency using fixed rates and exact BigInt math.
 *
 * Implements banker's rounding (round-half-to-even) exactly once at the end of the calculation.
 * Preserves the source reference if source and target currencies match.
 *
 * @param source - The source Money amount to convert.
 * @param target - The target currency code.
 * @returns A new Money instance in the target currency, or source if unchanged.
 * @throws {RangeError} If source or target is invalid, or if the converted amount exceeds MAX_MINOR.
 *
 * @example
 * ```ts
 * const eur = convert(createMoney('USD', 10000), 'EUR'); // EUR 92.00
 * const jpy = convert(createMoney('USD', 10000), 'JPY'); // JPY 15000
 * ```
 */
export function convert(source: Money, target: CurrencyCode): Money {
  validateMoney(source);
  if (!(target in CURRENCIES)) {
    throw new RangeError(`Unsupported target currency: ${String(target)}`);
  }

  if (source.currency === target) {
    return source;
  }

  const dS = CURRENCIES[source.currency].decimals;
  const dT = CURRENCIES[target].decimals;

  const numerator = BigInt(source.minor) * BigInt(PER_USD_MICRO[target]) * 10n ** BigInt(dT);
  const denominator = BigInt(PER_USD_MICRO[source.currency]) * 10n ** BigInt(dS);

  const targetMinorBig = roundHalfEven(numerator, denominator);

  if (targetMinorBig > BigInt(MAX_MINOR)) {
    throw new RangeError(
      `Conversion result ${targetMinorBig.toString()} exceeds MAX_MINOR limit (${MAX_MINOR}).`,
    );
  }

  return createMoney(target, Number(targetMinorBig));
}
