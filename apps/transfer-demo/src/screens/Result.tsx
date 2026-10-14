import { useEffect, useRef, type JSX } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { formatMoney, type CurrencyCode } from '@satjeet2005/safe-money-ui/money';
import type { SubmitState } from '@satjeet2005/safe-money-ui/submit';
import { StepHeading } from '../components/StepHeading.js';
import { COPY, type CopyKey } from '../copy.js';
import { addEntry } from '../store/historySlice.js';
import { resetDraft } from '../store/draftSlice.js';
import { goToForm, clearBanner, setBanner } from '../store/flowSlice.js';
import { loadAccounts } from '../store/dataSlice.js';
import { clearDraft } from '../persistence/draftStorage.js';
import type { RootState, AppDispatch } from '../store/store.js';
import type { TransferInput, TransferResponsePayload } from './TransferFlow.js';

export type ResultProps = {
  state?: SubmitState<TransferInput, TransferResponsePayload> | undefined;
  onRetry?: (() => void) | undefined;
  onReset?: (() => void) | undefined;
};

function useSuccessSideEffect(
  state: SubmitState<TransferInput, TransferResponsePayload> | undefined,
  dispatch: AppDispatch,
  recipients: RootState['data']['recipients'],
  locale: RootState['draft']['locale'],
  snapshot: RootState['flow']['snapshot'],
): void {
  const handledIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (state?.status === 'succeeded') {
      const transferId = state.result.transferId;
      if (handledIdRef.current !== transferId) {
        handledIdRef.current = transferId;

        const recipientId = snapshot?.recipientId;
        const recipient = recipients?.find((r) => r.id === recipientId);
        const recipientName = recipient?.name ?? 'Unknown';

        const amountText = snapshot
          ? formatMoney(
              { currency: snapshot.sourceCurrency as CurrencyCode, minor: snapshot.sourceMinor },
              { locale },
            )
          : formatMoney(state.result.debited, { locale });

        dispatch(
          addEntry({
            id: transferId,
            kind: 'completed',
            recipientName,
            amountText,
          }),
        );
        dispatch(resetDraft());
        clearDraft();
        void dispatch(loadAccounts());
      }
    }
  }, [state, recipients, locale, snapshot, dispatch]);
}

function ResultSuccessView({
  result,
  locale,
  onReset,
  dispatch,
}: {
  result: TransferResponsePayload;
  locale: RootState['draft']['locale'];
  onReset?: (() => void) | undefined;
  dispatch: AppDispatch;
}): JSX.Element {
  const handleSendAnother = () => {
    onReset?.();
    dispatch(resetDraft());
    clearDraft();
    dispatch(goToForm());
    dispatch(clearBanner());
  };

  return (
    <div className="nw-result-card nw-result-success result-screen result-success">
      <div className="nw-result-header">
        <div className="nw-result-icon result-icon" aria-hidden="true">
          &#10003;
        </div>
        <div>
          <span className="nw-status-tag nw-tag-success">Confirmed</span>
        </div>
      </div>
      <dl className="result-details nw-receipt-list">
        <div className="nw-receipt-row">
          <dt>{COPY['result.success.id']}</dt>
          <dd>
            <code className="nw-ref-badge">{result.transferId}</code>
          </dd>
        </div>
        <div className="nw-receipt-row">
          <dt>{COPY['result.success.sent']}</dt>
          <dd className="nw-tabular">{formatMoney(result.debited, { locale })}</dd>
        </div>
        <div className="nw-receipt-row">
          <dt>{COPY['result.success.received']}</dt>
          <dd className="nw-tabular">{formatMoney(result.credited, { locale })}</dd>
        </div>
      </dl>
      <button
        type="button"
        className="nw-btn nw-btn-primary nw-btn-block"
        onClick={handleSendAnother}
      >
        {COPY['result.success.another']}
      </button>
    </div>
  );
}

function ResultRejectedView({
  code,
  retryable,
  fallbackMessage,
  onRetry,
  onReset,
  dispatch,
}: {
  code: string | undefined;
  retryable: boolean;
  fallbackMessage: string;
  onRetry?: (() => void) | undefined;
  onReset?: (() => void) | undefined;
  dispatch: AppDispatch;
}): JSX.Element {
  const handleEdit = () => {
    onReset?.();
    dispatch(goToForm());
  };

  const copyKey = code ? (`result.rejected.${code}` as CopyKey) : null;
  const message = (copyKey && copyKey in COPY ? COPY[copyKey] : null) ?? fallbackMessage;

  return (
    <div className="nw-result-card nw-result-rejected result-screen result-rejected">
      <div className="nw-result-header">
        <div className="nw-result-icon result-icon" aria-hidden="true">
          &#8856;
        </div>
        <div>
          <span className="nw-status-tag nw-tag-error">
            {retryable ? 'Rejected — Temporary issue' : 'Rejected — Action required'}
          </span>
        </div>
      </div>
      <p className="nw-result-reason">{message}</p>
      <p className="nw-result-subtext">No funds were deducted from your account.</p>
      <div className="result-actions nw-review-actions">
        {retryable && (
          <button type="button" className="nw-btn nw-btn-primary" onClick={onRetry}>
            {COPY['result.retry']}
          </button>
        )}
        <button type="button" className="nw-btn nw-btn-secondary" onClick={handleEdit}>
          {COPY['result.edit']}
        </button>
      </div>
    </div>
  );
}

