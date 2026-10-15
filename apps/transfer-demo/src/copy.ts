import { formatMoney } from '@satjeetsingh1/safe-money-ui/money';
import type {
  CurrencyCode,
  LocaleCode,
  ParseError,
  ParseErrorCode,
} from '@satjeetsingh1/safe-money-ui/money';

export const COPY = {
  'app.title': 'Northwind Pay',
  'app.demoBanner':
    'Demo with fictional data. No real money moves. Not affiliated with any bank or payments company.',
  'load.loading': 'Loading…',
  'load.accounts.failed': "We couldn't load your accounts.",
  'load.recipients.failed': "We couldn't load your recipients.",
  'load.retry': 'Try again',
  'form.heading': 'Send money',
  'form.recipient.label': 'Recipient',
  'form.recipient.placeholder': 'Choose a recipient',
  'form.recipient.required': 'Choose a recipient.',
  'form.account.label': 'From account',
  'form.locale.label': 'Number format',
  'form.amount.label': 'You send',
  'form.amount.hint': 'Between {min} and {max} per transfer.',
  'form.amount.preview': 'You send {amount}',
  'form.error.insufficient': 'Not enough funds. Available: {balance}.',
  'form.review.button': 'Review transfer',
  'form.review.loading': 'Getting your rate…',
  'form.summary.title': 'Fix {n} problems to continue',
  'quote.failed': "We couldn't get a rate. Nothing was sent.",
  'error.EMPTY': 'Enter an amount.',
  'error.NOT_A_NUMBER': 'Use digits only. Choose the currency separately.',
  'error.NEGATIVE_NOT_ALLOWED': 'Amount cannot be negative.',
  'error.MULTIPLE_DECIMAL_SEPARATORS': 'Use only one decimal separator.',
  'error.INVALID_GROUPING':
    'Thousands separators are in the wrong place. Remove them or check the number format.',
  'error.TOO_MANY_DECIMALS': '{currency} allows up to {maxDecimals} decimals.',
  'error.ZERO_NOT_ALLOWED': 'Amount must be more than zero.',
  'error.BELOW_MIN': 'Minimum is {limit}.',
  'error.ABOVE_MAX': 'Maximum per transfer is {limit}.',
  'error.UNSAFE_MAGNITUDE': 'That number is too large.',
  'review.heading': 'Review your transfer',
  'review.to': 'To',
  'review.send': 'You send',
  'review.fee': 'Fee',
  'review.total': 'Total from your account',
  'review.rate': 'Rate',
  'review.receive': 'They receive',
  'review.rateHeld': 'The rate is held for 30 seconds from when this screen opens.',
  'review.confirm': 'Confirm and send',
  'review.sending': 'Sending…',
  'review.edit': 'Edit details',
  'review.changed':
    'Your details changed after review. Review the updated transfer before confirming.',
  'review.rateChanged': 'The rate changed. Review the new amounts before confirming.',
  'review.rateRefreshed': 'Your rate expired, so we refreshed it. Your amounts have not changed.',
  'submit.sending': 'Sending your transfer…',
  'submit.invalid_response': "We received a response we couldn't verify.",
  'result.success.heading': 'Transfer sent',
  'result.success.id': 'Transfer ID',
  'result.success.sent': 'You sent',
  'result.success.received': 'They receive',
  'result.success.another': 'Send another',
  'result.rejected.heading': 'Transfer not sent',
  'result.rejected.INSUFFICIENT_FUNDS':
    "Your account doesn't have enough money for this transfer. Nothing was sent.",
  'result.rejected.RECIPIENT_BLOCKED':
    "This recipient can't receive transfers right now. Nothing was sent.",
  'result.rejected.SERVICE_UNAVAILABLE':
    'The service is temporarily unavailable. Nothing was sent.',
  'result.rejected.QUOTE_EXPIRED': 'The rate expired. Nothing was sent.',
  'result.rejected.LIMIT_EXCEEDED': 'This amount is over your limit. Nothing was sent.',
  'result.unconfirmed.heading': "We couldn't confirm this transfer",
  'result.unconfirmed.body':
    "Your money may or may not have been sent. Trying again is safe: we won't send it twice.",
  'result.retry': 'Try again',
  'result.leave': 'Leave without retrying',
  'result.edit': 'Edit details',
  'unconfirmed.banner':
    'Your last transfer is unconfirmed. Check Recent activity before sending again.',
  'history.heading': 'Recent activity',
  'history.empty': 'No transfers yet.',
  'history.completed': 'Completed',
  'history.unconfirmed': 'Unconfirmed',
  'draft.discarded': 'Your saved draft was unreadable, so we cleared it.',
  'chaos.preset.invalid':
    'The chaos preset in the address could not be read, so defaults are used.',
  'chaos.toggle': 'Chaos mode',
  'chaos.heading': 'Chaos mode',
  'chaos.helper': 'These switches change the simulated server so you can try to break the app.',
  'chaos.presets.legend': 'Presets',
  'chaos.preset.slow': 'Slow network',
  'chaos.preset.timeout': 'Timeout then recover',
  'chaos.preset.lost': 'Lost response',
  'chaos.preset.badPayload': 'Bad payload',
  'chaos.latency.legend': 'Latency',
  'chaos.latency.none': 'None',
  'chaos.latency.500ms': '500 ms',
  'chaos.latency.3s': '3 s',
  'chaos.hang': 'Requests hang (never respond)',
  'chaos.late': 'Response arrives after the timeout (first attempt only)',
  'chaos.malformed': 'Malformed response (every call)',
  'chaos.wrongAmounts': 'Valid response with wrong amounts',
  'chaos.rejection.legend': 'Server rejection',
  'chaos.rejection.none': 'None',
  'chaos.rejection.insufficientFunds': 'Insufficient funds',
  'chaos.rejection.recipientBlocked': 'Recipient blocked',
  'chaos.rejection.serviceUnavailable': 'Service unavailable',
  'chaos.lost': 'Lose the response after the server completes (first attempt only)',
  'chaos.rate': 'Rate moves on the next quote (+0.5%)',
  'chaos.corruptStorage': 'Corrupt the saved draft (reload to see recovery)',
  'chaos.edit': 'Simulate edit from another tab',
  'chaos.doubleClick': 'Double-click Confirm',
  'chaos.reset': 'Reset chaos',
  'chaos.copyLink': 'Copy link to this chaos setup',
  'chaos.copied': 'Copied!',
  'controller.timeout': 'The request timed out.',
  'controller.network': 'The network request failed.',
  'controller.invalid': 'The response could not be understood.',
} as const;

