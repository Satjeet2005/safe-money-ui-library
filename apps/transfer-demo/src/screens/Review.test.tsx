import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { axe } from 'jest-axe';
import { Provider } from 'react-redux';
import { createAppStore } from '../store/store.js';
import {
  setAccounts,
  setRecipients,
  setAccountsStatus,
  setRecipientsStatus,
} from '../store/dataSlice.js';
import {
  goToReview,
  setBanner,
  type ReviewSnapshot,
  type QuotePayload,
} from '../store/flowSlice.js';
import { setRecipient, setSourceCurrency, setAmountText } from '../store/draftSlice.js';
import { Review } from './Review.js';
import type { MockService } from '../service/mockService.js';
import type { Clock } from '@satjeet2005/safe-money-ui/submit';

describe('Review Screen (REV-01..REV-06)', () => {
  const getAccountsMock = jest.fn();
  const getRecipientsMock = jest.fn();
  const getQuoteMock = jest.fn();
  const submitTransferMock = jest.fn();

  const dummyService: MockService = {
    getAccounts: getAccountsMock,
    getRecipients: getRecipientsMock,
    getQuote: getQuoteMock,
    submitTransfer: submitTransferMock,
    debug: {
      executedCount: () => 0,
      balances: () => ({}),
      transferIds: () => [],
    },
  };

  const defaultAccounts = [
    { currency: 'USD' as const, balanceMinor: 500000 },
    { currency: 'EUR' as const, balanceMinor: 400000 },
  ];

  const defaultRecipients = [
    {
      id: 'rcp-001',
      name: 'Elena Rostova',
      country: 'DE',
      currency: 'EUR' as const,
      accountHint: '****1234',
    },
  ];

  const defaultQuote: QuotePayload = {
    quoteId: 'q-000001',
    source: { currency: 'USD', minor: 10000 },
    target: { currency: 'EUR', minor: 9200 },
    feeMinor: 150,
    rateMicro: 920000,
    expiresAtMs: 100000,
  };

  const defaultSnapshot: ReviewSnapshot = {
    recipientId: 'rcp-001',
    quoteId: 'q-000001',
    sourceCurrency: 'USD',
    sourceMinor: 10000,
    feeMinor: 150,
    targetCurrency: 'EUR',
    targetMinor: 9200,
  };

  let fakeNow = 50000;
  const fakeClock: Clock = {
    now: () => fakeNow,
  };

  function setup(options?: {
    quote?: QuotePayload;
    snapshot?: ReviewSnapshot;
    amountText?: string;
    recipientId?: string | null;
    sourceCurrency?: 'USD' | 'EUR';
    submitting?: boolean;
    clockTime?: number;
  }) {
    fakeNow = options?.clockTime ?? 50000;

    const store = createAppStore({ service: dummyService, clock: fakeClock });
    store.dispatch(setAccountsStatus('ready'));
    store.dispatch(setRecipientsStatus('ready'));
    store.dispatch(setAccounts(defaultAccounts));
    store.dispatch(setRecipients(defaultRecipients));

    store.dispatch(setRecipient(options?.recipientId ?? 'rcp-001'));
    store.dispatch(setSourceCurrency(options?.sourceCurrency ?? 'USD'));
    store.dispatch(setAmountText(options?.amountText ?? '100.00'));

    store.dispatch(
      goToReview({
        quote: options?.quote ?? defaultQuote,
        snapshot: options?.snapshot ?? defaultSnapshot,
      }),
    );

    const submitMock = jest.fn();

    const utils = render(
      <Provider store={store}>
        <Review onSubmit={submitMock} submitting={options?.submitting ?? false} clock={fakeClock} />
      </Provider>,
    );

    return { ...utils, store, submitMock };
  }

  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
  });

  it('REV-01 & REV-02: review guard detects invalid changed details, returns to form, dispatches attemptFailed, shows review.changed, and does not submit', async () => {
    // Draft amount changed to empty/invalid, while snapshot had valid 10000
    const { store, submitMock } = setup({ amountText: '' });

    const confirmButton = screen.getByRole('button', { name: 'Confirm and send' });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(store.getState().flow.step).toBe('form');
    });

    expect(store.getState().draft.showErrors).toBe(true);
    expect(store.getState().flow.banner?.copyKey).toBe('review.changed');
    expect(submitMock).not.toHaveBeenCalled();
    expect(getQuoteMock).not.toHaveBeenCalled();
  });

  it('REV-03: review guard detects valid changed details, fetches fresh quote and new snapshot, displays review.changed, and does not submit', async () => {
    // Draft amount changed to 200.00 (valid), while snapshot had 10000 (100.00)
    const refreshedQuote = {
      ...defaultQuote,
      quoteId: 'q-000002',
      source: { currency: 'USD' as const, minor: 20000 },
      target: { currency: 'EUR' as const, minor: 18400 },
      feeMinor: 300,
    };
    getQuoteMock.mockResolvedValueOnce(refreshedQuote);

    const { store, submitMock } = setup({ amountText: '200.00' });

    const confirmButton = screen.getByRole('button', { name: 'Confirm and send' });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(getQuoteMock).toHaveBeenCalledWith(
        { recipientId: 'rcp-001', sourceCurrency: 'USD', sourceMinor: 20000 },
        expect.anything(),
      );
    });

    expect(store.getState().flow.step).toBe('review');
    expect(store.getState().flow.snapshot?.sourceMinor).toBe(20000);
    expect(store.getState().flow.banner?.copyKey).toBe('review.changed');
    expect(submitMock).not.toHaveBeenCalled();
  });

  it('REV-04: quote expired, refreshed quote has changed target or fee, displays review.rateChanged, and does not submit', async () => {
    // Expired quote (expires at 100000, clock is 120000)
    // Rate changed: target.minor is now 9100 instead of 9200
    const rateMovedQuote = {
      ...defaultQuote,
      quoteId: 'q-000003',
      target: { currency: 'EUR' as const, minor: 9100 },
      expiresAtMs: 150000,
    };
    getQuoteMock.mockResolvedValueOnce(rateMovedQuote);

    const { store, submitMock } = setup({ clockTime: 120000 });

    const confirmButton = screen.getByRole('button', { name: 'Confirm and send' });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(getQuoteMock).toHaveBeenCalled();
    });

    expect(store.getState().flow.step).toBe('review');
    expect(store.getState().flow.banner?.copyKey).toBe('review.rateChanged');
    expect(submitMock).not.toHaveBeenCalled();
  });

  it('REV-05: quote expired, refreshed quote has unchanged target and fee, displays review.rateRefreshed, and does not submit', async () => {
    // Expired quote (expires at 100000, clock is 120000)
    // Same target and fee amounts
    const rateSameQuote = {
      ...defaultQuote,
      quoteId: 'q-000004',
      expiresAtMs: 150000,
    };
    getQuoteMock.mockResolvedValueOnce(rateSameQuote);

    const { store, submitMock } = setup({ clockTime: 120000 });

    const confirmButton = screen.getByRole('button', { name: 'Confirm and send' });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(getQuoteMock).toHaveBeenCalled();
    });

    expect(store.getState().flow.step).toBe('review');
    expect(store.getState().flow.banner?.copyKey).toBe('review.rateRefreshed');
    expect(submitMock).not.toHaveBeenCalled();
  });

  it('REV-06: valid review and unexpired quote calls submit action exactly once with required transfer input', () => {
    // Valid details matching snapshot, clock unexpired (50000 < 100000)
    const { submitMock } = setup({ clockTime: 50000 });

    const confirmButton = screen.getByRole('button', { name: 'Confirm and send' });
    fireEvent.click(confirmButton);

    expect(submitMock).toHaveBeenCalledTimes(1);
    expect(submitMock).toHaveBeenCalledWith({
      quoteId: 'q-000001',
      recipientId: 'rcp-001',
      sourceCurrency: 'USD',
      sourceMinor: 10000,
    });
    expect(getQuoteMock).not.toHaveBeenCalled();
  });

  it('renders complete transfer summary in dl with formatted amounts, rate, and rate-held note', () => {
    setup();

    expect(screen.getByText('Elena Rostova · DE · ****1234')).toBeInTheDocument();
    expect(screen.getByText('$100.00')).toBeInTheDocument();
    expect(screen.getByText('$1.50')).toBeInTheDocument();
    expect(screen.getByText('$101.50')).toBeInTheDocument();
    expect(screen.getByText('1 USD = 0.9200 EUR')).toBeInTheDocument();
    expect(screen.getByText('€92.00')).toBeInTheDocument();
    expect(
      screen.getByText('The rate is held for 30 seconds from when this screen opens.'),
    ).toBeInTheDocument();
  });

  it('edit action dispatches goToForm without submitting transfer', () => {
    const { store, submitMock } = setup();

    const editButton = screen.getByRole('button', { name: 'Edit details' });
    fireEvent.click(editButton);

    expect(store.getState().flow.step).toBe('form');
    expect(submitMock).not.toHaveBeenCalled();
  });

  it('submitting state shows aria-disabled buttons, review.sending text, and status message', () => {
    const { submitMock } = setup({ submitting: true });

    const confirmButton = screen.getByRole('button', { name: 'Sending…' });
    const editButton = screen.getByRole('button', { name: 'Edit details' });

    expect(confirmButton).toHaveAttribute('aria-disabled', 'true');
    expect(editButton).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('Sending your transfer…');

    fireEvent.click(confirmButton);
    expect(submitMock).not.toHaveBeenCalled();
  });

  describe('A11Y-05 and A11Y-06: Review accessibility', () => {
    const AXE_OPTIONS = {
      runOnly: {
        type: 'tag' as const,
        values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
      },
      rules: {
        // Disable color-contrast in jsdom as specified by PRD §15.2 (jsdom has no layout/rendering engine)
        'color-contrast': { enabled: false },
      },
    };

    it('A11Y-05: Review, default has zero axe violations', async () => {
      const { container } = setup();
      const results = await axe(container, AXE_OPTIONS);
      expect(results).toHaveNoViolations();
    });

    it('A11Y-06: Review with info banner has zero axe violations', async () => {
      const { container, store } = setup();
      act(() => {
        store.dispatch(setBanner({ kind: 'info', copyKey: 'review.rateRefreshed' }));
      });
      const results = await axe(container, AXE_OPTIONS);
      expect(results).toHaveNoViolations();
    });

    it('A11Y-06: Review with warning banner has zero axe violations', async () => {
      const { container, store } = setup();
      act(() => {
        store.dispatch(setBanner({ kind: 'warning', copyKey: 'review.changed' }));
      });
      const results = await axe(container, AXE_OPTIONS);
      expect(results).toHaveNoViolations();
    });
  });
});
