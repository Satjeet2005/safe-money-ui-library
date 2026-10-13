import { parseAmount, formatMoney, computeFee } from '@satjeet2005/safe-money-ui/money';
import { COPY, createMoneyInputMessages, interpolate } from '../copy.js';
import type { Account, Recipient } from '../store/dataSlice.js';
import type { DraftState } from '../store/draftSlice.js';
import { FIXTURES } from '../service/fixtures.js';

/**
 * Computes insufficient funds error if amount + fee exceeds account balance.
 * @example
 * ```ts
 * computeInsufficientFundsError(draft, accounts, recipients);
 * ```
 */
export function computeInsufficientFundsError(
  draft: DraftState,
  accounts: Account[] | null,
  recipients: Recipient[] | null,
): string | null {
  const parsed = parseAmount(draft.amountText, {
    currency: draft.sourceCurrency,
    locale: draft.locale,
    minMinor: FIXTURES.MIN_SEND_MINOR,
    maxMinor: FIXTURES.MAX_SEND_MINOR,
  });
  if (!parsed.ok || !draft.recipientId) {
    return null;
  }
  const recipient = recipients?.find((r) => r.id === draft.recipientId);
  const account = accounts?.find((a) => a.currency === draft.sourceCurrency);
  if (!recipient || !account) {
    return null;
  }
  const fee = computeFee(parsed.money, recipient.currency);
  if (parsed.money.minor + fee.minor > account.balanceMinor) {
    return interpolate(COPY['form.error.insufficient'], {
      balance: formatMoney(
        { currency: draft.sourceCurrency, minor: account.balanceMinor },
        { locale: draft.locale },
      ),
    });
  }
  return null;
}

/**
 * Builds list of form validation errors in specified field order.
 * @example
 * ```ts
 * buildFormErrorList(draft, accounts, recipients, messages);
 * ```
 */
export function buildFormErrorList(
  draft: DraftState,
  accounts: Account[] | null,
  recipients: Recipient[] | null,
  messages: ReturnType<typeof createMoneyInputMessages>,
): Array<{ fieldId: string; message: string }> {
  const errors: Array<{ fieldId: string; message: string }> = [];
  if (!draft.recipientId) {
    errors.push({ fieldId: 'recipient', message: COPY['form.recipient.required'] });
  }
  const parsed = parseAmount(draft.amountText, {
    currency: draft.sourceCurrency,
    locale: draft.locale,
    minMinor: FIXTURES.MIN_SEND_MINOR,
    maxMinor: FIXTURES.MAX_SEND_MINOR,
  });
  if (!parsed.ok) {
    errors.push({
      fieldId: 'amount',
      message: messages[parsed.error.code]({ ...parsed.error, currency: draft.sourceCurrency }),
    });
  } else {
    const insufficientError = computeInsufficientFundsError(draft, accounts, recipients);
    if (insufficientError) {
      errors.push({ fieldId: 'amount', message: insufficientError });
    }
  }
  return errors;
}