export type CopyKey = keyof typeof COPY;

export const UI_LABELS = {
  chaosButton: 'Chaos mode',
  demoNotice: 'Demo notice',
  accountSummary: 'Account Summary',
} as const;

/**
 * Replaces `{name}` placeholders in template string with variable values.
 * @example
 * ```ts
 * interpolate('You send {amount}', { amount: '$100.00' }); // 'You send $100.00'
 * ```
 */
export function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_match, key: string) => {
    const val = vars[key];
    return val !== undefined ? String(val) : `{${key}}`;
  });
}

/**
 * Formats the ErrorSummary title with singular/plural copy for validation errors.
 * @example
 * ```ts
 * formatSummaryTitle(1); // 'Fix 1 problem to continue'
 * formatSummaryTitle(2); // 'Fix 2 problems to continue'
 * ```
 */
export function formatSummaryTitle(count: number): string {
  if (count === 1) {
    return 'Fix 1 problem to continue';
  }
  return interpolate(COPY['form.summary.title'], { n: count });
}

/**
 * Creates MoneyInput error message map for a given locale.
 * @example
 * ```ts
 * const messages = createMoneyInputMessages('en-US');
 * messages.EMPTY({ code: 'EMPTY', currency: 'USD' });
 * ```
 */
export function createMoneyInputMessages(
  locale: LocaleCode,
): Record<ParseErrorCode, (ctx: ParseError & { currency: CurrencyCode }) => string> {
  return {
    EMPTY: () => COPY['error.EMPTY'],
    NOT_A_NUMBER: () => COPY['error.NOT_A_NUMBER'],
    NEGATIVE_NOT_ALLOWED: () => COPY['error.NEGATIVE_NOT_ALLOWED'],
    MULTIPLE_DECIMAL_SEPARATORS: () => COPY['error.MULTIPLE_DECIMAL_SEPARATORS'],
    INVALID_GROUPING: () => COPY['error.INVALID_GROUPING'],
    TOO_MANY_DECIMALS: (ctx) => {
      if (ctx.maxDecimals === 0) {
        return `${ctx.currency} has no decimals. Enter a whole number.`;
      }
      return interpolate(COPY['error.TOO_MANY_DECIMALS'], {
        currency: ctx.currency,
        maxDecimals: ctx.maxDecimals ?? 2,
      });
    },
    ZERO_NOT_ALLOWED: () => COPY['error.ZERO_NOT_ALLOWED'],
    BELOW_MIN: (ctx) =>
      interpolate(COPY['error.BELOW_MIN'], {
        limit: formatMoney({ currency: ctx.currency, minor: ctx.limitMinor ?? 0 }, { locale }),
      }),
    ABOVE_MAX: (ctx) =>
      interpolate(COPY['error.ABOVE_MAX'], {
        limit: formatMoney({ currency: ctx.currency, minor: ctx.limitMinor ?? 0 }, { locale }),
      }),
    UNSAFE_MAGNITUDE: () => COPY['error.UNSAFE_MAGNITUDE'],
  };
}

/**
 * Gets user-facing rejection message for a service rejection error code.
 * @example
 * ```ts
 * getRejectionMessage('INSUFFICIENT_FUNDS');
 * ```
 */
export function getRejectionMessage(code: string): string {
  const key = `result.rejected.${code}` as CopyKey;
  return COPY[key] ?? COPY['submit.invalid_response'];
}
