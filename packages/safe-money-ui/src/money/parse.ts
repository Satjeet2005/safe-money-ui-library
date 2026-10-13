import { CURRENCIES, MAX_MINOR, createMoney } from './currencies.js';
import type { CurrencyCode, LocaleCode, ParseResult } from './types.js';

/**
 * Configuration options for parsing localized currency amounts.
 */
export type ParseAmountOptions = {
  /** The ISO 4217 currency code. */
  currency: CurrencyCode;
  /** The target BCP 47 locale code for number format conventions. */
  locale: LocaleCode;
  /** Optional lower bound in minor currency units (inclusive). */
  minMinor?: number;
  /** Optional upper bound in minor currency units (inclusive). */
  maxMinor?: number;
  /** Whether to accept a zero amount (minor === 0). Defaults to false. */
  allowZero?: boolean;
};

interface LocaleConfig {
  readonly decimalSep: string;
  readonly groupSeps: readonly string[];
  readonly groupRegex: RegExp;
}

const SUPPORTED_LOCALES: readonly LocaleCode[] = ['en-US', 'de-DE', 'pl-PL', 'en-IN'];

const LOCALE_CONFIGS: Readonly<Record<LocaleCode, LocaleConfig>> = {
  'en-US': {
    decimalSep: '.',
    groupSeps: [','],
    groupRegex: /^\d{1,3}(,\d{3})+$/,
  },
  'de-DE': {
    decimalSep: ',',
    groupSeps: ['.'],
    groupRegex: /^\d{1,3}(\.\d{3})+$/,
  },
  'pl-PL': {
    decimalSep: ',',
    groupSeps: [' ', '\u00A0', '\u202F'],
    groupRegex: /^\d{1,3}([ \u00A0\u202F]\d{3})+$/,
  },
  'en-IN': {
    decimalSep: '.',
    groupSeps: [','],
    groupRegex: /^\d{1,2}(,\d{2})*,\d{3}$/,
  },
};

/**
 * Parses a localized currency string into a validated ParseResult.
 *
 * Implements a strict 12-step decimal and grouping parsing algorithm without floating-point math.
 * Never throws on malformed string input. Throws RangeError only on unsupported currency or locale.
 *
 * @param input - The localized currency string to parse.
 * @param opts - Parsing configuration options including currency and locale.
 * @returns A ParseResult containing either the validated Money value or a typed ParseError.
 * @throws {RangeError} If opts.currency or opts.locale is unsupported.
 *
 * @example
 * ```ts
 * const result = parseAmount('1,234.56', { currency: 'USD', locale: 'en-US' });
 * if (result.ok) {
 *   console.log(result.money); // { currency: 'USD', minor: 123456 }
 * }
 * ```
 */
export function parseAmount(input: string, opts: ParseAmountOptions): ParseResult {
  if (!opts || typeof opts !== 'object') {
    throw new RangeError('opts must be an options object');
  }

  if (!(opts.currency in CURRENCIES)) {
    throw new RangeError(`Unsupported currency: ${String(opts.currency)}`);
  }

  if (!SUPPORTED_LOCALES.includes(opts.locale)) {
    throw new RangeError(`Unsupported locale: ${String(opts.locale)}`);
  }

  // Step 1: Input preprocessing (trim whitespace)
  const trimmed = typeof input === 'string' ? input.trim() : '';
  if (trimmed.length === 0) {
    return { ok: false, error: { code: 'EMPTY' } };
  }

  // Step 2: Negative sign check
  if (trimmed.startsWith('-') || trimmed.startsWith('\u2212')) {
    return { ok: false, error: { code: 'NEGATIVE_NOT_ALLOWED' } };
  }

  const config = LOCALE_CONFIGS[opts.locale];

  // Step 3: Permitted character check
  const permittedChars = new Set<string>([
    '0',
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    config.decimalSep,
    ...config.groupSeps,
  ]);

  for (const ch of trimmed) {
    if (!permittedChars.has(ch)) {
      return { ok: false, error: { code: 'NOT_A_NUMBER' } };
    }
  }

  // Step 4: Decimal separator count check
  let decimalCount = 0;
  for (const ch of trimmed) {
    if (ch === config.decimalSep) {
      decimalCount++;
    }
  }
  if (decimalCount > 1) {
    return { ok: false, error: { code: 'MULTIPLE_DECIMAL_SEPARATORS' } };
  }

  // Step 5: Split at decimal separator & validate fraction grouping
  const decIndex = trimmed.indexOf(config.decimalSep);
  const hasDecimal = decIndex !== -1;
  const integerPart = hasDecimal ? trimmed.slice(0, decIndex) : trimmed;
  const fractionPart = hasDecimal ? trimmed.slice(decIndex + 1) : '';

  for (const groupSep of config.groupSeps) {
    if (fractionPart.includes(groupSep)) {
      return { ok: false, error: { code: 'INVALID_GROUPING' } };
    }
  }

  // Step 6: Validate integerPart grouping
  const hasGrouping = config.groupSeps.some((sep) => integerPart.includes(sep));
  if (hasGrouping) {
    if (!config.groupRegex.test(integerPart)) {
      return { ok: false, error: { code: 'INVALID_GROUPING' } };
    }
  }

  // Step 7: Total digit count check
  let digitCount = 0;
  for (const ch of trimmed) {
    if (ch >= '0' && ch <= '9') {
      digitCount++;
    }
  }
  if (digitCount === 0) {
    return { ok: false, error: { code: 'NOT_A_NUMBER' } };
  }

  // Step 8: Precision check against currency definition
  let cleanIntegerDigits = '';
  for (const ch of integerPart) {
    if (ch >= '0' && ch <= '9') {
      cleanIntegerDigits += ch;
    }
  }

  const currencyDef = CURRENCIES[opts.currency];
  const d = currencyDef.decimals;

  if (d === 0) {
    if (hasDecimal) {
      return { ok: false, error: { code: 'TOO_MANY_DECIMALS', maxDecimals: 0 } };
    }
  } else {
    if (fractionPart.length > d) {
      return { ok: false, error: { code: 'TOO_MANY_DECIMALS', maxDecimals: d } };
    }
  }

  // Step 9: Magnitude check on integer digits
  const normalizedInteger = cleanIntegerDigits.replace(/^0+/, '');
  if (normalizedInteger.length > 13) {
    return { ok: false, error: { code: 'UNSAFE_MAGNITUDE' } };
  }

  // Step 10: Compute minor units using BigInt (no floating-point arithmetic)
  const paddedFraction = fractionPart.padEnd(d, '0');
  const intBig = normalizedInteger === '' ? 0n : BigInt(normalizedInteger);
  const fracBig = paddedFraction === '' ? 0n : BigInt(paddedFraction);
  const minorBig = intBig * 10n ** BigInt(d) + fracBig;

  if (minorBig > BigInt(MAX_MINOR)) {
    return { ok: false, error: { code: 'UNSAFE_MAGNITUDE' } };
  }

  const minor = Number(minorBig);

  // Step 11: Zero check
  if (minor === 0 && !opts.allowZero) {
    return { ok: false, error: { code: 'ZERO_NOT_ALLOWED' } };
  }

  // Step 12: Range checks
  if (opts.minMinor !== undefined && minor < opts.minMinor) {
    return { ok: false, error: { code: 'BELOW_MIN', limitMinor: opts.minMinor } };
  }

  if (opts.maxMinor !== undefined && minor > opts.maxMinor) {
    return { ok: false, error: { code: 'ABOVE_MAX', limitMinor: opts.maxMinor } };
  }

  return {
    ok: true,
    money: createMoney(opts.currency, minor),
  };
}
