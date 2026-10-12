import type { Clock } from '@satjeet2005/safe-money-ui/submit';
import type { ChaosConfigPayload } from './schemas.js';

export type ServiceDeps = Readonly<{
  clock: Clock;
  chaos: () => ChaosConfigPayload;
  ids: Readonly<{ transferId(): string; quoteId(): string }>;
  sleep: (ms: number, signal?: AbortSignal) => Promise<void>;
}>;

export type MockService = Readonly<{
  getAccounts(o?: { signal?: AbortSignal }): Promise<unknown>;
  getRecipients(o?: { signal?: AbortSignal }): Promise<unknown>;
  getQuote(
    req: { recipientId: string; sourceCurrency: string; sourceMinor: number },
    o?: { signal?: AbortSignal },
  ): Promise<unknown>;
  submitTransfer(req: unknown, o?: { signal?: AbortSignal }): Promise<unknown>;
  debug: Readonly<{
    executedCount(): number;
    balances(): Record<string, number>;
    transferIds(): string[];
  }>;
}>;

/**
 * Creates the in-browser mock service with deterministic fault injection.
 * @example const service = createMockService(deps)
 */
export function createMockService(_deps: ServiceDeps): MockService {
  // Placeholder for WP-15C
  return {
    getAccounts: async () => ({ accounts: [] }),
    getRecipients: async () => ({ recipients: [] }),
    getQuote: async () => ({}),
    submitTransfer: async () => ({}),
    debug: {
      executedCount: () => 0,
      balances: () => ({}),
      transferIds: () => [],
    },
  };
}
