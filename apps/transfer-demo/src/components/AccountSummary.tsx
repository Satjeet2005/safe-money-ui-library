import type { JSX } from 'react';
import { useSelector } from 'react-redux';
import { formatMoney } from '@satjeetsingh1/safe-money-ui/money';
import type { RootState } from '../store/store.js';
import { UI_LABELS } from '../copy.js';

/**
 * Account summary section displaying available balance per account formatted in draft locale.
 * @example
 * ```tsx
 * <AccountSummary />
 * ```
 */
export function AccountSummary(): JSX.Element {
  const accounts = useSelector((state: RootState) => state.data.accounts);
  const locale = useSelector((state: RootState) => state.draft.locale);

  return (
    <section
      aria-label={UI_LABELS.accountSummary}
      className="account-summary nw-card nw-account-card nw-balance-bar nw-account-balances"
    >
      {accounts?.map((acc) => (
        <div key={acc.currency} className="nw-balance-item nw-account-balance nw-tabular">
          {acc.currency} ·{' '}
          {formatMoney({ currency: acc.currency, minor: acc.balanceMinor }, { locale })}
        </div>
      ))}
    </section>
  );
}
