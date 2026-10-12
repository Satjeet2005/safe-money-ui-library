import { mulDivHalfEven } from './math.js';

/**
 * Formats rateMicro into a 4-decimal currency exchange rate string.
 * @example formatRate(920000) // '0.9200'
 */
export function formatRate(rateMicro: number): string {
  // rateMicro represents rate * 1_000_000.
  // We want 4 decimal places, which is rate * 10_000 = rateMicro / 100.
  const scaled = mulDivHalfEven(rateMicro, 1, 100);
  const intPart = Math.floor(scaled / 10_000);
  const fracPart = String(scaled % 10_000).padStart(4, '0');
  return `${intPart}.${fracPart}`;
}
