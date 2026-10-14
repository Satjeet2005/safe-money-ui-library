import { render, screen, fireEvent, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { axe } from 'jest-axe';
import { createAppStore } from '../store/store.js';
import { setChaos, togglePanel } from '../store/chaosSlice.js';
import { setAmountText, setSourceCurrency, setLocale } from '../store/draftSlice.js';
import { ChaosPanel } from './ChaosPanel.js';
import { COPY } from '../copy.js';
import { DEFAULT_CHAOS_CONFIG } from '../service/chaos.js';

describe('ChaosPanel component (WP-22)', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
    jest.restoreAllMocks();
  });

  describe('Panel structure, toggle and accessibility', () => {
    it('renders Chaos mode toggle button initially closed with aria-expanded="false" and aria-controls="chaos-panel"', () => {
      const store = createAppStore();
      render(
        <Provider store={store}>
          <ChaosPanel />
        </Provider>,
      );

      const toggleBtn = screen.getByRole('button', { name: COPY['chaos.heading'] });
      expect(toggleBtn).toBeInTheDocument();
      expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');
      expect(toggleBtn).toHaveAttribute('aria-controls', 'chaos-panel');
      expect(screen.queryByRole('region', { name: COPY['chaos.heading'] })).not.toBeInTheDocument();
      expect(screen.queryByText(COPY['chaos.helper'])).not.toBeInTheDocument();
    });

    it('clicking toggle opens panel, updates aria-expanded to "true", and renders section with heading and helper', () => {
      const store = createAppStore();
      render(
        <Provider store={store}>
          <ChaosPanel />
        </Provider>,
      );

      const toggleBtn = screen.getByRole('button', { name: COPY['chaos.heading'] });
      fireEvent.click(toggleBtn);

      expect(toggleBtn).toHaveAttribute('aria-expanded', 'true');
      const section = document.getElementById('chaos-panel');
      expect(section).toBeInTheDocument();
      expect(section).toHaveAttribute('aria-labelledby', 'chaos-heading');
      expect(screen.getByRole('heading', { level: 2, name: COPY['chaos.heading'] })).toHaveAttribute(
        'id',
        'chaos-heading',
      );
      expect(screen.getByText(COPY['chaos.helper'])).toBeInTheDocument();
    });

    it('clicking toggle again closes the panel and updates aria-expanded to "false"', () => {
      const store = createAppStore();
      render(
        <Provider store={store}>
          <ChaosPanel />
        </Provider>,
      );

      const toggleBtn = screen.getByRole('button', { name: COPY['chaos.heading'] });
      fireEvent.click(toggleBtn);
      expect(toggleBtn).toHaveAttribute('aria-expanded', 'true');

      fireEvent.click(toggleBtn);
      expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');
      expect(document.getElementById('chaos-panel')).not.toBeInTheDocument();
    });
  });

  describe('Presets', () => {
    function renderOpenPanel() {
      const store = createAppStore();
      store.dispatch(togglePanel());
      render(
        <Provider store={store}>
          <ChaosPanel />
        </Provider>,
      );
      return store;
    }

    it('Slow network preset resets configuration to defaults and sets latencyMs: 3000', () => {
      const store = renderOpenPanel();
      // Set some dirty settings first
      store.dispatch(setChaos({ hangForever: true, rejectWith: 'INSUFFICIENT_FUNDS' }));

      fireEvent.click(screen.getByRole('button', { name: 'Slow network' }));

      const chaos = store.getState().chaos;
      expect(chaos.latencyMs).toBe(3000);
      expect(chaos.hangForever).toBe(false);
      expect(chaos.rejectWith).toBe('none');
    });

    it('Timeout then recover preset resets configuration to defaults and sets hangForever: true', () => {
      const store = renderOpenPanel();
      store.dispatch(setChaos({ latencyMs: 3000, rateMoves: true }));

      fireEvent.click(screen.getByRole('button', { name: 'Timeout then recover' }));

      const chaos = store.getState().chaos;
      expect(chaos.hangForever).toBe(true);
      expect(chaos.latencyMs).toBe(0);
      expect(chaos.rateMoves).toBe(false);
    });

    it('Lost response preset resets configuration to defaults and sets loseResponse: true', () => {
      const store = renderOpenPanel();
      store.dispatch(setChaos({ malformedPayload: true }));

      fireEvent.click(screen.getByRole('button', { name: 'Lost response' }));

      const chaos = store.getState().chaos;
      expect(chaos.loseResponse).toBe(true);
      expect(chaos.malformedPayload).toBe(false);
    });

    it('Bad payload preset resets configuration to defaults and sets malformedPayload: true', () => {
      const store = renderOpenPanel();
      store.dispatch(setChaos({ lateResponseMs: 15000 }));

      fireEvent.click(screen.getByRole('button', { name: 'Bad payload' }));

      const chaos = store.getState().chaos;
      expect(chaos.malformedPayload).toBe(true);
      expect(chaos.lateResponseMs).toBe(0);
    });

    it('preset does not leak settings from previous preset', () => {
      const store = renderOpenPanel();
      fireEvent.click(screen.getByRole('button', { name: 'Slow network' }));
      expect(store.getState().chaos.latencyMs).toBe(3000);

      fireEvent.click(screen.getByRole('button', { name: 'Lost response' }));
      expect(store.getState().chaos.latencyMs).toBe(0);
      expect(store.getState().chaos.loseResponse).toBe(true);
    });
  });

  describe('Latency radio group', () => {
    it('renders radio options and changes latencyMs', () => {
      const store = createAppStore();
      store.dispatch(togglePanel());
      render(
        <Provider store={store}>
          <ChaosPanel />
        </Provider>,
      );

      const noneRadio = screen.getByRole('radio', { name: 'None' });
      const r500 = screen.getByRole('radio', { name: '500 ms' });
      const r3s = screen.getByRole('radio', { name: '3 s' });

      expect(noneRadio).toBeChecked();
      expect(r500).not.toBeChecked();
      expect(r3s).not.toBeChecked();

      fireEvent.click(r500);
      expect(store.getState().chaos.latencyMs).toBe(500);
      expect(r500).toBeChecked();

      fireEvent.click(r3s);
      expect(store.getState().chaos.latencyMs).toBe(3000);
      expect(r3s).toBeChecked();

      fireEvent.click(noneRadio);
      expect(store.getState().chaos.latencyMs).toBe(0);
      expect(noneRadio).toBeChecked();
    });
  });

  describe('Server rejection radio group', () => {
    it('renders rejection options and changes rejectWith', () => {
      const store = createAppStore();
      store.dispatch(togglePanel());
      render(
        <Provider store={store}>
          <ChaosPanel />
        </Provider>,
      );

      const rNone = screen.getByRole('radio', { name: 'None' });
      const rFunds = screen.getByRole('radio', { name: 'Insufficient funds' });
      const rBlocked = screen.getByRole('radio', { name: 'Recipient blocked' });
      const rUnavailable = screen.getByRole('radio', { name: 'Service unavailable' });

      expect(rNone).toBeChecked();

      fireEvent.click(rFunds);
      expect(store.getState().chaos.rejectWith).toBe('INSUFFICIENT_FUNDS');
      expect(rFunds).toBeChecked();

      fireEvent.click(rBlocked);
      expect(store.getState().chaos.rejectWith).toBe('RECIPIENT_BLOCKED');
      expect(rBlocked).toBeChecked();

      fireEvent.click(rUnavailable);
      expect(store.getState().chaos.rejectWith).toBe('SERVICE_UNAVAILABLE');
      expect(rUnavailable).toBeChecked();

      fireEvent.click(rNone);
      expect(store.getState().chaos.rejectWith).toBe('none');
      expect(rNone).toBeChecked();
    });
  });

  describe('Boolean checkboxes', () => {
    it('toggles Requests hang (never respond)', () => {
      const store = createAppStore();
      store.dispatch(togglePanel());
      render(
        <Provider store={store}>
          <ChaosPanel />
        </Provider>,
      );

      const cb = screen.getByRole('checkbox', { name: 'Requests hang (never respond)' });
      expect(cb).not.toBeChecked();

      fireEvent.click(cb);
      expect(store.getState().chaos.hangForever).toBe(true);
      expect(cb).toBeChecked();

      fireEvent.click(cb);
      expect(store.getState().chaos.hangForever).toBe(false);
      expect(cb).not.toBeChecked();
    });

    it('toggles Response arrives after the timeout (first attempt only) between 15000 and 0', () => {
      const store = createAppStore();
      store.dispatch(togglePanel());
      render(
        <Provider store={store}>
          <ChaosPanel />
        </Provider>,
      );

      const cb = screen.getByRole('checkbox', {
        name: 'Response arrives after the timeout (first attempt only)',
      });
      expect(cb).not.toBeChecked();

      fireEvent.click(cb);
      expect(store.getState().chaos.lateResponseMs).toBe(15000);
      expect(cb).toBeChecked();

      fireEvent.click(cb);
      expect(store.getState().chaos.lateResponseMs).toBe(0);
      expect(cb).not.toBeChecked();
    });

    it('toggles Malformed response (every call)', () => {
      const store = createAppStore();
      store.dispatch(togglePanel());
      render(
        <Provider store={store}>
          <ChaosPanel />
        </Provider>,
      );

      const cb = screen.getByRole('checkbox', { name: 'Malformed response (every call)' });
      fireEvent.click(cb);
      expect(store.getState().chaos.malformedPayload).toBe(true);
      fireEvent.click(cb);
      expect(store.getState().chaos.malformedPayload).toBe(false);
    });

    it('toggles Valid response with wrong amounts', () => {
      const store = createAppStore();
      store.dispatch(togglePanel());
      render(
        <Provider store={store}>
          <ChaosPanel />
        </Provider>,
      );

      const cb = screen.getByRole('checkbox', { name: 'Valid response with wrong amounts' });
      fireEvent.click(cb);
      expect(store.getState().chaos.inconsistentPayload).toBe(true);
      fireEvent.click(cb);
      expect(store.getState().chaos.inconsistentPayload).toBe(false);
    });

    it('toggles Lose the response after the server completes (first attempt only)', () => {
      const store = createAppStore();
      store.dispatch(togglePanel());
      render(
        <Provider store={store}>
          <ChaosPanel />
        </Provider>,
      );

      const cb = screen.getByRole('checkbox', {
        name: 'Lose the response after the server completes (first attempt only)',
      });
      fireEvent.click(cb);
      expect(store.getState().chaos.loseResponse).toBe(true);
      fireEvent.click(cb);
      expect(store.getState().chaos.loseResponse).toBe(false);
    });

    it('toggles Rate moves on the next quote (+0.5%)', () => {
      const store = createAppStore();
      store.dispatch(togglePanel());
      render(
        <Provider store={store}>
          <ChaosPanel />
        </Provider>,
      );

      const cb = screen.getByRole('checkbox', { name: 'Rate moves on the next quote (+0.5%)' });
      fireEvent.click(cb);
      expect(store.getState().chaos.rateMoves).toBe(true);
      fireEvent.click(cb);
      expect(store.getState().chaos.rateMoves).toBe(false);
    });

    it('toggles Corrupt the saved draft and immediately writes to sessionStorage', () => {
      const store = createAppStore();
      store.dispatch(togglePanel());
      render(
        <Provider store={store}>
          <ChaosPanel />
        </Provider>,
      );

      const cb = screen.getByRole('checkbox', {
        name: 'Corrupt the saved draft (reload to see recovery)',
      });
      expect(sessionStorage.getItem('smu.draft.v1')).toBeNull();

      fireEvent.click(cb);
      expect(store.getState().chaos.corruptStorage).toBe(true);
      expect(sessionStorage.getItem('smu.draft.v1')).toBe('{"version":2,"junk":true}');

      fireEvent.click(cb);
      expect(store.getState().chaos.corruptStorage).toBe(false);
    });
  });

  describe('Action buttons', () => {
    it('Simulate edit from another tab increases amount by one whole unit and re-formats', () => {
      const store = createAppStore();
      store.dispatch(togglePanel());
      store.dispatch(setSourceCurrency('USD'));
      store.dispatch(setLocale('en-US'));
      store.dispatch(setAmountText('100.00'));

      render(
        <Provider store={store}>
          <ChaosPanel />
        </Provider>,
      );

      fireEvent.click(screen.getByRole('button', { name: 'Simulate edit from another tab' }));
      expect(store.getState().draft.amountText).toBe('101.00');

      // Click again -> 102.00
      fireEvent.click(screen.getByRole('button', { name: 'Simulate edit from another tab' }));
      expect(store.getState().draft.amountText).toBe('102.00');
    });

    it('Simulate edit from another tab works when draft amount is empty', () => {
      const store = createAppStore();
      store.dispatch(togglePanel());
      store.dispatch(setSourceCurrency('USD'));
      store.dispatch(setLocale('en-US'));
      store.dispatch(setAmountText(''));

      render(
        <Provider store={store}>
          <ChaosPanel />
        </Provider>,
      );

      fireEvent.click(screen.getByRole('button', { name: 'Simulate edit from another tab' }));
      expect(store.getState().draft.amountText).toBe('1.00');
    });

    it('Simulate edit from another tab formats according to active currency and locale', () => {
      const store = createAppStore();
      store.dispatch(togglePanel());
      store.dispatch(setSourceCurrency('EUR'));
      store.dispatch(setLocale('de-DE'));
      store.dispatch(setAmountText('50,50'));

      render(
        <Provider store={store}>
          <ChaosPanel />
        </Provider>,
      );

      fireEvent.click(screen.getByRole('button', { name: 'Simulate edit from another tab' }));
      expect(store.getState().draft.amountText).toBe('51,50');
    });

    it('Double-click Confirm calls document.getElementById("confirm-button") click twice synchronously', () => {
      const store = createAppStore();
      store.dispatch(togglePanel());

      const mockClick = jest.fn();
      const fakeBtn = document.createElement('button');
      fakeBtn.id = 'confirm-button';
      fakeBtn.addEventListener('click', mockClick);
      document.body.appendChild(fakeBtn);

      try {
        render(
          <Provider store={store}>
            <ChaosPanel />
          </Provider>,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Double-click Confirm' }));
        expect(mockClick).toHaveBeenCalledTimes(2);
      } finally {
        document.body.removeChild(fakeBtn);
      }
    });

    it('Double-click Confirm is a no-op when confirm-button is absent', () => {
      const store = createAppStore();
      store.dispatch(togglePanel());

      render(
        <Provider store={store}>
          <ChaosPanel />
        </Provider>,
      );

      expect(() => {
        fireEvent.click(screen.getByRole('button', { name: 'Double-click Confirm' }));
      }).not.toThrow();
    });

    it('Reset chaos restores configuration to documented defaults', () => {
      const store = createAppStore();
      store.dispatch(togglePanel());
      store.dispatch(
        setChaos({
          latencyMs: 3000,
          hangForever: true,
          rejectWith: 'SERVICE_UNAVAILABLE',
          malformedPayload: true,
        }),
      );

      render(
        <Provider store={store}>
          <ChaosPanel />
        </Provider>,
      );

      fireEvent.click(screen.getByRole('button', { name: 'Reset chaos' }));
      expect(store.getState().chaos).toMatchObject(DEFAULT_CHAOS_CONFIG);
    });

    it('Copy link writes encoded URL to clipboard when clipboard is available', async () => {
      const store = createAppStore();
      store.dispatch(togglePanel());
      store.dispatch(setChaos({ latencyMs: 500, hangForever: true }));

      const writeTextMock = jest.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: writeTextMock,
        },
      });

      render(
        <Provider store={store}>
          <ChaosPanel />
        </Provider>,
      );

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Copy link to this chaos setup' }));
      });

      expect(writeTextMock).toHaveBeenCalledTimes(1);
      const urlWritten = writeTextMock.mock.calls[0][0] as string;
      expect(urlWritten).toContain('?chaos=');
      const paramVal = new URL(urlWritten).searchParams.get('chaos');
      expect(paramVal).not.toBeNull();
      const parsedConfig = JSON.parse(decodeURIComponent(paramVal!));
      expect(parsedConfig.latencyMs).toBe(500);
      expect(parsedConfig.hangForever).toBe(true);
    });

    it('Copy link handles clipboard write failure gracefully without reporting success', async () => {
      const store = createAppStore();
      store.dispatch(togglePanel());

      const writeTextMock = jest.fn().mockRejectedValue(new Error('Clipboard denied'));
      Object.assign(navigator, {
        clipboard: {
          writeText: writeTextMock,
        },
      });

      render(
        <Provider store={store}>
          <ChaosPanel />
        </Provider>,
      );

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Copy link to this chaos setup' }));
      });

      expect(writeTextMock).toHaveBeenCalledTimes(1);
      expect(screen.queryByText('Copied!')).not.toBeInTheDocument();
    });

    it('Copy link handles unsupported clipboard gracefully without crashing', () => {
      const store = createAppStore();
      store.dispatch(togglePanel());

      // Remove clipboard
      // @ts-expect-error test-only clipboard removal
      delete navigator.clipboard;

      render(
        <Provider store={store}>
          <ChaosPanel />
        </Provider>,
      );

      expect(() => {
        fireEvent.click(screen.getByRole('button', { name: 'Copy link to this chaos setup' }));
      }).not.toThrow();
    });
  });

  describe('A11Y-10: Automated Accessibility', () => {
    it('A11Y-10: Chaos panel expanded has zero axe violations', async () => {
      const store = createAppStore();
      store.dispatch(togglePanel());

      const { container } = render(
        <Provider store={store}>
          <ChaosPanel />
        </Provider>,
      );

      // Disable color-contrast in jsdom as specified by PRD §15.2 (jsdom has no layout/rendering engine)
      const results = await axe(container, {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
        },
        rules: {
          'color-contrast': { enabled: false },
        },
      });

      expect(results).toHaveNoViolations();
    });
  });
});
