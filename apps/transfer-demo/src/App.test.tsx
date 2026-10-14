import { render, screen, fireEvent, within, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createAppStore } from './store/store.js';
import { setAccounts, setAccountsStatus, setRecipientsStatus } from './store/dataSlice.js';
import { addEntry } from './store/historySlice.js';
import { goToForm, goToReview, goToResult } from './store/flowSlice.js';
import { App } from './App.js';
import { DRAFT_STORAGE_KEY } from './persistence/draftStorage.js';
import type { MockService } from './service/mockService.js';

describe('App shell and integration', () => {
  const dummyService: MockService = {
    getAccounts: jest.fn().mockResolvedValue({ accounts: [] }),
    getRecipients: jest.fn().mockResolvedValue({ recipients: [] }),
    getQuote: jest.fn(),
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

  it('renders application shell elements: header, demo banner, account summary, empty activity, chaos button', () => {
    const store = createAppStore({ service: dummyService });
    store.dispatch(setAccountsStatus('ready'));
    store.dispatch(setRecipientsStatus('ready'));
    store.dispatch(
      setAccounts([
        { currency: 'USD', balanceMinor: 500000 },
        { currency: 'EUR', balanceMinor: 250000 },
      ]),
    );

    render(
      <Provider store={store}>
        <App />
      </Provider>,
    );

    // Title and banner
    expect(screen.getByRole('heading', { level: 1, name: 'Northwind Pay' })).toBeInTheDocument();
    expect(
      screen.getByText(
        'Demo with fictional data. No real money moves. Not affiliated with any bank or payments company.',
      ),
    ).toBeInTheDocument();

    // AccountSummary
    const summarySection = screen.getByLabelText('Account Summary');
    expect(within(summarySection).getByText('USD · $5,000.00')).toBeInTheDocument();
    expect(within(summarySection).getByText('EUR · €2,500.00')).toBeInTheDocument();

    // Empty activity
    expect(screen.getByRole('heading', { level: 2, name: 'Recent activity' })).toBeInTheDocument();
    expect(screen.getByText('No transfers yet.')).toBeInTheDocument();

    // Chaos mode toggle
    const chaosBtn = screen.getByRole('button', { name: 'Chaos mode' });
    expect(chaosBtn).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Chaos mode' })).not.toBeInTheDocument();

    fireEvent.click(chaosBtn);
    expect(screen.getByRole('heading', { name: 'Chaos mode' })).toBeInTheDocument();
  });

  it('displays history entries when present', () => {
    const store = createAppStore({ service: dummyService });
    store.dispatch(setAccountsStatus('ready'));
    store.dispatch(setRecipientsStatus('ready'));
    store.dispatch(
      addEntry({
        id: 'TRF-000001',
        kind: 'completed',
        recipientName: 'Mateo Alvarez',
        amountText: '$150.00',
      }),
    );
    store.dispatch(
      addEntry({
        id: 'TRF-000002',
        kind: 'unconfirmed',
        recipientName: 'Priya Nair',
        amountText: '$250.00',
      }),
    );

    render(
      <Provider store={store}>
        <App />
      </Provider>,
    );

    expect(screen.getByText('Completed · Mateo Alvarez · $150.00')).toBeInTheDocument();
    expect(screen.getByText('Unconfirmed · Priya Nair · $250.00')).toBeInTheDocument();
  });

  it('surfaces draft.discarded banner when saved draft is unreadable', () => {
    sessionStorage.setItem(DRAFT_STORAGE_KEY, '{corrupt-json-123');

    const store = createAppStore({ service: dummyService });
    store.dispatch(setAccountsStatus('ready'));
    store.dispatch(setRecipientsStatus('ready'));
    render(
      <Provider store={store}>
        <App />
      </Provider>,
    );

    expect(
      screen.getByText('Your saved draft was unreadable, so we cleared it.'),
    ).toBeInTheDocument();
    expect(sessionStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull();
  });

  describe('Document title and landmarks (AC-11)', () => {
    it('sets HTML root language to "en"', () => {
      const store = createAppStore({ service: dummyService });
      render(
        <Provider store={store}>
          <App />
        </Provider>,
      );
      expect(document.documentElement.lang).toBe('en');
    });

    it('contains semantic header and main landmarks and demo notice aside', () => {
      const store = createAppStore({ service: dummyService });
      store.dispatch(setAccountsStatus('ready'));
      store.dispatch(setRecipientsStatus('ready'));
      render(
        <Provider store={store}>
          <App />
        </Provider>,
      );

      const headers = screen.getAllByRole('banner');
      expect(headers).toHaveLength(1);

      const mains = screen.getAllByRole('main');
      expect(mains).toHaveLength(1);

      const demoNotice = screen.getByRole('complementary', { name: 'Demo notice' });
      expect(demoNotice).toBeInTheDocument();
      expect(demoNotice.tagName.toLowerCase()).toBe('aside');
    });

    it('synchronizes document title with the active flow step', () => {
      const store = createAppStore({ service: dummyService });
      store.dispatch(setAccountsStatus('ready'));
      store.dispatch(setRecipientsStatus('ready'));

      const { rerender } = render(
        <Provider store={store}>
          <App />
        </Provider>,
      );

      // Default: form step
      expect(document.title).toBe('Northwind Pay – Send money');

      // Review step
      act(() => {
        store.dispatch(
          goToReview({
            quote: {
              quoteId: 'q-000001',
              source: { currency: 'USD', minor: 10000 },
              target: { currency: 'EUR', minor: 9200 },
              feeMinor: 200,
              rateMicro: 920000,
              expiresAtMs: 100_000,
            },
            snapshot: {
              recipientId: 'rcp-001',
              quoteId: 'q-000001',
              sourceCurrency: 'USD',
              sourceMinor: 10000,
              feeMinor: 200,
              targetCurrency: 'EUR',
              targetMinor: 9200,
            },
          }),
        );
      });
      rerender(
        <Provider store={store}>
          <App />
        </Provider>,
      );
      expect(document.title).toBe('Northwind Pay – Review');

      // Result step
      act(() => {
        store.dispatch(goToResult());
      });
      rerender(
        <Provider store={store}>
          <App />
        </Provider>,
      );
      expect(document.title).toBe('Northwind Pay – Result');

      // Returning to form
      act(() => {
        store.dispatch(goToForm());
      });
      rerender(
        <Provider store={store}>
          <App />
        </Provider>,
      );
      expect(document.title).toBe('Northwind Pay – Send money');
    });
  });
});
