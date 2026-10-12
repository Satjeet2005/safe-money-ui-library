import type { JSX } from 'react';
import type {
  CurrencyCode,
  LocaleCode,
  ParseError,
  ParseErrorCode,
  ParseResult,
} from '../money/types.js';

export type MoneyInputProps = Readonly<{
  id: string;
  label: string;
  currency: CurrencyCode;
  locale: LocaleCode;
  value: string;
  onChange: (next: { text: string; result: ParseResult }) => void;
  messages: Record<ParseErrorCode, (ctx: ParseError & { currency: CurrencyCode }) => string>;
  minMinor?: number;
  maxMinor?: number;
  hint?: string;
  previewLabel?: (formatted: string) => string;
  externalError?: string;
  showErrors?: boolean;
  disabled?: boolean;
}>;

/**
 * Accessible Money input component.
 * @example <MoneyInput id="amount" label="Amount" currency="USD" locale="en-US" value={val} onChange={handleChange} messages={msg} />
 */
export function MoneyInput(props: MoneyInputProps): JSX.Element {
  return (
    <div className="smu-field">
      <label htmlFor={props.id}>{props.label}</label>
      <input
        id={props.id}
        type="text"
        autoComplete="off"
        spellCheck="false"
        value={props.value}
        disabled={props.disabled}
        onChange={() => {}}
      />
    </div>
  );
}
