import {
  draftSlice,
  setRecipient,
  setSourceCurrency,
  setAmountText,
  setLocale,
  attemptFailed,
  resetDraft,
  hydrateDraft,
} from './draftSlice.js';
import {
  flowSlice,
  goToForm,
  goToReview,
  goToResult,
  setQuoteStatus,
  setBanner,
  clearBanner,
  fetchQuote,
  type ReviewSnapshot,
} from './flowSlice.js';
import {
  dataSlice,
  setAccounts,
  setRecipients,
  setAccountsStatus,
  setRecipientsStatus,
  loadAccounts,
  loadRecipients,
} from './dataSlice.js';
import { chaosSlice, setChaos, resetChaos, togglePanel } from './chaosSlice.js';
import { historySlice, addEntry } from './historySlice.js';
import { createAppStore } from './store.js';
import { DEFAULT_CHAOS_CONFIG } from '../service/chaos.js';
import type { MockService } from '../service/mockService.js';

describe('draftSlice', () => {
  it('has correct initial state', () => {
    const state = draftSlice.reducer(undefined, { type: '@@INIT' });
    expect(state).toEqual({
      recipientId: null,
      sourceCurrency: 'USD',
      amountText: '',
      locale: 'en-US',
      showErrors: false,
      errorFocusKey: 0,
    });
  });

  it('updates recipient, source currency, amount text, and locale', () => {
    let state = draftSlice.reducer(undefined, setRecipient('rcp-001'));
    expect(state.recipientId).toBe('rcp-001');

    state = draftSlice.reducer(state, setSourceCurrency('EUR'));
    expect(state.sourceCurrency).toBe('EUR');

    state = draftSlice.reducer(state, setAmountText('250.00'));
    expect(state.amountText).toBe('250.00');

    state = draftSlice.reducer(state, setLocale('de-DE'));
    expect(state.locale).toBe('de-DE');
  });

  it('handles attemptFailed by enabling errors and incrementing errorFocusKey', () => {
    let state = draftSlice.reducer(undefined, attemptFailed());
    expect(state.showErrors).toBe(true);
    expect(state.errorFocusKey).toBe(1);

    state = draftSlice.reducer(state, attemptFailed());
    expect(state.showErrors).toBe(true);
    expect(state.errorFocusKey).toBe(2);
  });

  it('handles resetDraft and hydrateDraft', () => {
    let state = draftSlice.reducer(undefined, setAmountText('999'));
    state = draftSlice.reducer(state, resetDraft());
    expect(state.amountText).toBe('');
    expect(state.showErrors).toBe(false);

    state = draftSlice.reducer(
      state,
      hydrateDraft({
        recipientId: 'rcp-002',
        sourceCurrency: 'GBP',
        amountText: '42.50',
        locale: 'pl-PL',
        showErrors: false,
        errorFocusKey: 0,
      }),
    );
    expect(state.recipientId).toBe('rcp-002');
    expect(state.sourceCurrency).toBe('GBP');
    expect(state.amountText).toBe('42.50');
    expect(state.locale).toBe('pl-PL');
  });
});

describe('flowSlice', () => {
  it('has correct initial state', () => {
    const state = flowSlice.reducer(undefined, { type: '@@INIT' });
    expect(state).toEqual({
      step: 'form',
      quote: null,
      snapshot: null,
      quoteStatus: 'idle',
      banner: null,
    });
  });

  it('transitions between steps and sets quote and snapshot on goToReview', () => {
    const snapshot: ReviewSnapshot = {
      recipientId: 'rcp-001',
      quoteId: 'q-000001',
      sourceCurrency: 'USD',
      sourceMinor: 10000,
      feeMinor: 200,
      targetCurrency: 'EUR',
      targetMinor: 9200,
    };
    const quote = {
      quoteId: 'q-000001',
      source: { currency: 'USD' as const, minor: 10000 },
      target: { currency: 'EUR' as const, minor: 9200 },
      feeMinor: 200,
      rateMicro: 920000,
      expiresAtMs: 30000,
    };

    let state = flowSlice.reducer(undefined, goToReview({ quote, snapshot }));
    expect(state.step).toBe('review');
    expect(state.quote).toEqual(quote);
    expect(state.snapshot).toEqual(snapshot);

    state = flowSlice.reducer(state, goToResult());
    expect(state.step).toBe('result');

    state = flowSlice.reducer(state, goToForm());
    expect(state.step).toBe('form');
  });

  it('handles quote status and banner actions', () => {
    let state = flowSlice.reducer(undefined, setQuoteStatus('loading'));
    expect(state.quoteStatus).toBe('loading');

    state = flowSlice.reducer(state, setBanner({ kind: 'warning', copyKey: 'review.rateChanged' }));
    expect(state.banner).toEqual({ kind: 'warning', copyKey: 'review.rateChanged' });

    state = flowSlice.reducer(state, clearBanner());
    expect(state.banner).toBeNull();
  });
});

