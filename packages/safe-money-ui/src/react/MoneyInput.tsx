import React, { useState, useRef, useEffect, type JSX } from 'react';
import { CURRENCIES } from '../money/currencies.js';
import { formatAmountInput, formatMoney } from '../money/format.js';
import { parseAmount, type ParseAmountOptions } from '../money/parse.js';
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

function createParseOptions(
  currency: CurrencyCode,
  locale: LocaleCode,
  minMinor?: number,
  maxMinor?: number,
): ParseAmountOptions {
  const opts: ParseAmountOptions = { currency, locale };
  if (minMinor !== undefined) {
    opts.minMinor = minMinor;
  }
  if (maxMinor !== undefined) {
    opts.maxMinor = maxMinor;
  }
  return opts;
}

function resolveErrorMessage(
  result: ParseResult,
  currency: CurrencyCode,
  messages: Record<ParseErrorCode, (ctx: ParseError & { currency: CurrencyCode }) => string>,
  externalError?: string,
): string | null {
  if (!result.ok) {
    const errorCtx = { ...result.error, currency };
    return messages[result.error.code](errorCtx);
  }
  if (externalError) {
    return externalError;
  }
  return null;
}

function resolveDescribedBy(
  id: string,
  showError: boolean,
  hasHint: boolean,
  hasPreview: boolean,
): string | undefined {
  const parts: string[] = [];
  if (showError) {
    parts.push(`${id}-error`);
  }
  if (hasHint) {
    parts.push(`${id}-hint`);
  }
  if (hasPreview) {
    parts.push(`${id}-preview`);
  }
  return parts.length > 0 ? parts.join(' ') : undefined;
}

function resolvePreview(
  result: ParseResult,
  value: string,
  locale: LocaleCode,
  previewLabel?: (formatted: string) => string,
): { hasPreview: boolean; previewText: string | null } {
  const hasPreview = result.ok && value.length > 0 && Boolean(previewLabel);
  const previewText =
    hasPreview && previewLabel && result.ok
      ? previewLabel(formatMoney(result.money, { locale }))
      : null;
  return { hasPreview, previewText };
}

function useCurrencyLocaleSync(props: MoneyInputProps): void {
  const isMountedRef = useRef(false);
  const prevCurrencyRef = useRef(props.currency);
  const prevLocaleRef = useRef(props.locale);

  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      return;
    }
    if (props.disabled) {
      prevCurrencyRef.current = props.currency;
      prevLocaleRef.current = props.locale;
      return;
    }
    const currencyChanged = prevCurrencyRef.current !== props.currency;
    const localeChanged = prevLocaleRef.current !== props.locale;
    if (currencyChanged || localeChanged) {
      prevCurrencyRef.current = props.currency;
      prevLocaleRef.current = props.locale;
      const refreshedResult = parseAmount(
        props.value,
        createParseOptions(props.currency, props.locale, props.minMinor, props.maxMinor),
      );
      props.onChange({ text: props.value, result: refreshedResult });
    }
  }, [props]);
}

/**
 * Accessible, controlled localized money input component.
 * @example
 * ```tsx
 * <MoneyInput
 *   id="amount"
 *   label="Amount"
 *   currency="USD"
 *   locale="en-US"
 *   value={amount}
 *   onChange={({ text, result }) => setAmount(text)}
 *   messages={messages}
 * />
 * ```
 */
export function MoneyInput(props: MoneyInputProps): JSX.Element {
  const [hasBlurred, setHasBlurred] = useState(false);
  useCurrencyLocaleSync(props);

  const currentResult = parseAmount(
    props.value,
    createParseOptions(props.currency, props.locale, props.minMinor, props.maxMinor),
  );

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (props.disabled) return;
    const rawText = event.target.value;
    const result = parseAmount(
      rawText,
      createParseOptions(props.currency, props.locale, props.minMinor, props.maxMinor),
    );
    props.onChange({ text: rawText, result });
  };

  const handleBlur = () => {
    if (props.disabled) return;
    setHasBlurred(true);
    if (currentResult.ok) {
      const normalized = formatAmountInput(currentResult.money, props.locale);
      props.onChange({ text: normalized, result: currentResult });
    }
  };

  const isErrorVisible = hasBlurred || Boolean(props.showErrors);
  const rawErrorMessage = resolveErrorMessage(
    currentResult,
    props.currency,
    props.messages,
    props.externalError,
  );
  const visibleErrorMessage = isErrorVisible ? rawErrorMessage : null;

  const { hasPreview, previewText } = resolvePreview(
    currentResult,
    props.value,
    props.locale,
    props.previewLabel,
  );
  const ariaDescribedBy = resolveDescribedBy(
    props.id,
    Boolean(visibleErrorMessage),
    Boolean(props.hint),
    hasPreview,
  );
  const inputMode = CURRENCIES[props.currency].decimals > 0 ? 'decimal' : 'numeric';

  return (
    <div className="smu-field">
      <label htmlFor={props.id} className="smu-label">
        {props.label}
      </label>
      <input
        id={props.id}
        type="text"
        autoComplete="off"
        spellCheck="false"
        inputMode={inputMode}
        value={props.value}
        disabled={props.disabled}
        aria-invalid={visibleErrorMessage ? 'true' : undefined}
        aria-describedby={ariaDescribedBy}
        onChange={handleInputChange}
        onBlur={handleBlur}
        className="smu-input"
      />
      {visibleErrorMessage ? (
        <p id={`${props.id}-error`} className="smu-error">
          {visibleErrorMessage}
        </p>
      ) : null}
      {props.hint ? (
        <p id={`${props.id}-hint`} className="smu-hint">
          {props.hint}
        </p>
      ) : null}
      {hasPreview && previewText ? (
        <p id={`${props.id}-preview`} aria-live="polite" className="smu-preview">
          {previewText}
        </p>
      ) : null}
    </div>
  );
}
