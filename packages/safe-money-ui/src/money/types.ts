export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'PLN' | 'INR' | 'JPY' | 'KWD';
export type LocaleCode = 'en-US' | 'de-DE' | 'pl-PL' | 'en-IN';

export type Money = Readonly<{
  currency: CurrencyCode;
  minor: number;
}>;

export type ParseErrorCode =
  | 'EMPTY'
  | 'NOT_A_NUMBER'
  | 'NEGATIVE_NOT_ALLOWED'
  | 'MULTIPLE_DECIMAL_SEPARATORS'
  | 'INVALID_GROUPING'
  | 'TOO_MANY_DECIMALS'
  | 'ZERO_NOT_ALLOWED'
  | 'BELOW_MIN'
  | 'ABOVE_MAX'
  | 'UNSAFE_MAGNITUDE';

export type ParseError = Readonly<{
  code: ParseErrorCode;
  maxDecimals?: number;
  limitMinor?: number;
}>;

export type ParseResult =
  Readonly<{ ok: true; money: Money }> | Readonly<{ ok: false; error: ParseError }>;
