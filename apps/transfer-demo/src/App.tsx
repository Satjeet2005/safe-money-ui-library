import type { JSX } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { AccountSummary } from './components/AccountSummary.js';
import { ChaosPanel } from './components/ChaosPanel.js';
import { TransferFlow } from './screens/TransferFlow.js';
import { COPY, UI_LABELS } from './copy.js';
import type { RootState, AppDispatch } from './store/store.js';
import { togglePanel } from './store/chaosSlice.js';

/**
 * Top-level application shell with header, account summary, transfer flow, and activity.
 * @example
 * ```tsx
 * <App />
 * ```
 */
export function App(): JSX.Element {
  const dispatch = useDispatch<AppDispatch>();
  const historyEntries = useSelector((state: RootState) => state.history.entries);
  const chaosPanelOpen = useSelector((state: RootState) => state.chaos.panelOpen);

  return (
    <div className="app-container">
      <header>
        <h1>{COPY['app.title']}</h1>
        <aside aria-label={UI_LABELS.demoNotice}>
          <p>{COPY['app.demoBanner']}</p>
        </aside>
      </header>

      <AccountSummary />

      <TransferFlow />

      <section aria-label={COPY['history.heading']}>
        <h2>{COPY['history.heading']}</h2>
        {historyEntries.length === 0 ? (
          <p>{COPY['history.empty']}</p>
        ) : (
          <ul>
            {historyEntries.map((entry) => (
              <li key={entry.id}>
                {entry.kind === 'completed'
                  ? COPY['history.completed']
                  : COPY['history.unconfirmed']}{' '}
                · {entry.recipientName} · {entry.amountText}
              </li>
            ))}
          </ul>
        )}
      </section>

      <button type="button" onClick={() => dispatch(togglePanel())} className="chaos-toggle-button">
        {UI_LABELS.chaosButton}
      </button>

      {chaosPanelOpen && <ChaosPanel />}
    </div>
  );
}