describe('dataSlice', () => {
  it('has correct initial state', () => {
    const state = dataSlice.reducer(undefined, { type: '@@INIT' });
    expect(state).toEqual({
      accounts: null,
      recipients: null,
      accountsStatus: 'idle',
      recipientsStatus: 'idle',
    });
  });

  it('sets accounts and recipients with ready status', () => {
    const accounts = [{ currency: 'USD' as const, balanceMinor: 500000 }];
    const recipients = [
      {
        id: 'rcp-001',
        name: 'Elena Rostova',
        country: 'DE',
        currency: 'EUR' as const,
        accountHint: '****1234',
      },
    ];

    let state = dataSlice.reducer(undefined, setAccounts(accounts));
    expect(state.accounts).toEqual(accounts);
    expect(state.accountsStatus).toBe('ready');

    state = dataSlice.reducer(state, setRecipients(recipients));
    expect(state.recipients).toEqual(recipients);
    expect(state.recipientsStatus).toBe('ready');
  });

  it('sets explicit statuses', () => {
    let state = dataSlice.reducer(undefined, setAccountsStatus('loading'));
    expect(state.accountsStatus).toBe('loading');

    state = dataSlice.reducer(state, setRecipientsStatus('failed'));
    expect(state.recipientsStatus).toBe('failed');
  });
});

describe('chaosSlice', () => {
  it('has correct initial state', () => {
    const state = chaosSlice.reducer(undefined, { type: '@@INIT' });
    expect(state).toEqual({
      ...DEFAULT_CHAOS_CONFIG,
      panelOpen: false,
    });
  });

  it('updates partial config, toggles panel and resets', () => {
    let state = chaosSlice.reducer(
      undefined,
      setChaos({ latencyMs: 500, hangForever: true, rejectWith: 'INSUFFICIENT_FUNDS' }),
    );
    expect(state.latencyMs).toBe(500);
    expect(state.hangForever).toBe(true);
    expect(state.rejectWith).toBe('INSUFFICIENT_FUNDS');

    state = chaosSlice.reducer(state, togglePanel());
    expect(state.panelOpen).toBe(true);
    state = chaosSlice.reducer(state, togglePanel());
    expect(state.panelOpen).toBe(false);

    state = chaosSlice.reducer(state, resetChaos());
    expect(state.latencyMs).toBe(DEFAULT_CHAOS_CONFIG.latencyMs);
    expect(state.hangForever).toBe(DEFAULT_CHAOS_CONFIG.hangForever);
    expect(state.rejectWith).toBe(DEFAULT_CHAOS_CONFIG.rejectWith);
  });
});

describe('historySlice', () => {
  it('has correct initial state', () => {
    const state = historySlice.reducer(undefined, { type: '@@INIT' });
    expect(state.entries).toEqual([]);
  });

  it('adds entries to the beginning of the list', () => {
    let state = historySlice.reducer(
      undefined,
      addEntry({
        id: 'TRF-000001',
        kind: 'completed',
        recipientName: 'Elena Rostova',
        amountText: '$100.00',
      }),
    );
    expect(state.entries).toHaveLength(1);
    expect(state.entries[0]?.id).toBe('TRF-000001');

    state = historySlice.reducer(
      state,
      addEntry({
        id: 'TRF-000002',
        kind: 'unconfirmed',
        recipientName: 'Carlos Silva',
        amountText: '$200.00',
      }),
    );
    expect(state.entries).toHaveLength(2);
    expect(state.entries[0]?.id).toBe('TRF-000002');
    expect(state.entries[1]?.id).toBe('TRF-000001');
  });
});

