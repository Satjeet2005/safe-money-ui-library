import fc from 'fast-check';
import { CURRENCIES, createMoney } from '../../src/money/currencies.js';
import { computeFee } from '../../src/money/fee.js';
import { PER_USD_MICRO, convert } from '../../src/money/fx.js';
import {
  currencyArb,
  fxAmountArb,
  getPropertyConfig,
  sourceCurrencyArb,
} from '../helpers/arbitraries.js';

function independentRoundHalfEven(numerator: bigint, denominator: bigint): bigint {
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

describe('Property test: FX and fee mathematics (P3)', () => {
  it('P3: verifies monotonic conversion, drift bound, identity, rounding bound, and independent fees', () => {
    fc.assert(
      fc.property(
        sourceCurrencyArb,
        currencyArb,
        fxAmountArb,
        fxAmountArb,
        (source, target, a, b) => {
          const mA = createMoney(source, a);
          const mB = createMoney(source, b);

          // (i) Monotonic conversion
          if (a <= b) {
            expect(convert(mA, target).minor).toBeLessThanOrEqual(convert(mB, target).minor);
          } else {
            expect(convert(mA, target).minor).toBeGreaterThanOrEqual(convert(mB, target).minor);
          }

          // (ii) Additive drift bound: |convert(a) + convert(b) - convert(a + b)| <= 1
          const convA = convert(mA, target).minor;
          const convB = convert(mB, target).minor;
          const mSum = createMoney(source, a + b);
          const convSum = convert(mSum, target).minor;
          expect(Math.abs(convA + convB - convSum)).toBeLessThanOrEqual(1);

          // (iii) Same-currency identity
          if (source === target) {
            expect(convert(mA, target)).toBe(mA);
          }

          // (iv) Half-minor-unit rounding bound: 2 * |result * den - num| <= den
          const dS = CURRENCIES[source].decimals;
          const dT = CURRENCIES[target].decimals;
          const num = BigInt(a) * BigInt(PER_USD_MICRO[target]) * 10n ** BigInt(dT);
          const den = BigInt(PER_USD_MICRO[source]) * 10n ** BigInt(dS);
          const resultMinor = BigInt(convert(mA, target).minor);
          const diff = resultMinor * den - num;
          const absDiff = diff < 0n ? -diff : diff;
          expect(2n * absDiff <= den).toBe(true);

          // (v) Independently computed fee formula
          const fee = computeFee(mA, target);
          if (source === target) {
            expect(fee).toEqual({ currency: source, minor: 0 });
          } else {
            expect(fee.currency).toBe(source);
            expect(fee.minor).toBeGreaterThanOrEqual(100);
            const rawFee = independentRoundHalfEven(BigInt(a) * 5n, 1000n);
            const expectedFee = rawFee < 100n ? 100n : rawFee;
            expect(fee.minor).toBe(Number(expectedFee));
          }
        },
      ),
      getPropertyConfig(),
    );
  });
});
