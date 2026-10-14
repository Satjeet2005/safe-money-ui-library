import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createAppStore } from '../store/store.js';
import { setAccounts, setRecipients } from '../store/dataSlice.js';
import { setRecipient, setSourceCurrency, setAmountText } from '../store/draftSlice.js';
import { goToReview, goToResult, type ReviewSnapshot } from '../store/flowSlice.js';
import { Result } from './Result.js';
import { SendForm } from './SendForm.js';
import { Review } from './Review.js';
import { COPY } from '../copy.js';
import { DRAFT_STORAGE_KEY, saveDraft } from '../persistence/draftStorage.js';
import type { MockService } from '../service/mockService.js';
import type { SubmitState } from '@satjeet2005/safe-money-ui/submit';
import type { TransferInput, TransferResponsePayload } from './TransferFlow.js';

describe('Result Screen and Recent Activity History (WP-21B)', () => {
  const sampleSnapshot: ReviewSnapshot = {
    recipientId: 'rcp-001',
    quoteId: 'q-000001',
    sourceCurrency: 'USD',
    sourceMinor: 10000,
    feeMinor: 200,
    targetCurrency: 'EUR',
    targetMinor: 9200,
  };

  const sampleSuccessResult: TransferResponsePayload = {
    transferId: 'TRF-000001',
    status: 'completed',
    debited: { currency: 'USD', minor: 10200 },
    credited: { currency: 'EUR', minor: 9200 },
    completedAtMs: 1700000000,
  };

  const sampleInput: TransferInput = {
    quoteId: 'q-000001',
    recipientId: 'rcp-001',
    sourceCurrency: 'USD',
    sourceMinor: 10000,
  };

  const testRecipients = [
    {
      id: 'rcp-001',
      name: 'Elena Rostova',
      country: 'DE',
      currency: 'EUR' as const,
      accountHint: '****1234',
    },
  ];

  const testAccounts = [{ currency: 'USD' as const, balanceMinor: 500000 }];

  let dummyService: MockService;

  beforeEach(() => {
    sessionStorage.clear();
    dummyService = {
      getAccounts: jest.fn().mockResolvedValue({ accounts: testAccounts }),
      getRecipients: jest.fn().mockResolvedValue({ recipients: testRecipients }),
      getQuote: jest.fn(),
      submitTransfer: jest.fn(),
      debug: { executedCount: () => 0, balances: () => ({}), transferIds: () => [] },
    };
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  function setupStore() {
    const store = createAppStore({ service: dummyService });
    store.dispatch(setAccounts(testAccounts));
    store.dispatch(setRecipients(testRecipients));
    store.dispatch(setRecipient('rcp-001'));
    store.dispatch(setSourceCurrency('USD'));
    store.dispatch(setAmountText('100.00'));
    store.dispatch(
      goToReview({
        quote: {
          quoteId: 'q-000001',
          source: { currency: 'USD', minor: 10000 },
          target: { currency: 'EUR', minor: 9200 },
          feeMinor: 200,
          rateMicro: 920000,
          expiresAtMs: 200000,
        },
        snapshot: sampleSnapshot,
      }),
    );
    store.dispatch(goToResult());
    return store;
  }

  describe('RES-01: Successful completion', () => {
    it('renders success heading, transfer ID, debited sent, credited received, and Send another action', () => {
      const store = setupStore();
      const state: SubmitState<TransferInput, TransferResponsePayload> = {
        status: 'succeeded',
        requestId: 1,
        idempotencyKey: 'TRF-000001',
        result: sampleSuccessResult,
      };

      act(() => {
        render(
          <Provider store={store}>
            <Result state={state} onReset={jest.fn()} />
          </Provider>,
        );
      });

      expect(
        screen.getByRole('heading', { level: 1, name: COPY['result.success.heading'] }),
      ).toBeInTheDocument();
      expect(screen.getByText(COPY['result.success.id'])).toBeInTheDocument();
      expect(screen.getByText('TRF-000001')).toBeInTheDocument();
      expect(screen.getByText(COPY['result.success.sent'])).toBeInTheDocument();
      expect(screen.getByText('$102.00')).toBeInTheDocument();
      expect(screen.getByText(COPY['result.success.received'])).toBeInTheDocument();
      expect(screen.getByText('€92.00')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: COPY['result.success.another'] }),
      ).toBeInTheDocument();
    });

    it('triggers exactly-once completed history entry, draft reset, storage cleared, and accounts reload', async () => {
      const store = setupStore();
      saveDraft({
        version: 1,
        recipientId: 'rcp-001',
        sourceCurrency: 'USD',
        amountText: '100.00',
      });

      const state: SubmitState<TransferInput, TransferResponsePayload> = {
        status: 'succeeded',
        requestId: 1,
        idempotencyKey: 'TRF-000001',
        result: sampleSuccessResult,
      };

      let rerenderFn: ((ui: React.ReactElement) => void) | null = null;
      act(() => {
        const { rerender } = render(
          <Provider store={store}>
            <Result state={state} onReset={jest.fn()} />
          </Provider>,
        );
        rerenderFn = rerender;
      });

      // Verify exactly one completed history entry was added
      expect(store.getState().history.entries).toHaveLength(1);
      expect(store.getState().history.entries[0]).toEqual({
        id: 'TRF-000001',
        kind: 'completed',
        recipientName: 'Elena Rostova',
        amountText: '$100.00',
      });

      // Verify draft storage was cleared
      expect(sessionStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull();

      // Verify accounts reload was triggered
      await act(async () => {
        await waitFor(() => expect(dummyService.getAccounts).toHaveBeenCalled());
      });

      // Rerender should not add another completed history entry
      act(() => {
        rerenderFn?.(
          <Provider store={store}>
            <Result state={state} onReset={jest.fn()} />
          </Provider>,
        );
      });
      expect(store.getState().history.entries).toHaveLength(1);
    });

    it('clicking Send another resets controller, resets draft, clears storage, clears banner, and navigates to form', async () => {
      const store = setupStore();
      const mockReset = jest.fn();
      const state: SubmitState<TransferInput, TransferResponsePayload> = {
        status: 'succeeded',
        requestId: 1,
        idempotencyKey: 'TRF-000001',
        result: sampleSuccessResult,
      };

      act(() => {
        render(
          <Provider store={store}>
            <Result state={state} onReset={mockReset} />
          </Provider>,
        );
      });

      await act(async () => {
        await waitFor(() => expect(dummyService.getAccounts).toHaveBeenCalled());
      });

      fireEvent.click(screen.getByRole('button', { name: COPY['result.success.another'] }));

      expect(mockReset).toHaveBeenCalledTimes(1);
      expect(store.getState().flow.step).toBe('form');
      expect(store.getState().flow.banner).toBeNull();
      expect(store.getState().draft.amountText).toBe('');
    });
  });

  describe('RES-02: Non-retryable business rejection', () => {
    it.each([
      ['INSUFFICIENT_FUNDS', COPY['result.rejected.INSUFFICIENT_FUNDS']],
      ['RECIPIENT_BLOCKED', COPY['result.rejected.RECIPIENT_BLOCKED']],
      ['QUOTE_EXPIRED', COPY['result.rejected.QUOTE_EXPIRED']],
      ['LIMIT_EXCEEDED', COPY['result.rejected.LIMIT_EXCEEDED']],
    ])(
      'renders rejected heading and specific copy for code %s with Edit action only',
      (code, expectedMsg) => {
        const store = setupStore();
        const mockReset = jest.fn();
        const state: SubmitState<TransferInput, TransferResponsePayload> = {
          status: 'failed',
          requestId: 1,
          input: sampleInput,
          idempotencyKey: 'idem-000001',
          attempt: 1,
          error: {
            kind: 'rejected',
            code,
            retryable: false,
            message: expectedMsg,
          },
        };

        render(
          <Provider store={store}>
            <Result state={state} onReset={mockReset} />
          </Provider>,
        );

        expect(
          screen.getByRole('heading', { level: 1, name: COPY['result.rejected.heading'] }),
        ).toBeInTheDocument();
        expect(screen.getByText(expectedMsg)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: COPY['result.edit'] })).toBeInTheDocument();
        expect(
          screen.queryByRole('button', { name: COPY['result.retry'] }),
        ).not.toBeInTheDocument();

        // No history entry should be added
        expect(store.getState().history.entries).toHaveLength(0);

        // Clicking Edit resets controller, returns to form, and preserves draft
        fireEvent.click(screen.getByRole('button', { name: COPY['result.edit'] }));
        expect(mockReset).toHaveBeenCalledTimes(1);
        expect(store.getState().flow.step).toBe('form');
        expect(store.getState().draft.amountText).toBe('100.00');
      },
    );
  });

  describe('RES-03: Retryable business rejection (SERVICE_UNAVAILABLE)', () => {
    it('renders rejected heading, SERVICE_UNAVAILABLE copy, Retry action and Edit action', () => {
      const store = setupStore();
      const mockRetry = jest.fn();
      const mockReset = jest.fn();
      const state: SubmitState<TransferInput, TransferResponsePayload> = {
        status: 'failed',
        requestId: 1,
        input: sampleInput,
        idempotencyKey: 'idem-000001',
        attempt: 1,
        error: {
          kind: 'rejected',
          code: 'SERVICE_UNAVAILABLE',
          retryable: true,
          message: COPY['result.rejected.SERVICE_UNAVAILABLE'],
        },
      };

      render(
        <Provider store={store}>
          <Result state={state} onRetry={mockRetry} onReset={mockReset} />
        </Provider>,
      );

      expect(
        screen.getByRole('heading', { level: 1, name: COPY['result.rejected.heading'] }),
      ).toBeInTheDocument();
      expect(screen.getByText(COPY['result.rejected.SERVICE_UNAVAILABLE'])).toBeInTheDocument();
      expect(screen.getByRole('button', { name: COPY['result.retry'] })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: COPY['result.edit'] })).toBeInTheDocument();

      // Clicking Retry calls onRetry
      fireEvent.click(screen.getByRole('button', { name: COPY['result.retry'] }));
      expect(mockRetry).toHaveBeenCalledTimes(1);

      // No history entry added
      expect(store.getState().history.entries).toHaveLength(0);
    });
  });

  describe('RES-04: Unconfirmed outcome (timeout, network, invalid_response)', () => {
    it.each([
      ['timeout', COPY['controller.timeout']],
      ['network', COPY['controller.network']],
      ['invalid_response', COPY['submit.invalid_response']],
    ])(
      'renders unconfirmed heading, body, error message, Retry and Leave actions for %s',
      (kind, message) => {
        const store = setupStore();
        const mockRetry = jest.fn();
        const mockReset = jest.fn();
        const state: SubmitState<TransferInput, TransferResponsePayload> = {
          status: 'failed',
          requestId: 1,
          input: sampleInput,
          idempotencyKey: 'idem-000001',
          attempt: 1,
          error: {
            kind: kind as 'timeout' | 'network' | 'invalid_response',
            retryable: true,
            message,
          },
        };

        render(
          <Provider store={store}>
            <Result state={state} onRetry={mockRetry} onReset={mockReset} />
          </Provider>,
        );

        expect(
          screen.getByRole('heading', { level: 1, name: COPY['result.unconfirmed.heading'] }),
        ).toBeInTheDocument();
        expect(screen.getByText(COPY['result.unconfirmed.body'])).toBeInTheDocument();
        expect(screen.getByText(message)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: COPY['result.retry'] })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: COPY['result.leave'] })).toBeInTheDocument();

        // No history entry added on render
        expect(store.getState().history.entries).toHaveLength(0);

        // Clicking Leave adds unconfirmed history entry, resets controller, returns to form, and shows banner
        fireEvent.click(screen.getByRole('button', { name: COPY['result.leave'] }));
        expect(store.getState().history.entries).toHaveLength(1);
        expect(store.getState().history.entries[0]).toEqual({
          id: 'idem-000001',
          kind: 'unconfirmed',
          recipientName: 'Elena Rostova',
          amountText: '$100.00',
        });
        expect(mockReset).toHaveBeenCalledTimes(1);
        expect(store.getState().flow.step).toBe('form');
        expect(store.getState().flow.banner).toEqual({
          kind: 'warning',
          copyKey: 'unconfirmed.banner',
        });
        expect(store.getState().draft.amountText).toBe('100.00');
      },
    );

    it('renders review.heading and role="status" submit.sending with no actions while submitting after a retry', () => {
      const store = setupStore();
      const state: SubmitState<TransferInput, TransferResponsePayload> = {
        status: 'submitting',
        input: sampleInput,
        idempotencyKey: 'idem-000001',
        attempt: 2,
        requestId: 2,
      };

      render(
        <Provider store={store}>
          <Result state={state} />
        </Provider>,
      );

      expect(
        screen.getByRole('heading', { level: 1, name: COPY['review.heading'] }),
      ).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveTextContent(COPY['submit.sending']);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('FOC-01 through FOC-04 Focus Behavior', () => {
    it('FOC-01: step heading receives focus on arrival at Result screen', () => {
      const store = setupStore();
      const state: SubmitState<TransferInput, TransferResponsePayload> = {
        status: 'succeeded',
        requestId: 1,
        idempotencyKey: 'TRF-000001',
        result: sampleSuccessResult,
      };

      act(() => {
        render(
          <Provider store={store}>
            <Result state={state} />
          </Provider>,
        );
      });

      const heading = screen.getByRole('heading', {
        level: 1,
        name: COPY['result.success.heading'],
      });
      expect(document.activeElement).toBe(heading);
    });

    it('FOC-02: summary receives focus when form review fails with client validation errors', () => {
      const store = createAppStore({ service: dummyService });
      store.dispatch(setAccounts(testAccounts));
      store.dispatch(setRecipients(testRecipients));

      render(
        <Provider store={store}>
          <SendForm />
        </Provider>,
      );

      fireEvent.click(screen.getByRole('button', { name: COPY['form.review.button'] }));

      const summary = screen.getByRole('alert');
      expect(summary).toBeInTheDocument();
      expect(document.activeElement).toBe(summary);
    });

    it('FOC-03: focus is preserved on the aria-disabled confirm button while submitting in Review', () => {
      const store = setupStore();
      const mockSubmit = jest.fn();

      render(
        <Provider store={store}>
          <Review onSubmit={mockSubmit} submitting={true} />
        </Provider>,
      );

      const confirmBtn = screen.getByRole('button', { name: COPY['review.sending'] });
      confirmBtn.focus();
      expect(document.activeElement).toBe(confirmBtn);
      expect(confirmBtn).toHaveAttribute('aria-disabled', 'true');

      fireEvent.click(confirmBtn);
      expect(document.activeElement).toBe(confirmBtn);
      expect(mockSubmit).not.toHaveBeenCalled();
    });

    it('FOC-04: heading receives focus again when the Result kind changes', () => {
      const store = setupStore();
      const submittingState: SubmitState<TransferInput, TransferResponsePayload> = {
        status: 'submitting',
        input: sampleInput,
        idempotencyKey: 'idem-000001',
        attempt: 2,
        requestId: 2,
      };

      const failedState: SubmitState<TransferInput, TransferResponsePayload> = {
        status: 'failed',
        requestId: 2,
        input: sampleInput,
        idempotencyKey: 'idem-000001',
        attempt: 2,
        error: {
          kind: 'timeout',
          retryable: true,
          message: COPY['controller.timeout'],
        },
      };

      const { rerender } = render(
        <Provider store={store}>
          <Result state={submittingState} />
        </Provider>,
      );

      const submittingHeading = screen.getByRole('heading', {
        level: 1,
        name: COPY['review.heading'],
      });
      expect(document.activeElement).toBe(submittingHeading);

      // Now state transitions to failed (unconfirmed)
      act(() => {
        rerender(
          <Provider store={store}>
            <Result state={failedState} />
          </Provider>,
        );
      });

      const unconfirmedHeading = screen.getByRole('heading', {
        level: 1,
        name: COPY['result.unconfirmed.heading'],
      });
      expect(document.activeElement).toBe(unconfirmedHeading);
    });
  });
});