describe('Async Thunks via createAppStore', () => {
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

  it('loadAccounts thunk: sets loading, then fulfilled with boundary-validated accounts', async () => {
    const mockAccounts = {
      accounts: [{ currency: 'USD' as const, balanceMinor: 500000 }],
    };
    getAccountsMock.mockResolvedValueOnce(mockAccounts);

    const store = createAppStore({ service: dummyService });
    expect(store.getState().data.accountsStatus).toBe('idle');

    const promise = store.dispatch(loadAccounts());
    expect(store.getState().data.accountsStatus).toBe('loading');

    await promise;
    expect(store.getState().data.accountsStatus).toBe('ready');
    expect(store.getState().data.accounts).toEqual(mockAccounts.accounts);
  });

  it('loadAccounts thunk: sets failed and error banner on boundary rejection', async () => {
    getAccountsMock.mockResolvedValueOnce({
      accounts: [{ currency: 'INVALID_CURRENCY', balanceMinor: -10 }],
    });

    const store = createAppStore({ service: dummyService });
    await store.dispatch(loadAccounts());

    expect(store.getState().data.accountsStatus).toBe('failed');
    expect(store.getState().flow.banner).toEqual({
      kind: 'error',
      copyKey: 'load.accounts.failed',
    });
  });

  it('loadAccounts thunk: sets failed and error banner on network error', async () => {
    getAccountsMock.mockRejectedValueOnce(new Error('Network error'));

    const store = createAppStore({ service: dummyService });
    await store.dispatch(loadAccounts());

    expect(store.getState().data.accountsStatus).toBe('failed');
    expect(store.getState().flow.banner).toEqual({
      kind: 'error',
      copyKey: 'load.accounts.failed',
    });
  });

  it('loadRecipients thunk: sets loading, then fulfilled with boundary-validated recipients', async () => {
    const mockRecipients = {
      recipients: [
        {
          id: 'rcp-001',
          name: 'Elena Rostova',
          country: 'DE',
          currency: 'EUR' as const,
          accountHint: '****1234',
        },
      ],
    };
    getRecipientsMock.mockResolvedValueOnce(mockRecipients);

    const store = createAppStore({ service: dummyService });
    expect(store.getState().data.recipientsStatus).toBe('idle');

    const promise = store.dispatch(loadRecipients());
    expect(store.getState().data.recipientsStatus).toBe('loading');

    await promise;
    expect(store.getState().data.recipientsStatus).toBe('ready');
    expect(store.getState().data.recipients).toEqual(mockRecipients.recipients);
  });

  it('loadRecipients thunk: sets failed and error banner on network error or schema mismatch', async () => {
    getRecipientsMock.mockRejectedValueOnce(new Error('Server fault'));

    const store = createAppStore({ service: dummyService });
    await store.dispatch(loadRecipients());

    expect(store.getState().data.recipientsStatus).toBe('failed');
    expect(store.getState().flow.banner).toEqual({
      kind: 'error',
      copyKey: 'load.recipients.failed',
    });
  });

  it('fetchQuote thunk: successfully loads quote from draft, validates QuoteResponse, and advances to review', async () => {
    const rawQuote = {
      quoteId: 'q-000001',
      source: { currency: 'USD', minor: 10000 },
      target: { currency: 'EUR', minor: 9200 },
      feeMinor: 200,
      rateMicro: 920000,
      expiresAtMs: 30000,
    };
    getQuoteMock.mockResolvedValueOnce(rawQuote);

    const store = createAppStore({ service: dummyService });
    store.dispatch(setRecipient('rcp-001'));
    store.dispatch(setSourceCurrency('USD'));
    store.dispatch(setAmountText('100.00'));
    store.dispatch(setLocale('en-US'));

    const promise = store.dispatch(fetchQuote());
    expect(store.getState().flow.quoteStatus).toBe('loading');

    await promise;
    expect(store.getState().flow.quoteStatus).toBe('idle');
    expect(store.getState().flow.step).toBe('review');
    expect(store.getState().flow.quote).toEqual(rawQuote);
    expect(store.getState().flow.snapshot).toEqual({
      recipientId: 'rcp-001',
      quoteId: 'q-000001',
      sourceCurrency: 'USD',
      sourceMinor: 10000,
      feeMinor: 200,
      targetCurrency: 'EUR',
      targetMinor: 9200,
    });
  });

  it('fetchQuote thunk: works with explicit argument overrides', async () => {
    const rawQuote = {
      quoteId: 'q-000002',
      source: { currency: 'EUR', minor: 5000 },
      target: { currency: 'GBP', minor: 4250 },
      feeMinor: 100,
      rateMicro: 850000,
      expiresAtMs: 35000,
    };
    getQuoteMock.mockResolvedValueOnce(rawQuote);

    const store = createAppStore({ service: dummyService });
    await store.dispatch(
      fetchQuote({ recipientId: 'rcp-002', sourceCurrency: 'EUR', sourceMinor: 5000 }),
    );

    expect(store.getState().flow.step).toBe('review');
    expect(store.getState().flow.quote).toEqual(rawQuote);
  });

  it('fetchQuote thunk: fails cleanly if recipient or amount cannot be parsed from draft', async () => {
    const store = createAppStore({ service: dummyService });
    // recipient is null
    await store.dispatch(fetchQuote());

    expect(store.getState().flow.quoteStatus).toBe('failed');
    expect(store.getState().flow.step).toBe('form');
    expect(store.getState().flow.banner).toEqual({
      kind: 'error',
      copyKey: 'quote.failed',
    });
  });

  it('fetchQuote thunk: fails and sets quote.failed banner when schema validation fails', async () => {
    getQuoteMock.mockResolvedValueOnce({
      quoteId: 'malformed-id',
      source: { currency: 'BAD', minor: 100 },
    });

    const store = createAppStore({ service: dummyService });
    store.dispatch(setRecipient('rcp-001'));
    store.dispatch(setAmountText('100.00'));

    await store.dispatch(fetchQuote());

    expect(store.getState().flow.quoteStatus).toBe('failed');
    expect(store.getState().flow.step).toBe('form');
    expect(store.getState().flow.banner).toEqual({
      kind: 'error',
      copyKey: 'quote.failed',
    });
  });

  it('fetchQuote thunk: fails and sets quote.failed banner when service call rejects', async () => {
    getQuoteMock.mockRejectedValueOnce(new Error('Network timeout'));

    const store = createAppStore({ service: dummyService });
    store.dispatch(setRecipient('rcp-001'));
    store.dispatch(setAmountText('100.00'));

    await store.dispatch(fetchQuote());

    expect(store.getState().flow.quoteStatus).toBe('failed');
    expect(store.getState().flow.step).toBe('form');
    expect(store.getState().flow.banner).toEqual({
      kind: 'error',
      copyKey: 'quote.failed',
    });
  });
});
