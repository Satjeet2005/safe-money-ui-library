import type { JSX } from 'react';

export function AccountSummary(): JSX.Element {
  return (
    <section aria-label="Account Summary" className="account-summary">
      <div>USD · $5,000.00</div>
    </section>
  );
}
