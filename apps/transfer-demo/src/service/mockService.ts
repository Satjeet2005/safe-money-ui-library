import type { Clock } from '@satjeet2005/safe-money-ui/submit';
import {
  convert,
  computeFee,
  PER_USD_MICRO,
  type CurrencyCode,
} from '@satjeet2005/safe-money-ui/money';
import { TransferRequest, type ChaosConfigPayload } from './schemas.js';
import { FIXTURES } from './fixtures.js';
import { mulDivHalfEven } from './math.js';

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

type StoredQuote = {
  quoteId: string;
  recipientId: string;
  source: { currency: string; minor: number };
  target: { currency: string; minor: number };
  feeMinor: number;
  rateMicro: number;
  expiresAtMs: number;
};

type StoredIdempotency = {
  fingerprint: string;
  response: Record<string, unknown>;
};

function copyRaw<T>(val: T): T {
  return JSON.parse(JSON.stringify(val));
}

/**
 * Creates the in-browser mock service with deterministic fault injection.
 * @example const service = createMockService(deps)
 */
export function createMockService(deps: ServiceDeps): MockService {
  const balances: Record<string, number> = {};
  for (const acc of FIXTURES.accounts) {
    balances[acc.currency] = acc.balanceMinor;
  }

  const quoteStore = new Map<string, StoredQuote>();
  const idempotencyStore = new Map<string, StoredIdempotency>();
  const deliveredKeys = new Set<string>();
  const executedTransferIds: string[] = [];
  let quoteCounter = 0;
  let executedCount = 0;

  async function maybeLatency(signal?: AbortSignal): Promise<void> {
    const c = deps.chaos();
    if (c.latencyMs > 0) {
      await deps.sleep(c.latencyMs, signal);
    }
  }

  return {
    async getAccounts(o) {
      await maybeLatency(o?.signal);
      const res: Record<string, unknown> = {
        accounts: FIXTURES.accounts.map((a) => ({
          currency: a.currency,
          balanceMinor: balances[a.currency] ?? a.balanceMinor,
        })),
      };
      if (deps.chaos().malformedPayload) {
        delete res['accounts'];
      }
      return copyRaw(res);
    },

    async getRecipients(o) {
      await maybeLatency(o?.signal);
      const res: Record<string, unknown> = {
        recipients: FIXTURES.recipients,
      };
      if (deps.chaos().malformedPayload) {
        delete res['recipients'];
      }
      return copyRaw(res);
    },

    async getQuote(req, o) {
      await maybeLatency(o?.signal);
      const recipient = FIXTURES.recipients.find((r) => r.id === req.recipientId);
      if (!recipient) {
        throw new Error('bad request');
      }

      const sourceCurrency = req.sourceCurrency as CurrencyCode;
      const targetCurrency = recipient.currency as CurrencyCode;
      if (!(sourceCurrency in PER_USD_MICRO)) {
        throw new Error('bad request');
      }

      quoteCounter += 1;
      const sourceMoney = { currency: sourceCurrency, minor: req.sourceMinor };
      const fee = computeFee(sourceMoney, targetCurrency);
      let targetMoney = convert(sourceMoney, targetCurrency);

      const c = deps.chaos();
      if (c.rateMoves && quoteCounter >= 2) {
        targetMoney = {
          currency: targetMoney.currency,
          minor: mulDivHalfEven(targetMoney.minor, 1005, 1000),
        };
      }

      let rateMicro = mulDivHalfEven(
        PER_USD_MICRO[targetCurrency] * 1_000_000,
        1,
        PER_USD_MICRO[sourceCurrency],
      );
      if (c.rateMoves && quoteCounter >= 2) {
        rateMicro = mulDivHalfEven(rateMicro, 1005, 1000);
      }

      const quoteId = deps.ids.quoteId();
      const expiresAtMs = deps.clock.now() + FIXTURES.QUOTE_TTL_MS;

      const stored: StoredQuote = {
        quoteId,
        recipientId: req.recipientId,
        source: sourceMoney,
        target: targetMoney,
        feeMinor: fee.minor,
        rateMicro,
        expiresAtMs,
      };
      quoteStore.set(quoteId, stored);

      const res: Record<string, unknown> = {
        quoteId,
        source: sourceMoney,
        target: targetMoney,
        feeMinor: fee.minor,
        rateMicro,
        expiresAtMs,
      };
      if (c.malformedPayload) {
        delete res['quoteId'];
      }
      return copyRaw(res);
    },

    async submitTransfer(req, o) {
      await maybeLatency(o?.signal);
      const c = deps.chaos();

      // 1. hangForever
      if (c.hangForever) {
        return new Promise((_resolve, reject) => {
          if (o?.signal?.aborted) {
            reject(new DOMException('This operation was aborted', 'AbortError'));
            return;
          }
          o?.signal?.addEventListener(
            'abort',
            () => reject(new DOMException('This operation was aborted', 'AbortError')),
            { once: true },
          );
        });
      }

      // 2. Validate request
      const parseResult = TransferRequest.safeParse(req);
      if (!parseResult.success) {
        throw new Error('bad request');
      }
      const validReq = parseResult.data;
      const fingerprint = `${validReq.quoteId}|${validReq.recipientId}|${validReq.sourceCurrency}|${validReq.sourceMinor}`;

      // 3. Idempotency store check
      const storedRecord = idempotencyStore.get(validReq.idempotencyKey);
      let responseToDeliver: Record<string, unknown>;

      if (storedRecord) {
        if (storedRecord.fingerprint !== fingerprint) {
          throw new Error('idempotency key reuse');
        }
        responseToDeliver = storedRecord.response;
      } else {
        // 4. Quote check
        const quote = quoteStore.get(validReq.quoteId);
        if (!quote || deps.clock.now() >= quote.expiresAtMs) {
          return copyRaw({
            error: {
              code: 'QUOTE_EXPIRED',
              message: 'The rate expired. Nothing was sent.',
            },
          });
        }

        // 5. rejectWith
        if (c.rejectWith !== 'none') {
          const messages: Record<string, string> = {
            INSUFFICIENT_FUNDS: 'Insufficient funds.',
            RECIPIENT_BLOCKED: 'Recipient blocked.',
            SERVICE_UNAVAILABLE: 'Service unavailable.',
          };
          return copyRaw({
            error: {
              code: c.rejectWith,
              message: messages[c.rejectWith] ?? 'Rejected',
            },
          });
        }

        // 6. Balance & limit check
        const currentBal = balances[validReq.sourceCurrency] ?? 0;
        const totalDebit = validReq.sourceMinor + quote.feeMinor;
        if (currentBal < totalDebit) {
          return copyRaw({
            error: {
              code: 'INSUFFICIENT_FUNDS',
              message: 'Insufficient funds.',
            },
          });
        }
        if (validReq.sourceMinor > FIXTURES.MAX_SEND_MINOR) {
          return copyRaw({
            error: {
              code: 'LIMIT_EXCEEDED',
              message: 'Limit exceeded.',
            },
          });
        }

        // 7. Execute
        balances[validReq.sourceCurrency] = currentBal - totalDebit;
        const transferId = deps.ids.transferId();
        executedTransferIds.push(transferId);
        executedCount += 1;

        const successResponse: Record<string, unknown> = {
          transferId,
          status: 'completed',
          debited: {
            currency: validReq.sourceCurrency,
            minor: totalDebit,
          },
          credited: {
            currency: quote.target.currency,
            minor: quote.target.minor,
          },
          completedAtMs: deps.clock.now(),
        };

        idempotencyStore.set(validReq.idempotencyKey, {
          fingerprint,
          response: successResponse,
        });
        responseToDeliver = successResponse;
      }

      // 8. Delivery shaping
      const isFirstDelivery = !deliveredKeys.has(validReq.idempotencyKey);
      deliveredKeys.add(validReq.idempotencyKey);

      if (c.loseResponse && isFirstDelivery) {
        throw new TypeError('Failed to fetch');
      }

      if (c.lateResponseMs > 0 && isFirstDelivery) {
        // Deliberately ignore abort signal
        await deps.sleep(c.lateResponseMs);
      }

      const delivered = copyRaw(responseToDeliver);
      if (c.malformedPayload) {
        delete delivered['transferId'];
        delivered['status'] = 'done';
      }
      if (c.inconsistentPayload && delivered['credited']) {
        const cred = delivered['credited'] as { currency: string; minor: number };
        cred.minor += 1;
      }

      return copyRaw(delivered);
    },

    debug: {
      executedCount: () => executedCount,
      balances: () => ({ ...balances }),
      transferIds: () => [...executedTransferIds],
    },
  };
}
