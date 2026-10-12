/**
 * Computes roundHalfEven((value * mul) / div) in BigInt.
 * @example mulDivHalfEven(100, 1005, 1000)
 */
export function mulDivHalfEven(value: number, mul: number, div: number): number {
  const v = BigInt(value);
  const m = BigInt(mul);
  const d = BigInt(div);

  const num = v * m;
  const q = num / d;
  const r = num % d;

  if (2n * r > d) {
    return Number(q + 1n);
  }
  if (2n * r < d) {
    return Number(q);
  }
  // Tie: round to even
  return Number(q % 2n === 0n ? q : q + 1n);
}
