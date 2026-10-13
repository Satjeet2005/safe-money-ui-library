import { useMemo, type JSX } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { MoneyInput, ErrorSummary } from '@satjeet2005/safe-money-ui/react';
import { formatMoney, type LocaleCode } from '@satjeet2005/safe-money-ui/money';
import { Banner } from '../components/Banner.js';
import { StepHeading } from '../components/StepHeading.js';
import { COPY, formatSummaryTitle, createMoneyInputMessages, interpolate } from '../copy.js';
import { loadAccounts, loadRecipients } from '../store/dataSlice.js';
import {
  setRecipient,
  setSourceCurrency,
  setAmountText,
  setLocale,
  attemptFailed,
} from '../store/draftSlice.js';
import { fetchQuote } from '../store/flowSlice.js';
import type { RootState, AppDispatch } from '../store/store.js';
import { FIXTURES } from '../service/fixtures.js';
import type { SourceCurrency } from '../service/schemas.js';
import { computeInsufficientFundsError, buildFormErrorList } from './sendFormValidation.js';
import { useDraftPersistence, useInitialDataLoad } from './useSendFormState.js';

function renderBanner(
  banner: RootState['flow']['banner'],
  onRetryAccounts: () => void,
  onRetryRecipients: () => void,
  onRetryQuote: () => void,
): JSX.Element | null {
  if (!banner) {
    return null;
  }
  const retryHandler =
    banner.copyKey === 'load.accounts.failed'
      ? onRetryAccounts
      : banner.copyKey === 'load.recipients.failed'
        ? onRetryRecipients
        : banner.copyKey === 'quote.failed'
          ? onRetryQuote
          : null;

  return (
    <Banner kind={banner.kind}>
      <span>{COPY[banner.copyKey]}</span>
      {retryHandler && (
        <button type="button" onClick={retryHandler}>
          {COPY['load.retry']}
        </button>
      )}
    </Banner>
  );
}

/**
 * SendForm screen for selecting recipient, account, locale, and amount.
 * @example
 * ```tsx
 * <SendForm />
 * ```
 */
export function SendForm(): JSX.Element {
  const dispatch = useDispatch<AppDispatch>();
  const draft = useSelector((state: RootState) => state.draft);
  const data = useSelector((state: RootState) => state.data);
  const flow = useSelector((state: RootState) => state.flow);

  useDraftPersistence(dispatch, draft);
  useInitialDataLoad(dispatch, data.accountsStatus, data.recipientsStatus);

  const moneyMessages = useMemo(() => createMoneyInputMessages(draft.locale), [draft.locale]);

  const insufficientFundsError = useMemo(
    () => computeInsufficientFundsError(draft, data.accounts, data.recipients),
    [draft, data.accounts, data.recipients],
  );

  const errors = useMemo(
    () => buildFormErrorList(draft, data.accounts, data.recipients, moneyMessages),
    [draft, data.accounts, data.recipients, moneyMessages],
  );

  const handleReview = () => {
    if (flow.quoteStatus === 'loading') {
      return;
    }
    if (errors.length > 0) {
      dispatch(attemptFailed());
      return;
    }
    void dispatch(fetchQuote());
  };

  const isDisabled =
    data.accountsStatus === 'loading' ||
    data.recipientsStatus === 'loading' ||
    data.accountsStatus === 'failed' ||
    data.recipientsStatus === 'failed';

  const isQuoteLoading = flow.quoteStatus === 'loading';
  const showRecipientError = draft.showErrors && !draft.recipientId;

  return (
    <main>
      <StepHeading title={COPY['form.heading']} />

      {renderBanner(
        flow.banner,
        () => void dispatch(loadAccounts()),
        () => void dispatch(loadRecipients()),
        () => void dispatch(fetchQuote()),
      )}

      {(data.accountsStatus === 'loading' || data.recipientsStatus === 'loading') && (
        <div role="status">{COPY['load.loading']}</div>
      )}

      {draft.showErrors && errors.length > 0 && (
        <ErrorSummary
          id="error-summary"
          title={formatSummaryTitle(errors.length)}
          errors={errors}
          focusKey={draft.errorFocusKey}
        />
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleReview();
        }}
      >
        <fieldset disabled={isDisabled}>
          <div className="smu-field">
            <label htmlFor="recipient">{COPY['form.recipient.label']}</label>
            <select
              id="recipient"
              value={draft.recipientId ?? ''}
              onChange={(e) => dispatch(setRecipient(e.target.value ? e.target.value : null))}
              aria-invalid={showRecipientError ? 'true' : undefined}
              aria-describedby={showRecipientError ? 'recipient-error' : undefined}
            >
              <option value="">{COPY['form.recipient.placeholder']}</option>
              {data.recipients?.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} · {r.currency}
                </option>
              ))}
            </select>
            {showRecipientError && (
              <p id="recipient-error" className="smu-error-message">
                {COPY['form.recipient.required']}
              </p>
            )}
          </div>

          <div className="smu-field">
            <label htmlFor="account">{COPY['form.account.label']}</label>
            <select
              id="account"
              value={draft.sourceCurrency}
              onChange={(e) => dispatch(setSourceCurrency(e.target.value as SourceCurrency))}
            >
              {data.accounts?.map((a) => (
                <option key={a.currency} value={a.currency}>
                  {a.currency} ·{' '}
                  {formatMoney(
                    { currency: a.currency, minor: a.balanceMinor },
                    { locale: draft.locale },
                  )}
                </option>
              ))}
            </select>
          </div>

          <div className="smu-field">
            <label htmlFor="locale">{COPY['form.locale.label']}</label>
            <select
              id="locale"
              value={draft.locale}
              onChange={(e) => dispatch(setLocale(e.target.value as LocaleCode))}
            >
              <option value="en-US">en-US · 1,234.56</option>
              <option value="de-DE">de-DE · 1.234,56</option>
              <option value="pl-PL">pl-PL · 1{'\u00A0'}234,56</option>
              <option value="en-IN">en-IN · 12,34,567.89</option>
            </select>
          </div>

          <MoneyInput
            id="amount"
            label={COPY['form.amount.label']}
            currency={draft.sourceCurrency}
            locale={draft.locale}
            value={draft.amountText}
            onChange={(next) => dispatch(setAmountText(next.text))}
            minMinor={FIXTURES.MIN_SEND_MINOR}
            maxMinor={FIXTURES.MAX_SEND_MINOR}
            messages={moneyMessages}
            hint={interpolate(COPY['form.amount.hint'], {
              min: formatMoney(
                { currency: draft.sourceCurrency, minor: FIXTURES.MIN_SEND_MINOR },
                { locale: draft.locale },
              ),
              max: formatMoney(
                { currency: draft.sourceCurrency, minor: FIXTURES.MAX_SEND_MINOR },
                { locale: draft.locale },
              ),
            })}
            previewLabel={(formatted) =>
              interpolate(COPY['form.amount.preview'], { amount: formatted })
            }
            showErrors={draft.showErrors}
            {...(insufficientFundsError ? { externalError: insufficientFundsError } : {})}
          />

          <button
            type="submit"
            aria-disabled={isQuoteLoading ? 'true' : undefined}
            onClick={(e) => {
              if (isQuoteLoading) {
                e.preventDefault();
              }
            }}
          >
            {isQuoteLoading ? COPY['form.review.loading'] : COPY['form.review.button']}
          </button>
        </fieldset>
      </form>
    </main>
  );
}
