import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { axe } from 'jest-axe';
import { Provider } from 'react-redux';
import { createAppStore } from '../store/store.js';
import { setAccounts, setRecipients } from '../store/dataSlice.js';
import { SendForm } from './SendForm.js';
import type { MockService } from '../service/mockService.js';

describe('SendForm (FORM-01..FORM-06)', () => {
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
    { currency: 'GBP' as const, balanceMinor: 300000 },
  ];

  const defaultRecipients = [
    {
      id: 'rcp-001',
      name: 'Elena Rostova',
      country: 'DE',
      currency: 'EUR' as const,
      accountHint: '****1234',
    },
    {
      id: 'rcp-002',
      name: 'Carlos Silva',
      country: 'GB',
      currency: 'GBP' as const,
      accountHint: '****5678',
    },
  ];

  function setup(initialProps?: { recipientId?: string | null; amountText?: string }) {
    const store = createAppStore({ service: dummyService });
    store.dispatch(setAccounts(defaultAccounts));
    store.dispatch(setRecipients(defaultRecipients));

    if (initialProps?.recipientId) {
      store.dispatch({ type: 'draft/setRecipient', payload: initialProps.recipientId });
    }
    if (initialProps?.amountText !== undefined) {
      store.dispatch({ type: 'draft/setAmountText', payload: initialProps.amountText });
    }

    const utils = render(
      <Provider store={store}>
        <SendForm />
      </Provider>,
    );

    return { ...utils, store };
  }

  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
  });

  it('FORM-01: missing recipient blocks review, does not fetch quote, and shows error in summary and field', async () => {
    const { store } = setup({ recipientId: null, amountText: '50.00' });

    const reviewButton = screen.getByRole('button', { name: 'Review transfer' });
    fireEvent.click(reviewButton);

    expect(store.getState().flow.step).toBe('form');
    expect(getQuoteMock).not.toHaveBeenCalled();

    const recipientSelect = screen.getByLabelText('Recipient');
    expect(recipientSelect).toHaveAttribute('aria-invalid', 'true');
    expect(recipientSelect).toHaveAttribute('aria-describedby', 'recipient-error');

    const fieldError = document.getElementById('recipient-error');
    expect(fieldError).not.toBeNull();
    expect(fieldError).toHaveTextContent('Choose a recipient.');

    const summary = screen.getByRole('alert');
    expect(summary).toBeInTheDocument();
    expect(summary).toHaveAttribute('id', 'error-summary');
    expect(summary).toHaveTextContent('Fix 1 problem to continue');

    const link = screen.getByRole('link', { name: 'Choose a recipient.' });
    expect(link).toHaveAttribute('href', '#recipient');
  });

  it('FORM-02: invalid amount blocks review, does not fetch quote, and shows amount error in summary and field', async () => {
    const { store } = setup({ recipientId: 'rcp-001', amountText: 'invalid-amount' });

    const reviewButton = screen.getByRole('button', { name: 'Review transfer' });
    fireEvent.click(reviewButton);

    expect(store.getState().flow.step).toBe('form');
    expect(getQuoteMock).not.toHaveBeenCalled();

    const summary = screen.getByRole('alert');
    expect(summary).toBeInTheDocument();
    expect(summary).toHaveTextContent('Fix 1 problem to continue');

    const link = screen.getByRole('link', {
      name: 'Use digits only. Choose the currency separately.',
    });
    expect(link).toHaveAttribute('href', '#amount');
  });

  it('FORM-03: both recipient and amount invalid shows both errors in specified form-field order', async () => {
    const { store } = setup({ recipientId: null, amountText: '' });

    const reviewButton = screen.getByRole('button', { name: 'Review transfer' });
    fireEvent.click(reviewButton);

    expect(store.getState().flow.step).toBe('form');
    expect(getQuoteMock).not.toHaveBeenCalled();

    const summary = screen.getByRole('alert');
    expect(summary).toBeInTheDocument();
    expect(summary).toHaveTextContent('Fix 2 problems to continue');

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute('href', '#recipient');
    expect(links[0]).toHaveTextContent('Choose a recipient.');
    expect(links[1]).toHaveAttribute('href', '#amount');
    expect(links[1]).toHaveTextContent('Enter an amount.');
  });

  it('FORM-04: summary title uses exact copy-table wording for singular and plural errors', async () => {
    // 1 error case
    setup({ recipientId: 'rcp-001', amountText: '' });
    fireEvent.click(screen.getByRole('button', { name: 'Review transfer' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Fix 1 problem to continue');

    cleanup();
    sessionStorage.clear();

    // 2 errors case
    setup({ recipientId: null, amountText: '' });
    fireEvent.click(screen.getByRole('button', { name: 'Review transfer' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Fix 2 problems to continue');
  });

  it('FORM-05: insufficient funds including fee rejects transfer without requesting quote', async () => {
    // Account USD balance: 500,000 minor ($5,000.00)
    // Recipient: Elena Rostova (EUR) -> cross currency fee is 1.5% with 100 minor min.
    // Amount: 5000.00 (500,000 minor).
    // Fee = 500,000 * 150 / 10,000 = 7,500 minor ($75.00).
    // Total = 507,500 minor > 500,000 minor balance.
    const { store } = setup({ recipientId: 'rcp-001', amountText: '5000.00' });

    const reviewButton = screen.getByRole('button', { name: 'Review transfer' });
    fireEvent.click(reviewButton);

    expect(store.getState().flow.step).toBe('form');
    expect(getQuoteMock).not.toHaveBeenCalled();

    const summary = screen.getByRole('alert');
    expect(summary).toBeInTheDocument();
    expect(summary).toHaveTextContent('Fix 1 problem to continue');
    expect(summary).toHaveTextContent('Not enough funds. Available: $5,000.00.');
  });

  it('FORM-06: insufficient funds error formats available balance in source-account currency and current locale', async () => {
    // Source account USD, draft locale en-US, balance $5,000.00
    // Recipient currency EUR.
    setup({ recipientId: 'rcp-001', amountText: '5000.00' });

    fireEvent.click(screen.getByRole('button', { name: 'Review transfer' }));

    const summary = screen.getByRole('alert');
    // Must contain USD $5,000.00 and must not use EUR symbol or recipient currency
    expect(summary).toHaveTextContent('Available: $5,000.00.');
    expect(summary.textContent).not.toContain('€');
  });

  describe('A11Y-01 and A11Y-02: SendForm accessibility', () => {
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

    it('A11Y-01: SendForm, loaded, empty has zero axe violations', async () => {
      const { container } = setup();
      const results = await axe(container, AXE_OPTIONS);
      expect(results).toHaveNoViolations();
    });

    it('A11Y-02: SendForm after a failed review attempt has zero axe violations', async () => {
      const { container } = setup();
      const reviewButton = screen.getByRole('button', { name: 'Review transfer' });
      fireEvent.click(reviewButton);
      const results = await axe(container, AXE_OPTIONS);
      expect(results).toHaveNoViolations();
    });
  });
});
