import { useEffect, type JSX } from 'react';
import { useSelector } from 'react-redux';
import { AccountSummary } from './components/AccountSummary.js';
import { ChaosPanel } from './components/ChaosPanel.js';
import { TransferFlow } from './screens/TransferFlow.js';
import { COPY, UI_LABELS } from './copy.js';
import type { FlowStep } from './store/flowSlice.js';
import type { RootState } from './store/store.js';

/**
 * Top-level application shell with header, account summary, transfer flow, and activity.
 * @example
 * ```tsx
 * <App />
 * ```
 */
export function App(): JSX.Element {
  const historyEntries = useSelector((state: RootState) => state.history.entries);
  const step = useSelector((state: RootState) => state.flow.step);
  const chaos = useSelector((state: RootState) => state.chaos);

  useEffect(() => {
    document.documentElement.lang = 'en';
  }, []);

  useEffect(() => {
    const titles: Record<FlowStep, string> = {
      form: 'Northwind Pay – Send money',
      review: 'Northwind Pay – Review',
      result: 'Northwind Pay – Result',
    };
    document.title = titles[step];
  }, [step]);

  const isChaosActive =
    chaos.latencyMs > 0 ||
    chaos.hangForever ||
    chaos.lateResponseMs > 0 ||
    chaos.malformedPayload ||
    chaos.inconsistentPayload ||
    chaos.rejectWith !== 'none' ||
    chaos.loseResponse ||
    chaos.rateMoves ||
    chaos.corruptStorage;

  const activeChaosLabel = isChaosActive ? 'Faults active' : 'Normal (No faults)';

  return (
    <div className="nw-app-shell app-container">
      {/* Global Header Bar */}
      <header className="nw-header">
        <div className="nw-header-inner">
          <div className="nw-brand-cluster">
            <span className="nw-brand-mark" aria-hidden="true">
              NP
            </span>
            <h1 className="nw-brand-name">{COPY['app.title']}</h1>
            <span className="nw-brand-divider" aria-hidden="true">
              /
            </span>
            <span className="nw-brand-subtitle">Safe-submit reference transfer demo</span>
          </div>

          <aside aria-label={UI_LABELS.demoNotice} className="nw-simulation-badge-group">
            <span className="nw-sim-badge" role="note">
              [SIMULATION ONLY]
            </span>
            <span className="nw-sim-text">{COPY['app.demoBanner']}</span>
          </aside>
        </div>
      </header>

      {/* Mobile Active Chaos Indicator (Visible on < 1024px) */}
      <div className="nw-mobile-chaos-banner">
        <span className="nw-mobile-chaos-status">
          <strong>Chaos Mode:</strong> {activeChaosLabel}
        </span>
        <a href="#chaos-console" className="nw-mobile-chaos-jump">
          Configure &darr;
        </a>
      </div>

      {/* Main 2-Column Responsive Workspace */}
      <div className="nw-workspace-container">
        {/* Left Column: Primary User Task & Account Ledger (7fr) */}
        <section className="nw-col-primary">
          {/* Top 3-Currency Multi-Wallet Balance Strip */}
          <AccountSummary />

          <div className="nw-card nw-transfer-card">
            {/* Step Progress Bar */}
            <nav className="nw-step-indicator" aria-label="Transfer Progress">
              <ol className="nw-step-list">
                <li
                  className={
                    step === 'form' ? 'nw-step-item is-active' : 'nw-step-item is-complete'
                  }
                >
                  <span className="nw-step-num">1</span>
                  <span className="nw-step-label">Details</span>
                </li>
                <li
                  className={
                    step === 'review'
                      ? 'nw-step-item is-active'
                      : step === 'result'
                        ? 'nw-step-item is-complete'
                        : 'nw-step-item'
                  }
                >
                  <span className="nw-step-num">2</span>
                  <span className="nw-step-label">Review</span>
                </li>
                <li className={step === 'result' ? 'nw-step-item is-active' : 'nw-step-item'}>
                  <span className="nw-step-num">3</span>
                  <span className="nw-step-label">Result</span>
                </li>
              </ol>
            </nav>

            {/* Active Screen Container with Opacity Cross-Fade */}
            <div className="nw-step-content-viewport">
              <TransferFlow />
            </div>
          </div>

          {/* Recent Activity */}
          <section aria-label={COPY['history.heading']} className="nw-card nw-history-card">
            <h2 className="nw-section-heading">{COPY['history.heading']}</h2>
            {historyEntries.length === 0 ? (
              <p className="nw-empty-text">{COPY['history.empty']}</p>
            ) : (
              <ul className="nw-activity-list">
                {historyEntries.map((entry) => (
                  <li key={entry.id} className="nw-activity-item">
                    <span className="nw-activity-text">
                      {entry.kind === 'completed'
                        ? COPY['history.completed']
                        : COPY['history.unconfirmed']}{' '}
                      · {entry.recipientName} · {entry.amountText}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </section>

        {/* Right Column: Diagnostic Simulation Console (5fr) */}
        <aside className="nw-col-console" id="chaos-console">
          <ChaosPanel />
        </aside>
      </div>
    </div>
  );
}
