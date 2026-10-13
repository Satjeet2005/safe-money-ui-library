import { CURRENCIES, MAX_MINOR } from './currencies.js';
import type { LocaleCode, Money } from './types.js';

/**
 * Options for display-formatting a Money instance using Intl.NumberFormat.
 */
export type FormatMoneyOptions = {
  /** The target BCP 47 locale code. */
  locale: LocaleCode;
  /** Display style: currency symbol (e.g. '$') or ISO code (e.g. 'USD'). Defaults to 'symbol'. */
  display?: 'symbol' | 'code';
};

const SUPPORTED_LOCALES: readonly LocaleCode[] = ['en-US', 'de-DE', 'pl-PL', 'en-IN'];

const DECIMAL_SEPARATORS: Readonly<Record<LocaleCode, string>> = {
  'en-US': '.',
  'de-DE': ',',
  'pl-PL': ',',
  'en-IN': '.',
};

/**
 * Type-only compatibility bridge:
 * The project's tsconfig targets ES2022 lib where `Intl.NumberFormat.prototype.format`
 * is typed to accept only `number | bigint`. Modern engines (ES2023+ / Intl.NumberFormat v3)
 * natively accept string numeric literals for arbitrary-precision decimal formatting.
 * This narrow interface avoids lossy floating-point conversions and avoids `any`.
 */
interface FormatterWithStringInput {
  format(value: string | number | bigint): string;
}

interface DecimalParts {
  readonly integerStr: string;
  readonly fractionStr: string;
  readonly decimals: number;
}

function validateMoney(money: Money): void {
  if (!money || typeof money !== 'object') {
    throw new RangeError('money must be a valid Money object');
  }
  if (!(money.currency in CURRENCIES)) {
    throw new RangeError(`Unsupported currency: ${String(money.currency)}`);
  }
  if (!Number.isSafeInteger(money.minor) || money.minor < 0 || money.minor > MAX_MINOR) {
    throw new RangeError(
      `Invalid minor amount: ${String(money.minor)}. Must be a safe non-negative integer <= ${MAX_MINOR}.`,
    );
  }
}

function validateLocale(locale: LocaleCode): void {
  if (!SUPPORTED_LOCALES.includes(locale)) {
    throw new RangeError(`Unsupported locale: ${String(locale)}`);
  }
}

function toDecimalParts(money: Money): DecimalParts {
  const decimals = CURRENCIES[money.currency].decimals;
  const minorBig = BigInt(money.minor);

  if (decimals === 0) {
    return {
      integerStr: minorBig.toString(),
      fractionStr: '',
      decimals: 0,
    };
  }

  const divisor = 10n ** BigInt(decimals);
  const intPart = minorBig / divisor;
  const fracPart = minorBig % divisor;

  return {
    integerStr: intPart.toString(),
    fractionStr: fracPart.toString().padStart(decimals, '0'),
    decimals,
  };
}

function groupInteger(integerStr: string, locale: LocaleCode): string {
  if (locale === 'en-IN') {
    if (integerStr.length <= 3) {
      return integerStr;
    }
    const last3 = integerStr.slice(-3);
    const rest = integerStr.slice(0, -3);
    const groupedRest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    return `${groupedRest},${last3}`;
  }

  if (locale === 'de-DE') {
    return integerStr.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  if (locale === 'pl-PL') {
    return integerStr.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');
  }

  // en-US
  return integerStr.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Formats a Money instance into a locale-aware numeric string suitable for input fields.
 *
 * Implemented without `Intl` using the hard-coded locale table (PRD §7.3) so that
 * formatting and parsing agree by construction. Never uses floating-point arithmetic.
 * Always renders the currency's full decimal precision including trailing zeros.
 *
 * @param money - The Money instance to format.
 * @param locale - The target locale determining decimal and grouping conventions.
 * @returns The formatted numeric string without currency symbols.
 * @throws {RangeError} If money or locale is invalid or unsupported.
 *
 * @example
 * ```ts
 * formatAmountInput(createMoney('USD', 123456), 'en-US'); // "1,234.56"
 * formatAmountInput(createMoney('EUR', 123456), 'de-DE'); // "1.234,56"
 * formatAmountInput(createMoney('JPY', 1234), 'en-US');   // "1,234"
 * ```
 */
export function formatAmountInput(money: Money, locale: LocaleCode): string {
  validateMoney(money);
  validateLocale(locale);

  const { integerStr, fractionStr, decimals } = toDecimalParts(money);
  const groupedInteger = groupInteger(integerStr, locale);

  if (decimals === 0) {
    return groupedInteger;
  }

  const decimalSep = DECIMAL_SEPARATORS[locale];
  return `${groupedInteger}${decimalSep}${fractionStr}`;
}

/**
 * Formats a Money instance for display using `Intl.NumberFormat`.
 *
 * Constructs an exact decimal string from integer minor units (never floating-point numbers)
 * and delegates display formatting to the ECMAScript Intl standard.
 *
 * @param money - The Money instance to format for display.
 * @param options - Configuration options specifying locale and display style.
 * @returns The localized display string including currency symbol or code.
 * @throws {RangeError} If money, locale, or options are invalid or unsupported.
 *
 * @example
 * ```ts
 * formatMoney(createMoney('USD', 123456), { locale: 'en-US' }); // "$1,234.56"
 * formatMoney(createMoney('EUR', 123456), { locale: 'de-DE' }); // "1.234,56 €"
 * formatMoney(createMoney('KWD', 1500), { locale: 'en-US', display: 'code' }); // "KWD 1.500"
 * ```
 */
export function formatMoney(money: Money, options: FormatMoneyOptions): string {
  validateMoney(money);
  if (!options || typeof options !== 'object') {
    throw new RangeError('options must be an object');
  }
  validateLocale(options.locale);

  const { integerStr, fractionStr, decimals } = toDecimalParts(money);
  const decimalString = decimals === 0 ? integerStr : `${integerStr}.${fractionStr}`;

  const formatter = new Intl.NumberFormat(options.locale, {
    style: 'currency',
    currency: money.currency,
    currencyDisplay: options.display ?? 'symbol',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }) as unknown as FormatterWithStringInput;

  return formatter.format(decimalString);
}
