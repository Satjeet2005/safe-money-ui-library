import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createAppStore } from '../store/store.js';
import { goToReview, goToForm, type ReviewSnapshot } from '../store/flowSlice.js';
import {
  setAccounts,
  setRecipients,
  setAccountsStatus,
  setRecipientsStatus,
} from '../store/dataSlice.js';
import { setRecipient, setSourceCurrency, setAmountText } from '../store/draftSlice.js';
import { setChaos } from '../store/chaosSlice.js';
import { TransferFlow } from './TransferFlow.js';
import type { MockService } from '../service/mockService.js';
import type { Clock, Scheduler } from '@satjeet2005/safe-money-ui/submit';
import type { SubmitState } from '@satjeet2005/safe-money-ui/submit';
import { COPY } from '../copy.js';

describe('TransferFlow Integration and Controller Ownership (WP-21A)', () => {
  const sampleQuote = {
    quoteId: 'q-000001',
    source: { currency: 'USD' as const, minor: 10000 },
    target: { currency: 'EUR' as const, minor: 9200 },
    feeMinor: 200,
    rateMicro: 920000,
    expiresAtMs: 100_000,
  };

  const sampleSnapshot: ReviewSnapshot = {
    recipientId: 'rcp-001',
    quoteId: 'q-000001',
    sourceCurrency: 'USD',
    sourceMinor: 10000,
    feeMinor: 200,
    targetCurrency: 'EUR',
    targetMinor: 9200,
  };

  const testAccounts = [{ currency: 'USD' as const, balanceMinor: 500000 }];
  const testRecipients = [
    {
      id: 'rcp-001',
      name: 'Elena Rostova',
      country: 'DE',
      currency: 'EUR' as const,
      accountHint: '****1234',
    },
  ];

  let fakeClock: Clock;
  let fakeScheduler: Scheduler;
  let scheduledCallbacks: Map<unknown, () => void>;
  let nextTimerId: number;

  beforeEach(() => {
    fakeClock = { now: () => 1000 };
    scheduledCallbacks = new Map();
    nextTimerId = 1;
    fakeScheduler = {
      setTimeout: (fn: () => void, _ms: number) => {
        const id = nextTimerId++;
        scheduledCallbacks.set(id, fn);
        return id;
      },
      clearTimeout: (h: unknown) => {
        scheduledCallbacks.delete(h);
      },
    };
  });

  function setupReadyStore(service: MockService) {
    const store = createAppStore({ service, clock: fakeClock });
    store.dispatch(setAccounts(testAccounts));
    store.dispatch(setRecipients(testRecipients));
    store.dispatch(setAccountsStatus('ready'));
    store.dispatch(setRecipientsStatus('ready'));
    store.dispatch(setRecipient('rcp-001'));
    store.dispatch(setSourceCurrency('USD'));
    store.dispatch(setAmountText('100.00'));
    return store;
  }

  it('TF-01: step ownership renders SendForm, Review, and Result according to flow.step', () => {
    const dummyService: MockService = {
      getAccounts: jest.fn(),
      getRecipients: jest.fn(),
      getQuote: jest.fn(),
      submitTransfer: jest.fn(),
      debug: { executedCount: () => 0, balances: () => ({}), transferIds: () => [] },
    };
    const store = setupReadyStore(dummyService);

    const { rerender } = render(
      <Provider store={store}>
        <TransferFlow clock={fakeClock} service={dummyService} />
      </Provider>,
    );

    // Initial step is 'form'
    expect(screen.getByRole('heading', { name: COPY['form.heading'] })).toBeInTheDocument();

    // Transition to review
    act(() => {
      store.dispatch(goToReview({ quote: sampleQuote, snapshot: sampleSnapshot }));
    });
    rerender(
      <Provider store={store}>
        <TransferFlow clock={fakeClock} service={dummyService} />
      </Provider>,
    );
    expect(screen.getByRole('heading', { name: COPY['review.heading'] })).toBeInTheDocument();

    // Transition to form
    act(() => {
      store.dispatch(goToForm());
    });
    rerender(
      <Provider store={store}>
        <TransferFlow clock={fakeClock} service={dummyService} />
      </Provider>,
    );
    expect(screen.getByRole('heading', { name: COPY['form.heading'] })).toBeInTheDocument();
  });

  it('TF-02: controller lifetime survives step navigation without resetting', async () => {
    let capturedState: SubmitState<unknown, unknown> | null = null;
    const submitPromise = new Promise(() => {}); // never resolves to keep in submitting state

    const mockSubmit = jest.fn().mockReturnValue(submitPromise);
    const mockService: MockService = {
      getAccounts: jest.fn(),
      getRecipients: jest.fn(),
      getQuote: jest.fn(),
      submitTransfer: mockSubmit,
      debug: { executedCount: () => 0, balances: () => ({}), transferIds: () => [] },
    };

    const store = setupReadyStore(mockService);
    store.dispatch(goToReview({ quote: sampleQuote, snapshot: sampleSnapshot }));

    const { rerender } = render(
      <Provider store={store}>
        <TransferFlow
          clock={fakeClock}
          service={mockService}
          scheduler={fakeScheduler}
          onControllerStateChange={(st) => {
            capturedState = st;
          }}
        />
      </Provider>,
    );

    // Click confirm to enter submitting state
    fireEvent.click(screen.getByRole('button', { name: COPY['review.confirm'] }));

    expect(mockSubmit).toHaveBeenCalledTimes(1);
    expect(capturedState).toEqual(
      expect.objectContaining({
        status: 'submitting',
      }),
    );

    // Step transition back to form while controller is in-flight
    act(() => {
      store.dispatch(goToForm());
    });
    rerender(
      <Provider store={store}>
        <TransferFlow
          clock={fakeClock}
          service={mockService}
          scheduler={fakeScheduler}
          onControllerStateChange={(st) => {
            capturedState = st;
          }}
        />
      </Provider>,
    );

    // Controller must remain in 'submitting' status and NOT reset to 'idle'
    expect(capturedState).toEqual(
      expect.objectContaining({
        status: 'submitting',
      }),
    );
  });

  it('TF-03 & TF-04: submission wiring calls injected service with controller idempotency key and signal', async () => {
    let capturedSignal: AbortSignal | undefined;
    let capturedReq: unknown;

    const mockSubmit = jest.fn().mockImplementation((req, opts) => {
      capturedReq = req;
      capturedSignal = opts?.signal;
      return Promise.resolve({
        transferId: 'TRF-000001',
        status: 'completed',
        debited: { currency: 'USD', minor: 10200 },
        credited: { currency: 'EUR', minor: 9200 },
        completedAtMs: 2000,
      });
    });

    const mockService: MockService = {
      getAccounts: jest.fn(),
      getRecipients: jest.fn(),
      getQuote: jest.fn(),
      submitTransfer: mockSubmit,
      debug: { executedCount: () => 0, balances: () => ({}), transferIds: () => [] },
    };

    const store = setupReadyStore(mockService);
    store.dispatch(goToReview({ quote: sampleQuote, snapshot: sampleSnapshot }));

    render(
      <Provider store={store}>
        <TransferFlow
          clock={fakeClock}
          service={mockService}
          scheduler={fakeScheduler}
          newKey={() => 'idem-test-key-12345'}
        />
      </Provider>,
    );

    fireEvent.click(screen.getByRole('button', { name: COPY['review.confirm'] }));

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledTimes(1);
    });

    expect(capturedReq).toEqual({
      quoteId: 'q-000001',
      recipientId: 'rcp-001',
      sourceCurrency: 'USD',
      sourceMinor: 10000,
      idempotencyKey: 'idem-test-key-12345',
    });
    expect(capturedSignal).toBeDefined();
    expect(capturedSignal?.aborted).toBe(false);
  });

  it('TF-05: successful submission transitions to result once', async () => {
    const mockSubmit = jest.fn().mockResolvedValue({
      transferId: 'TRF-000001',
      status: 'completed',
      debited: { currency: 'USD', minor: 10200 },
      credited: { currency: 'EUR', minor: 9200 },
      completedAtMs: 2000,
    });

    const mockService: MockService = {
      getAccounts: jest.fn(),
      getRecipients: jest.fn(),
      getQuote: jest.fn(),
      submitTransfer: mockSubmit,
      debug: { executedCount: () => 0, balances: () => ({}), transferIds: () => [] },
    };

    const store = setupReadyStore(mockService);
    store.dispatch(goToReview({ quote: sampleQuote, snapshot: sampleSnapshot }));

    render(
      <Provider store={store}>
        <TransferFlow clock={fakeClock} service={mockService} scheduler={fakeScheduler} />
      </Provider>,
    );

    fireEvent.click(screen.getByRole('button', { name: COPY['review.confirm'] }));

    await waitFor(() => {
      expect(store.getState().flow.step).toBe('result');
    });

    // Heading of result step should now be rendered
    expect(
      screen.getByRole('heading', { name: COPY['result.success.heading'] }),
    ).toBeInTheDocument();
  });

  it('TF-06: live chaos settings are read dynamically at submit time', async () => {
    let capturedChaosInSubmit = '';
    const mockSubmit = jest.fn().mockImplementation(() => {
      const currentChaos = store.getState().chaos.rejectWith;
      capturedChaosInSubmit = currentChaos;
      return Promise.resolve({
        error: { code: 'SERVICE_UNAVAILABLE', message: 'Service unavailable.' },
      });
    });

    const mockService: MockService = {
      getAccounts: jest.fn(),
      getRecipients: jest.fn(),
      getQuote: jest.fn(),
      submitTransfer: mockSubmit,
      debug: { executedCount: () => 0, balances: () => ({}), transferIds: () => [] },
    };

    const store = setupReadyStore(mockService);
    store.dispatch(goToReview({ quote: sampleQuote, snapshot: sampleSnapshot }));

    render(
      <Provider store={store}>
        <TransferFlow clock={fakeClock} service={mockService} scheduler={fakeScheduler} />
      </Provider>,
    );

    // Dynamically update chaos config before confirming
    act(() => {
      store.dispatch(setChaos({ rejectWith: 'SERVICE_UNAVAILABLE' }));
    });

    fireEvent.click(screen.getByRole('button', { name: COPY['review.confirm'] }));

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledTimes(1);
    });

    expect(capturedChaosInSubmit).toBe('SERVICE_UNAVAILABLE');
  });

  it('TF-08: classifies RejectionBody with SERVICE_UNAVAILABLE as retryable rejected error', async () => {
    let capturedState: SubmitState<unknown, unknown> | null = null;
    const mockSubmit = jest.fn().mockResolvedValue({
      error: { code: 'SERVICE_UNAVAILABLE', message: 'Service unavailable.' },
    });

    const mockService: MockService = {
      getAccounts: jest.fn(),
      getRecipients: jest.fn(),
      getQuote: jest.fn(),
      submitTransfer: mockSubmit,
      debug: { executedCount: () => 0, balances: () => ({}), transferIds: () => [] },
    };

    const store = setupReadyStore(mockService);
    store.dispatch(goToReview({ quote: sampleQuote, snapshot: sampleSnapshot }));

    render(
      <Provider store={store}>
        <TransferFlow
          clock={fakeClock}
          service={mockService}
          scheduler={fakeScheduler}
          onControllerStateChange={(st) => {
            capturedState = st;
          }}
        />
      </Provider>,
    );

    fireEvent.click(screen.getByRole('button', { name: COPY['review.confirm'] }));

    await waitFor(() => {
      expect(capturedState?.status).toBe('failed');
    });

    if (capturedState && capturedState.status === 'failed') {
      expect(capturedState.error).toEqual({
        kind: 'rejected',
        code: 'SERVICE_UNAVAILABLE',
        retryable: true,
        message: 'Service unavailable.',
      });
    }

    // Step should advance to result
    expect(store.getState().flow.step).toBe('result');
  });

  it('TF-09: invalid/unknown rejection body is treated as invalid_response', async () => {
    let capturedState: SubmitState<unknown, unknown> | null = null;
    const mockSubmit = jest.fn().mockResolvedValue({
      error: { code: 'UNKNOWN_SERVER_CODE', message: 'Unknown failure.' },
    });

    const mockService: MockService = {
      getAccounts: jest.fn(),
      getRecipients: jest.fn(),
      getQuote: jest.fn(),
      submitTransfer: mockSubmit,
      debug: { executedCount: () => 0, balances: () => ({}), transferIds: () => [] },
    };

    const store = setupReadyStore(mockService);
    store.dispatch(goToReview({ quote: sampleQuote, snapshot: sampleSnapshot }));

    render(
      <Provider store={store}>
        <TransferFlow
          clock={fakeClock}
          service={mockService}
          scheduler={fakeScheduler}
          onControllerStateChange={(st) => {
            capturedState = st;
          }}
        />
      </Provider>,
    );

    fireEvent.click(screen.getByRole('button', { name: COPY['review.confirm'] }));

    await waitFor(() => {
      expect(capturedState?.status).toBe('failed');
    });

    if (capturedState && capturedState.status === 'failed') {
      expect(capturedState.error.kind).toBe('invalid_response');
      expect(capturedState.error.message).toBe(COPY['submit.invalid_response']);
    }

    expect(store.getState().flow.step).toBe('result');
  });

  it('TF-10: financially inconsistent response fails verifyTransfer and yields invalid_response', async () => {
    let capturedState: SubmitState<unknown, unknown> | null = null;
    // Debited minor is 10201 instead of 10200 (sourceMinor 10000 + feeMinor 200)
    const mockSubmit = jest.fn().mockResolvedValue({
      transferId: 'TRF-000001',
      status: 'completed',
      debited: { currency: 'USD', minor: 10201 },
      credited: { currency: 'EUR', minor: 9200 },
      completedAtMs: 2000,
    });

    const mockService: MockService = {
      getAccounts: jest.fn(),
      getRecipients: jest.fn(),
      getQuote: jest.fn(),
      submitTransfer: mockSubmit,
      debug: { executedCount: () => 0, balances: () => ({}), transferIds: () => [] },
    };

    const store = setupReadyStore(mockService);
    store.dispatch(goToReview({ quote: sampleQuote, snapshot: sampleSnapshot }));

    render(
      <Provider store={store}>
        <TransferFlow
          clock={fakeClock}
          service={mockService}
          scheduler={fakeScheduler}
          onControllerStateChange={(st) => {
            capturedState = st;
          }}
        />
      </Provider>,
    );

    fireEvent.click(screen.getByRole('button', { name: COPY['review.confirm'] }));

    await waitFor(() => {
      expect(capturedState?.status).toBe('failed');
    });

    if (capturedState && capturedState.status === 'failed') {
      expect(capturedState.error.kind).toBe('invalid_response');
      expect(capturedState.error.message).toBe(COPY['submit.invalid_response']);
    }

    expect(store.getState().flow.step).toBe('result');
  });

  it('TF-11: request timeout aborts signal and transitions to result with timeout error', async () => {
    let capturedState: SubmitState<unknown, unknown> | null = null;
    let signalAborted = false;

    const mockSubmit = jest.fn().mockImplementation((_req, opts) => {
      opts?.signal?.addEventListener('abort', () => {
        signalAborted = true;
      });
      return new Promise(() => {}); // hang
    });

    const mockService: MockService = {
      getAccounts: jest.fn(),
      getRecipients: jest.fn(),
      getQuote: jest.fn(),
      submitTransfer: mockSubmit,
      debug: { executedCount: () => 0, balances: () => ({}), transferIds: () => [] },
    };

    const store = setupReadyStore(mockService);
    store.dispatch(goToReview({ quote: sampleQuote, snapshot: sampleSnapshot }));

    render(
      <Provider store={store}>
        <TransferFlow
          clock={fakeClock}
          service={mockService}
          scheduler={fakeScheduler}
          onControllerStateChange={(st) => {
            capturedState = st;
          }}
        />
      </Provider>,
    );

    fireEvent.click(screen.getByRole('button', { name: COPY['review.confirm'] }));

    expect(mockSubmit).toHaveBeenCalledTimes(1);
    expect(scheduledCallbacks.size).toBe(1);

    // Fire the timeout callback
    act(() => {
      for (const cb of Array.from(scheduledCallbacks.values())) {
        cb();
      }
    });

    expect(signalAborted).toBe(true);
    expect(capturedState).toEqual(
      expect.objectContaining({
        status: 'failed',
        error: expect.objectContaining({
          kind: 'timeout',
          retryable: true,
          message: COPY['controller.timeout'],
        }),
      }),
    );
    expect(store.getState().flow.step).toBe('result');
  });
});
