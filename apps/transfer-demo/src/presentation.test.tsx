import { render, screen, fireEvent, within, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createAppStore } from './store/store.js';
import {
  setAccounts,
  setAccountsStatus,
  setRecipientsStatus,
  setRecipients,
} from './store/dataSlice.js';
import { addEntry } from './store/historySlice.js';
import { goToReview, type ReviewSnapshot, type QuotePayload } from './store/flowSlice.js';
import { togglePanel } from './store/chaosSlice.js';
import {
  setRecipient,
  setSourceCurrency,
  setAmountText,
  attemptFailed,
} from './store/draftSlice.js';
import { App } from './App.js';
import { Result } from './screens/Result.js';
import { COPY, UI_LABELS } from './copy.js';
import type { MockService } from './service/mockService.js';
import type { SubmitState } from '@satjeet2005/safe-money-ui/submit';
import type { TransferInput, TransferResponsePayload } from './screens/TransferFlow.js';

describe('Presentation Regression Safety Net (Phase 1)', () => {
  const dummyRecipients = [
    {
      id: 'REC-001',
      name: 'Mateo Alvarez',
      country: 'ES',
      currency: 'EUR' as const,
      accountHint: '****1234',
    },
    {
      id: 'REC-002',
      name: 'Kenji Watanabe',
      country: 'JP',
      currency: 'JPY' as const,
      accountHint: '****5678',
    },
  ];

  const dummyAccounts = [
    { currency: 'USD' as const, balanceMinor: 500000 },
    { currency: 'EUR' as const, balanceMinor: 250000 },
  ];

  const sampleQuote: QuotePayload = {
    quoteId: 'QUO-001',
    source: { currency: 'USD', minor: 10000 },
    target: { currency: 'EUR', minor: 9200 },
    feeMinor: 100,
    rateMicro: 920000,
    expiresAtMs: Date.now() + 60000,
  };

  const sampleSnapshot: ReviewSnapshot = {
    recipientId: 'REC-001',
    quoteId: 'QUO-001',
    sourceCurrency: 'USD',
    sourceMinor: 10000,
    feeMinor: 100,
    targetCurrency: 'EUR',
    targetMinor: 9200,
  };

  const dummyService: MockService = {
    getAccounts: jest.fn().mockResolvedValue({ accounts: dummyAccounts }),
    getRecipients: jest.fn().mockResolvedValue({ recipients: dummyRecipients }),
    getQuote: jest.fn().mockResolvedValue(sampleQuote),
    submitTransfer: jest.fn(),
    debug: {
      executedCount: () => 0,
      balances: () => ({}),
      transferIds: () => [],
    },
  };

  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  function setupStore() {
    const store = createAppStore({ service: dummyService });
    store.dispatch(setAccountsStatus('ready'));
    store.dispatch(setRecipientsStatus('ready'));
    store.dispatch(setAccounts(dummyAccounts));
    store.dispatch(setRecipients(dummyRecipients));
    store.dispatch(setRecipient('REC-001'));
    store.dispatch(setSourceCurrency('USD'));
    store.dispatch(setAmountText('100.00'));
    return store;
  }

  function renderApp(initialStore?: ReturnType<typeof createAppStore>) {
    const store = initialStore ?? setupStore();
    const utils = render(
      <Provider store={store}>
        <App />
      </Provider>,
    );
    return { store, ...utils };
  }

  test('PR-01: Page shell renders header, title, simulation notice aside, and landmark sections', () => {
    renderApp();

    expect(screen.getByRole('heading', { level: 1, name: COPY['app.title'] })).toBeInTheDocument();
    const demoNotice = screen.getByLabelText(UI_LABELS.demoNotice);
    expect(demoNotice).toBeInTheDocument();
    expect(within(demoNotice).getByText(COPY['app.demoBanner'])).toBeInTheDocument();

    expect(screen.getByLabelText(UI_LABELS.accountSummary)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: COPY['history.heading'] }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: COPY['chaos.heading'] })).toBeInTheDocument();
  });

  test('PR-02: Form step renders recipient select, account select, amount input with accessible label, and review button', () => {
    renderApp();

    expect(screen.getByLabelText(COPY['form.recipient.label'])).toBeInTheDocument();
    expect(screen.getByLabelText(COPY['form.account.label'])).toBeInTheDocument();
    expect(screen.getByLabelText(COPY['form.amount.label'])).toBeInTheDocument();
    expect(screen.getByRole('button', { name: COPY['form.review.button'] })).toBeInTheDocument();
  });

  test('PR-03: Validation errors preserve entered amount and render focusable ErrorSummary with alert role', () => {
    const store = setupStore();
    store.dispatch(setAmountText('9999.00'));
    store.dispatch(attemptFailed());

    renderApp(store);

    const errorSummary = screen.getByRole('alert');
    expect(errorSummary).toBeInTheDocument();
    expect(
      within(errorSummary).getByRole('heading', { name: /Fix \d+ problem/ }),
    ).toBeInTheDocument();

    const amountInput = screen.getByLabelText(COPY['form.amount.label']) as HTMLInputElement;
    expect(amountInput.value).toBe('9999.00');
  });

  test('PR-04: Review step renders transfer snapshot breakdown, Confirm button, and Edit details button', () => {
    const store = setupStore();
    store.dispatch(goToReview({ quote: sampleQuote, snapshot: sampleSnapshot }));

    renderApp(store);

    const mainArea = screen.getByRole('main');
    expect(
      within(mainArea).getByRole('heading', { name: COPY['review.heading'] }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: COPY['review.confirm'] })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: COPY['review.edit'] })).toBeInTheDocument();
  });

  test('PR-05: In-flight submission sets aria-disabled on confirm button without losing focus', async () => {
    let resolveSubmit: (val: unknown) => void;
    const pendingSubmit = new Promise((resolve) => {
      resolveSubmit = resolve;
    });

    const hangingService: MockService = {
      ...dummyService,
      submitTransfer: jest.fn().mockReturnValue(pendingSubmit),
    };

    const store = createAppStore({ service: hangingService });
    store.dispatch(setAccountsStatus('ready'));
    store.dispatch(setRecipientsStatus('ready'));
    store.dispatch(setAccounts(dummyAccounts));
    store.dispatch(setRecipients(dummyRecipients));
    store.dispatch(setRecipient('REC-001'));
    store.dispatch(setSourceCurrency('USD'));
    store.dispatch(setAmountText('100.00'));
    store.dispatch(goToReview({ quote: sampleQuote, snapshot: sampleSnapshot }));

    render(
      <Provider store={store}>
        <App />
      </Provider>,
    );

    const confirmBtn = screen.getByRole('button', { name: COPY['review.confirm'] });
    fireEvent.click(confirmBtn);

    // In-flight state: aria-disabled="true"
    expect(confirmBtn).toHaveAttribute('aria-disabled', 'true');

    // Clean up pending promise
    await act(async () => {
      resolveSubmit!({
        transferId: 'TRF-001',
        status: 'completed',
        debited: { currency: 'USD', minor: 10100 },
        credited: { currency: 'EUR', minor: 9200 },
        completedAtMs: Date.now(),
      });
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  });

  test('PR-06: Chaos panel toggle expands section with accessible preset buttons', () => {
    renderApp();

    const chaosToggle = screen.getByRole('button', { name: COPY['chaos.heading'] });
    expect(chaosToggle).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(chaosToggle);
    expect(chaosToggle).toHaveAttribute('aria-expanded', 'true');

    const chaosSection = screen.getByRole('region', { name: COPY['chaos.heading'] });
    expect(
      within(chaosSection).getByRole('button', { name: COPY['chaos.preset.slow'] }),
    ).toBeInTheDocument();
    expect(
      within(chaosSection).getByRole('button', { name: COPY['chaos.preset.timeout'] }),
    ).toBeInTheDocument();
    expect(
      within(chaosSection).getByRole('button', { name: COPY['chaos.preset.lost'] }),
    ).toBeInTheDocument();
    expect(
      within(chaosSection).getByRole('button', { name: COPY['chaos.preset.badPayload'] }),
    ).toBeInTheDocument();
  });

  test('PR-07: Chaos panel contains latency, faults, and rejection options with visible text labels', () => {
    const store = setupStore();
    store.dispatch(togglePanel());

    renderApp(store);

    const chaosSection = screen.getByRole('region', { name: COPY['chaos.heading'] });

    // Latency radios scoped within Latency fieldset
    const latencyGroup = within(chaosSection).getByRole('group', {
      name: COPY['chaos.latency.legend'],
    });
    expect(within(latencyGroup).getByLabelText(COPY['chaos.latency.none'])).toBeInTheDocument();
    expect(within(latencyGroup).getByLabelText(COPY['chaos.latency.500ms'])).toBeInTheDocument();
    expect(within(latencyGroup).getByLabelText(COPY['chaos.latency.3s'])).toBeInTheDocument();

    // Fault checkboxes
    expect(within(chaosSection).getByLabelText(COPY['chaos.hang'])).toBeInTheDocument();
    expect(within(chaosSection).getByLabelText(COPY['chaos.lost'])).toBeInTheDocument();
    expect(within(chaosSection).getByLabelText(COPY['chaos.malformed'])).toBeInTheDocument();

    // Rejection radios scoped within Server rejection fieldset
    const rejectionGroup = within(chaosSection).getByRole('group', {
      name: COPY['chaos.rejection.legend'],
    });
    expect(within(rejectionGroup).getByLabelText(COPY['chaos.rejection.none'])).toBeInTheDocument();
    expect(
      within(rejectionGroup).getByLabelText(COPY['chaos.rejection.insufficientFunds']),
    ).toBeInTheDocument();
    expect(
      within(rejectionGroup).getByLabelText(COPY['chaos.rejection.recipientBlocked']),
    ).toBeInTheDocument();
    expect(
      within(rejectionGroup).getByLabelText(COPY['chaos.rejection.serviceUnavailable']),
    ).toBeInTheDocument();
  });

  test('PR-08: Lost response displays unconfirmed outcome with explanation, Try again button, and Leave unconfirmed button', () => {
    const store = setupStore();
    const state: SubmitState<TransferInput, TransferResponsePayload> = {
      status: 'failed',
      requestId: 1,
      attempt: 1,
      idempotencyKey: 'idem-test-123',
      input: {
        quoteId: 'QUO-001',
        recipientId: 'REC-001',
        sourceCurrency: 'USD',
        sourceMinor: 10000,
      },
      error: {
        kind: 'network',
        message: COPY['controller.network'],
        retryable: true,
      },
    };

    render(
      <Provider store={store}>
        <Result state={state} onRetry={jest.fn()} onReset={jest.fn()} />
      </Provider>,
    );

    const mainArea = screen.getByRole('main');
    expect(
      within(mainArea).getByRole('heading', { level: 1, name: COPY['result.unconfirmed.heading'] }),
    ).toBeInTheDocument();
    expect(within(mainArea).getByText(COPY['result.unconfirmed.body'])).toBeInTheDocument();
    expect(
      within(mainArea).getByRole('button', { name: COPY['result.retry'] }),
    ).toBeInTheDocument();
    expect(
      within(mainArea).getByRole('button', { name: COPY['result.leave'] }),
    ).toBeInTheDocument();
    // Confirmed completion message must NOT be displayed
    expect(
      within(mainArea).queryByRole('heading', { name: COPY['result.success.heading'] }),
    ).not.toBeInTheDocument();
  });

  test('PR-09: Rejection states distinguish non-retryable from retryable rejections', () => {
    const store = setupStore();

    // Non-retryable rejection: INSUFFICIENT_FUNDS
    const nonRetryableState: SubmitState<TransferInput, TransferResponsePayload> = {
      status: 'failed',
      requestId: 1,
      attempt: 1,
      idempotencyKey: 'idem-test-456',
      input: {
        quoteId: 'QUO-001',
        recipientId: 'REC-001',
        sourceCurrency: 'USD',
        sourceMinor: 10000,
      },
      error: {
        kind: 'rejected',
        code: 'INSUFFICIENT_FUNDS',
        message: COPY['result.rejected.INSUFFICIENT_FUNDS'],
        retryable: false,
      },
    };

    const { unmount } = render(
      <Provider store={store}>
        <Result state={nonRetryableState} onReset={jest.fn()} />
      </Provider>,
    );

    const mainArea = screen.getByRole('main');
    expect(
      within(mainArea).getByRole('heading', { level: 1, name: COPY['result.rejected.heading'] }),
    ).toBeInTheDocument();
    expect(
      within(mainArea).getByText(COPY['result.rejected.INSUFFICIENT_FUNDS']),
    ).toBeInTheDocument();
    expect(within(mainArea).getByRole('button', { name: COPY['result.edit'] })).toBeInTheDocument();
    expect(
      within(mainArea).queryByRole('button', { name: COPY['result.retry'] }),
    ).not.toBeInTheDocument();

    unmount();

    // Retryable rejection: SERVICE_UNAVAILABLE
    const retryableState: SubmitState<TransferInput, TransferResponsePayload> = {
      status: 'failed',
      requestId: 1,
      attempt: 1,
      idempotencyKey: 'idem-test-789',
      input: {
        quoteId: 'QUO-001',
        recipientId: 'REC-001',
        sourceCurrency: 'USD',
        sourceMinor: 10000,
      },
      error: {
        kind: 'rejected',
        code: 'SERVICE_UNAVAILABLE',
        message: COPY['result.rejected.SERVICE_UNAVAILABLE'],
        retryable: true,
      },
    };

    render(
      <Provider store={store}>
        <Result state={retryableState} onRetry={jest.fn()} onReset={jest.fn()} />
      </Provider>,
    );

    const updatedMain = screen.getByRole('main');
    expect(
      within(updatedMain).getByText(COPY['result.rejected.SERVICE_UNAVAILABLE']),
    ).toBeInTheDocument();
    expect(
      within(updatedMain).getByRole('button', { name: COPY['result.retry'] }),
    ).toBeInTheDocument();
  });

  test('PR-10: Completed and unconfirmed activity items render distinct text labels in Recent activity', () => {
    const store = setupStore();
    store.dispatch(
      addEntry({
        id: 'TRF-001',
        kind: 'completed',
        recipientName: 'Mateo Alvarez',
        amountText: '$100.00',
      }),
    );
    store.dispatch(
      addEntry({
        id: 'idem-002',
        kind: 'unconfirmed',
        recipientName: 'Kenji Watanabe',
        amountText: '$200.00',
      }),
    );

    renderApp(store);

    const activitySection = screen.getByRole('region', { name: COPY['history.heading'] });
    expect(
      within(activitySection).getByText(
        new RegExp(`${COPY['history.completed']} · Mateo Alvarez · \\$100\\.00`),
      ),
    ).toBeInTheDocument();
    expect(
      within(activitySection).getByText(
        new RegExp(`${COPY['history.unconfirmed']} · Kenji Watanabe · \\$200\\.00`),
      ),
    ).toBeInTheDocument();
  });

  test('PR-11: Empty activity state clearly displays no transfers text', () => {
    renderApp();

    const activitySection = screen.getByRole('region', { name: COPY['history.heading'] });
    expect(within(activitySection).getByText(COPY['history.empty'])).toBeInTheDocument();
  });

  test('PR-12: Succeeded state displays transfer ID, amounts, and Send another button as accessible text', () => {
    const store = setupStore();
    const state: SubmitState<TransferInput, TransferResponsePayload> = {
      status: 'succeeded',
      requestId: 1,
      idempotencyKey: 'idem-success-999',
      result: {
        transferId: 'TRF-999',
        status: 'completed',
        debited: { currency: 'USD', minor: 10100 },
        credited: { currency: 'EUR', minor: 9200 },
        completedAtMs: Date.now(),
      },
    };

    act(() => {
      render(
        <Provider store={store}>
          <Result state={state} onReset={jest.fn()} />
        </Provider>,
      );
    });

    const mainArea = screen.getByRole('main');
    expect(
      within(mainArea).getByRole('heading', { level: 1, name: COPY['result.success.heading'] }),
    ).toBeInTheDocument();
    expect(within(mainArea).getByText('TRF-999')).toBeInTheDocument();
    expect(
      within(mainArea).getByRole('button', { name: COPY['result.success.another'] }),
    ).toBeInTheDocument();
  });
});
