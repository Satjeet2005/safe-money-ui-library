import type { JSX } from 'react';
import { useSelector } from 'react-redux';
import { formatMoney } from '@satjeet2005/safe-money-ui/money';
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
    <section aria-label={UI_LABELS.accountSummary} className="account-summary">
      {accounts?.map((acc) => (
        <div key={acc.currency}>
          {acc.currency} ·{' '}
          {formatMoney({ currency: acc.currency, minor: acc.balanceMinor }, { locale })}
        </div>
      ))}
    </section>
  );
}
