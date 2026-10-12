import type { JSX } from 'react';
import { AccountSummary } from './components/AccountSummary.js';
import { ChaosPanel } from './components/ChaosPanel.js';
import { TransferFlow } from './screens/TransferFlow.js';
import { COPY } from './copy.js';

export function App(): JSX.Element {
  return (
    <div className="app-container">
      <header>
        <h1>{COPY['app.title']}</h1>
        <aside aria-label="Demo notice">
          <p>{COPY['app.demoBanner']}</p>
        </aside>
      </header>

      <AccountSummary />

      <TransferFlow />

      <section aria-label="Recent activity">
        <h2>{COPY['history.heading']}</h2>
        <p>{COPY['history.empty']}</p>
      </section>

      <ChaosPanel />
    </div>
  );
}
