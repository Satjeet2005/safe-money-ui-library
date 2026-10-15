import { useEffect, type JSX } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { formatMoney, parseAmount } from '@satjeetsingh1/safe-money-ui/money';
import { useReviewGuard } from '@satjeetsingh1/safe-money-ui/react';
import type { Clock } from '@satjeetsingh1/safe-money-ui/submit';
import { Banner } from '../components/Banner.js';
import { StepHeading } from '../components/StepHeading.js';
import { COPY, createMoneyInputMessages } from '../copy.js';
import {
  goToForm,
  fetchQuote,
  setBanner,
  type ReviewSnapshot,
  type QuotePayload,
} from '../store/flowSlice.js';
import { attemptFailed, type DraftState } from '../store/draftSlice.js';
import type { RootState, AppDispatch } from '../store/store.js';
import type { DataState, Recipient } from '../store/dataSlice.js';
import { formatRate } from '../service/format.js';
import { FIXTURES } from '../service/fixtures.js';
import { buildFormErrorList } from './sendFormValidation.js';

const fallbackClock: Clock = {
  now: () => Date.now(),
};

export type ReviewProps = {
  onSubmit?: (input: {
    quoteId: string;
    recipientId: string;
    sourceCurrency: string;
    sourceMinor: number;
  }) => void;
  submitting?: boolean;
  clock?: Clock;
};

async function handleGuardMismatch(
  dispatch: AppDispatch,
  draft: DraftState,
  data: DataState,
): Promise<void> {
  const moneyMessages = createMoneyInputMessages(draft.locale);
  const errors = buildFormErrorList(draft, data.accounts, data.recipients, moneyMessages);

  if (errors.length > 0) {
    dispatch(goToForm());
    dispatch(attemptFailed());
    dispatch(setBanner({ kind: 'warning', copyKey: 'review.changed' }));
    return;
  }

  const res = await dispatch(fetchQuote());
  if (fetchQuote.fulfilled.match(res)) {
    dispatch(setBanner({ kind: 'warning', copyKey: 'review.changed' }));
  }
}

async function handleQuoteExpiry(
  dispatch: AppDispatch,
  quote: QuotePayload,
  snapshot: ReviewSnapshot,
): Promise<void> {
  const res = await dispatch(fetchQuote());
  if (fetchQuote.fulfilled.match(res)) {
    const newQuote = res.payload.quote;
    const rateChanged =
      newQuote.target.minor !== snapshot.targetMinor || newQuote.feeMinor !== snapshot.feeMinor;
    const copyKey = rateChanged ? 'review.rateChanged' : 'review.rateRefreshed';
    dispatch(setBanner({ kind: rateChanged ? 'warning' : 'info', copyKey }));
  }
}

function ReviewDetails({
  quote,
  recipient,
  locale,
}: {
  quote: QuotePayload;
  recipient: Recipient | undefined;
  locale: RootState['draft']['locale'];
}): JSX.Element {
  const totalMinor = quote.source.minor + quote.feeMinor;
  const rateText = `1 ${quote.source.currency} = ${formatRate(quote.rateMicro)} ${quote.target.currency}`;

  return (
    <>
      <dl className="review-summary nw-receipt-list">
        <dt>{COPY['review.to']}</dt>
        <dd>
          {recipient ? `${recipient.name} · ${recipient.country} · ${recipient.accountHint}` : ''}
        </dd>

        <dt>{COPY['review.send']}</dt>
        <dd className="nw-tabular">
          {formatMoney({ currency: quote.source.currency, minor: quote.source.minor }, { locale })}
        </dd>

        <dt>{COPY['review.fee']}</dt>
        <dd className="nw-tabular">
          {formatMoney({ currency: quote.source.currency, minor: quote.feeMinor }, { locale })}
        </dd>

        <dt>{COPY['review.total']}</dt>
        <dd className="nw-tabular">
          {formatMoney({ currency: quote.source.currency, minor: totalMinor }, { locale })}
        </dd>

        <dt>{COPY['review.rate']}</dt>
        <dd className="nw-tabular nw-font-mono">{rateText}</dd>

        <dt>{COPY['review.receive']}</dt>
        <dd className="nw-tabular">
          {formatMoney({ currency: quote.target.currency, minor: quote.target.minor }, { locale })}
        </dd>
      </dl>
      <p className="rate-held nw-amount-hint">{COPY['review.rateHeld']}</p>
    </>
  );
}