function ResultUnconfirmedView({
  state,
  onRetry,
  onReset,
  dispatch,
  draft,
  recipients,
  snapshot,
}: {
  state: Extract<SubmitState<TransferInput, TransferResponsePayload>, { status: 'failed' }>;
  onRetry?: (() => void) | undefined;
  onReset?: (() => void) | undefined;
  dispatch: AppDispatch;
  draft: RootState['draft'];
  recipients: RootState['data']['recipients'];
  snapshot: RootState['flow']['snapshot'];
}): JSX.Element {
  const handleLeave = () => {
    const recipientId = state.input?.recipientId ?? snapshot?.recipientId ?? draft.recipientId;
    const recipient = recipients?.find((r) => r.id === recipientId);
    const recipientName = recipient?.name ?? 'Unknown';

    const amountText = snapshot
      ? formatMoney(
          { currency: snapshot.sourceCurrency as CurrencyCode, minor: snapshot.sourceMinor },
          { locale: draft.locale },
        )
      : draft.amountText || '$0.00';

    dispatch(
      addEntry({
        id: state.idempotencyKey,
        kind: 'unconfirmed',
        recipientName,
        amountText,
      }),
    );
    onReset?.();
    dispatch(goToForm());
    dispatch(setBanner({ kind: 'warning', copyKey: 'unconfirmed.banner' }));
  };

  return (
    <div className="nw-result-card nw-result-unconfirmed result-screen result-unconfirmed">
      <div className="nw-result-header">
        <div className="nw-result-icon result-icon" aria-hidden="true">
          &#9670;
        </div>
        <div>
          <span className="nw-status-tag nw-tag-uncertain">Outcome unconfirmed</span>
        </div>
      </div>
      <div className="nw-uncertain-explanation">
        <p>{COPY['result.unconfirmed.body']}</p>
        <p>{state.error.message}</p>
      </div>
      <div className="result-actions nw-review-actions">
        <button type="button" className="nw-btn nw-btn-primary" onClick={onRetry}>
          {COPY['result.retry']}
        </button>
        <button type="button" className="nw-btn nw-btn-secondary" onClick={handleLeave}>
          {COPY['result.leave']}
        </button>
      </div>
    </div>
  );
}

/**
 * Result screen displaying transfer outcome, error recovery actions, and history side effects.
 * @example
 * ```tsx
 * <Result state={controllerState} onRetry={retry} onReset={reset} />
 * ```
 */
export function Result({ state, onRetry, onReset }: ResultProps = {}): JSX.Element {
  const dispatch = useDispatch<AppDispatch>();
  const draft = useSelector((s: RootState) => s.draft);
  const data = useSelector((s: RootState) => s.data);
  const flow = useSelector((s: RootState) => s.flow);

  useSuccessSideEffect(state, dispatch, data.recipients, draft.locale, flow.snapshot);

  if (state?.status === 'succeeded') {
    return (
      <main className="nw-result-viewport">
        <StepHeading key="succeeded" title={COPY['result.success.heading']} />
        <ResultSuccessView
          result={state.result}
          locale={draft.locale}
          onReset={onReset}
          dispatch={dispatch}
        />
      </main>
    );
  }

  if (state?.status === 'submitting') {
    return (
      <main className="nw-result-viewport">
        <StepHeading key="submitting" title={COPY['review.heading']} />
        <div role="status" className="nw-status-submitting">
          {COPY['submit.sending']}
        </div>
      </main>
    );
  }

  if (state?.status === 'failed') {
    if (state.error.kind === 'rejected') {
      return (
        <main className="nw-result-viewport">
          <StepHeading
            key={`rejected-${state.error.code ?? 'unknown'}`}
            title={COPY['result.rejected.heading']}
          />
          <ResultRejectedView
            code={state.error.code}
            retryable={state.error.retryable}
            fallbackMessage={state.error.message}
            onRetry={onRetry}
            onReset={onReset}
            dispatch={dispatch}
          />
        </main>
      );
    }

    return (
      <main className="nw-result-viewport">
        <StepHeading
          key={`unconfirmed-${state.error.kind}`}
          title={COPY['result.unconfirmed.heading']}
        />
        <ResultUnconfirmedView
          state={state}
          onRetry={onRetry}
          onReset={onReset}
          dispatch={dispatch}
          draft={draft}
          recipients={data.recipients}
          snapshot={flow.snapshot}
        />
      </main>
    );
  }

  return (
    <main className="nw-result-viewport">
      <StepHeading key="default" title={COPY['result.success.heading']} />
    </main>
  );
}
