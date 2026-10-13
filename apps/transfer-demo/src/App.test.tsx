import { render, screen, fireEvent, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createAppStore } from './store/store.js';
import { setAccounts, setAccountsStatus, setRecipientsStatus } from './store/dataSlice.js';
import { addEntry } from './store/historySlice.js';
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
});