function useConfirmAction({
  dispatch,
  draft,
  data,
  quote,
  snapshot,
  guard,
  clock,
  submitting,
  onSubmit,
}: {
  dispatch: AppDispatch;
  draft: DraftState;
  data: DataState;
  quote: QuotePayload | null;
  snapshot: ReviewSnapshot | null;
  guard: ReturnType<typeof useReviewGuard<ReviewSnapshot>>;
  clock: Clock;
  submitting: boolean;
  onSubmit?: ReviewProps['onSubmit'];
}): () => Promise<void> {
  return async () => {
    if (submitting || !quote || !snapshot) {
      return;
    }

    const parsed = parseAmount(draft.amountText, {
      currency: draft.sourceCurrency,
      locale: draft.locale,
      minMinor: FIXTURES.MIN_SEND_MINOR,
      maxMinor: FIXTURES.MAX_SEND_MINOR,
    });

    const live: ReviewSnapshot = {
      recipientId: draft.recipientId ?? '',
      quoteId: quote.quoteId,
      sourceCurrency: draft.sourceCurrency,
      sourceMinor: parsed.ok ? parsed.money.minor : -1,
      feeMinor: quote.feeMinor,
      targetCurrency: quote.target.currency,
      targetMinor: quote.target.minor,
    };

    if (!guard.check(live).ok) {
      await handleGuardMismatch(dispatch, draft, data);
      return;
    }

    if (clock.now() >= quote.expiresAtMs) {
      await handleQuoteExpiry(dispatch, quote, snapshot);
      return;
    }

    if (draft.recipientId) {
      onSubmit?.({
        quoteId: quote.quoteId,
        recipientId: draft.recipientId,
        sourceCurrency: quote.source.currency,
        sourceMinor: quote.source.minor,
      });
    }
  };
}

/**
 * Review screen displaying transfer breakdown and running exact confirm algorithm.
 * @example
 * ```tsx
 * <Review onSubmit={handleConfirm} submitting={false} clock={clock} />
 * ```
 */
export function Review({
  onSubmit,
  submitting = false,
  clock = fallbackClock,
}: ReviewProps): JSX.Element {
  const dispatch = useDispatch<AppDispatch>();
  const draft = useSelector((state: RootState) => state.draft);
  const data = useSelector((state: RootState) => state.data);
  const flow = useSelector((state: RootState) => state.flow);

  const guard = useReviewGuard<ReviewSnapshot>();

  useEffect(() => {
    if (flow.snapshot) {
      guard.capture(flow.snapshot);
    }
  }, [flow.snapshot, guard]);

  const quote = flow.quote;
  const snapshot = flow.snapshot;
  const recipient = data.recipients?.find((r) => r.id === draft.recipientId);

  const handleConfirm = useConfirmAction({
    dispatch,
    draft,
    data,
    quote,
    snapshot,
    guard,
    clock,
    submitting,
    onSubmit,
  });

  return (
    <main className="nw-review-container">
      <StepHeading title={COPY['review.heading']} />

      {flow.banner && (
        <Banner kind={flow.banner.kind}>
          <span>{COPY[flow.banner.copyKey]}</span>
        </Banner>
      )}

      {submitting && (
        <div role="status" className="nw-status-submitting">
          {COPY['submit.sending']}
        </div>
      )}

      {quote && <ReviewDetails quote={quote} recipient={recipient} locale={draft.locale} />}

      <div className="review-actions nw-review-actions">
        <button
          type="button"
          id="confirm-button"
          className="nw-btn nw-btn-primary"
          aria-disabled={submitting ? 'true' : undefined}
          onClick={(e) => {
            if (submitting) {
              e.preventDefault();
              return;
            }
            void handleConfirm();
          }}
        >
          {submitting ? (
            <>
              <span className="nw-spinner" aria-hidden="true" />
              <span>{COPY['review.sending']}</span>
            </>
          ) : (
            COPY['review.confirm']
          )}
        </button>

        <button
          type="button"
          className="nw-btn nw-btn-secondary"
          aria-disabled={submitting ? 'true' : undefined}
          onClick={(e) => {
            if (submitting) {
              e.preventDefault();
              return;
            }
            dispatch(goToForm());
          }}
        >
          {COPY['review.edit']}
        </button>
      </div>
    </main>
  );
}
