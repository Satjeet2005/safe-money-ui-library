import { CURRENCIES, MAX_MINOR, createMoney } from './currencies.js';
import type { CurrencyCode, Money } from './types.js';

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
 * Computes the transaction fee in the source currency.
 *
 * Same-currency transfers have zero fee. Cross-currency transfers incur a 0.5% fee
 * (rounded half-to-even) with a minimum fee floor of 100 minor units.
 *
 * @param source - The source Money amount being transferred.
 * @param target - The target currency code.
 * @returns A Money instance representing the fee denominated in the source currency.
 * @throws {RangeError} If source or target is invalid or unsupported.
 *
 * @example
 * ```ts
 * const feeSame = computeFee(createMoney('USD', 10000), 'USD'); // USD 0
 * const feeCross = computeFee(createMoney('USD', 100000), 'EUR'); // USD 5.00
 * const feeMin = computeFee(createMoney('USD', 10000), 'EUR'); // USD 1.00 (min fee)
 * ```
 */
export function computeFee(source: Money, target: CurrencyCode): Money {
  validateMoney(source);
  if (!(target in CURRENCIES)) {
    throw new RangeError(`Unsupported target currency: ${String(target)}`);
  }

  if (source.currency === target) {
    return createMoney(source.currency, 0);
  }

  const rawFeeBig = roundHalfEven(BigInt(source.minor) * 5n, 1000n);
  const minFeeBig = 100n;
  const feeMinorBig = rawFeeBig < minFeeBig ? minFeeBig : rawFeeBig;

  return createMoney(source.currency, Number(feeMinorBig));
}
