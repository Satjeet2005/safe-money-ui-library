import { createMockService } from '../../src/service/mockService.js';
import type { ChaosConfigPayload } from '../../src/service/schemas.js';
import { createIdGenerator } from '../../src/service/ids.js';

type MockQuote = {
  quoteId: string;
  source: { currency: string; minor: number };
  target: { currency: string; minor: number };
  feeMinor: number;
  rateMicro: number;
  expiresAtMs: number;
};

type MockTransfer = {
  transferId?: string;
  status: string;
  debited?: { currency: string; minor: number };
  credited?: { currency: string; minor: number };
  completedAtMs?: number;
};

type MockRejection = {
  error: {
    code: string;
    message: string;
  };
};

type MockAccounts = {
  accounts?: Array<{ currency: string; balanceMinor: number }>;
};

describe('WP-15C: Simulated Service (SV-01..SV-12)', () => {
  const defaultChaos: ChaosConfigPayload = {
    latencyMs: 0,
    hangForever: false,
    lateResponseMs: 0,
    malformedPayload: false,
    inconsistentPayload: false,
    rejectWith: 'none',
    loseResponse: false,
    rateMoves: false,
    corruptStorage: false,
  };

  function setupService(chaosOverride: Partial<ChaosConfigPayload> = {}, initialTime = 1_000_000) {
    let currentTime = initialTime;
    let chaosState: ChaosConfigPayload = { ...defaultChaos, ...chaosOverride };
    const ids = createIdGenerator(true);

    const clock = {
      now: () => currentTime,
      advance: (ms: number) => {
        currentTime += ms;
      },
    };

    const sleepCalls: { ms: number }[] = [];
    const sleep = (ms: number, signal?: AbortSignal) => {
      sleepCalls.push({ ms });
      if (signal?.aborted) {
        return Promise.reject(new DOMException('This operation was aborted', 'AbortError'));
      }
      return new Promise<void>((resolve, reject) => {
        const onAbort = () => {
          clearTimeout(timer);
          reject(new DOMException('This operation was aborted', 'AbortError'));
        };
        const timer = setTimeout(() => {
          signal?.removeEventListener('abort', onAbort);
          resolve();
        }, ms);
        signal?.addEventListener('abort', onAbort, { once: true });
      });
    };

    const service = createMockService({
      clock: { now: () => clock.now() },
      chaos: () => chaosState,
      ids,
      sleep,
    });

    return {
      service,
      clock,
      setChaos: (c: Partial<ChaosConfigPayload>) => {
        chaosState = { ...chaosState, ...c };
      },
      sleepCalls,
    };
  }

  // SV-01: Quote math
  test('SV-01: Quote math calculates fee, target amount, rateMicro and stores record', async () => {
    const { service } = setupService();
    // 100 USD to Mateo (EUR). 100.00 USD = 10,000 minor units.
    // Fee = 1% with 100 min = 100 minor.
    // Conversion: 10,000 USD -> EUR at 920,000 micro = 9,200 EUR.
    const rawQuote = (await service.getQuote({
      recipientId: 'rcp-001',
      sourceCurrency: 'USD',
      sourceMinor: 10000,
    })) as MockQuote;

    expect(rawQuote.quoteId).toBe('q-000001');
    expect(rawQuote.source).toEqual({ currency: 'USD', minor: 10000 });
    expect(rawQuote.target).toEqual({ currency: 'EUR', minor: 9200 });
    expect(rawQuote.feeMinor).toBe(100);
    expect(rawQuote.rateMicro).toBe(920000);
    expect(rawQuote.expiresAtMs).toBe(1_000_000 + 30_000);
  });

  // SV-02: Quote expiry
  test('SV-02: Expired quote returns QUOTE_EXPIRED rejection body', async () => {
    const { service, clock } = setupService();
    const rawQuote = (await service.getQuote({
      recipientId: 'rcp-001',
      sourceCurrency: 'USD',
      sourceMinor: 10000,
    })) as MockQuote;

    // Advance clock past expiration
    clock.advance(30_001);

    const result = (await service.submitTransfer({
      idempotencyKey: 'idem-test-01',
      quoteId: rawQuote.quoteId,
      recipientId: 'rcp-001',
      sourceCurrency: 'USD',
      sourceMinor: 10000,
    })) as MockRejection;

    expect(result).toEqual({
      error: {
        code: 'QUOTE_EXPIRED',
        message: 'The rate expired. Nothing was sent.',
      },
    });
  });

  // SV-03: Replay returns the same transferId and executedCount stays 1
  test('SV-03: Replay with same key and fingerprint returns same transferId without increasing executedCount', async () => {
    const { service } = setupService();
    const rawQuote = (await service.getQuote({
      recipientId: 'rcp-001',
      sourceCurrency: 'USD',
      sourceMinor: 10000,
    })) as MockQuote;

    const req = {
      idempotencyKey: 'idem-test-replay',
      quoteId: rawQuote.quoteId,
      recipientId: 'rcp-001',
      sourceCurrency: 'USD',
      sourceMinor: 10000,
    };

    const first = (await service.submitTransfer(req)) as MockTransfer;
    expect(first.status).toBe('completed');
    expect(first.transferId).toBe('TRF-000001');
    expect(service.debug.executedCount()).toBe(1);

    const replay = (await service.submitTransfer(req)) as MockTransfer;
    expect(replay.status).toBe('completed');
    expect(replay.transferId).toBe('TRF-000001');
    expect(service.debug.executedCount()).toBe(1);
  });

  // SV-04: Idempotency key fingerprint mismatch throws
  test('SV-04: Reusing idempotency key with different fingerprint throws Error', async () => {
    const { service } = setupService();
    const q1 = (await service.getQuote({
      recipientId: 'rcp-001',
      sourceCurrency: 'USD',
      sourceMinor: 10000,
    })) as MockQuote;

    await service.submitTransfer({
      idempotencyKey: 'idem-clash',
      quoteId: q1.quoteId,
      recipientId: 'rcp-001',
      sourceCurrency: 'USD',
      sourceMinor: 10000,
    });

    // Attempt second submission with different amount using same idempotency key
    await expect(
      service.submitTransfer({
        idempotencyKey: 'idem-clash',
        quoteId: q1.quoteId,
        recipientId: 'rcp-001',
        sourceCurrency: 'USD',
        sourceMinor: 20000, // fingerprint mismatch
      }),
    ).rejects.toThrow('idempotency key reuse');
  });

  // SV-05: Every configured rejectWith value returns its specified rejection body
  test('SV-05: Every configured rejectWith returns its matching rejection body and performs no debit', async () => {
    const codes = [
      { code: 'INSUFFICIENT_FUNDS' as const, msg: 'Insufficient funds.' },
      { code: 'RECIPIENT_BLOCKED' as const, msg: 'Recipient blocked.' },
      { code: 'SERVICE_UNAVAILABLE' as const, msg: 'Service unavailable.' },
    ];

    for (const { code, msg } of codes) {
      const { service } = setupService({ rejectWith: code });
      const q = (await service.getQuote({
        recipientId: 'rcp-001',
        sourceCurrency: 'USD',
        sourceMinor: 10000,
      })) as MockQuote;

      const result = (await service.submitTransfer({
        idempotencyKey: `idem-${code}`,
        quoteId: q.quoteId,
        recipientId: 'rcp-001',
        sourceCurrency: 'USD',
        sourceMinor: 10000,
      })) as MockRejection;

      expect(result).toEqual({
        error: { code, message: msg },
      });
      expect(service.debug.executedCount()).toBe(0);
      expect(service.debug.balances()['USD']).toBe(500_000);
    }
  });

  // SV-06: 5 calls with same idempotency key debit balance and execute transfer exactly once
  test('SV-06: Five calls with the same idempotency key debit balance and execute transfer exactly once', async () => {
    const { service } = setupService();
    const q = (await service.getQuote({
      recipientId: 'rcp-001',
      sourceCurrency: 'USD',
      sourceMinor: 10000,
    })) as MockQuote;

    const req = {
      idempotencyKey: 'idem-five-calls',
      quoteId: q.quoteId,
      recipientId: 'rcp-001',
      sourceCurrency: 'USD',
      sourceMinor: 10000,
    };

    for (let i = 0; i < 5; i++) {
      const resp = (await service.submitTransfer(req)) as MockTransfer;
      expect(resp.transferId).toBe('TRF-000001');
    }

    expect(service.debug.executedCount()).toBe(1);
    // 500,000 - 10,000 (source) - 100 (fee) = 489,900
    expect(service.debug.balances()['USD']).toBe(489_900);
  });

  // SV-07: First lost-response delivery rejects; next delivery returns the same transfer ID
  test('SV-07: First lost-response delivery rejects after debit; retry returns same transfer ID without second debit', async () => {
    const { service } = setupService({ loseResponse: true });
    const q = (await service.getQuote({
      recipientId: 'rcp-001',
      sourceCurrency: 'USD',
      sourceMinor: 10000,
    })) as MockQuote;

    const req = {
      idempotencyKey: 'idem-lost-resp',
      quoteId: q.quoteId,
      recipientId: 'rcp-001',
      sourceCurrency: 'USD',
      sourceMinor: 10000,
    };

    // First delivery rejects with TypeError('Failed to fetch')
    await expect(service.submitTransfer(req)).rejects.toThrow('Failed to fetch');
    expect(service.debug.executedCount()).toBe(1);
    expect(service.debug.balances()['USD']).toBe(489_900);

    // Second delivery succeeds with the same transfer ID
    const second = (await service.submitTransfer(req)) as MockTransfer;
    expect(second.status).toBe('completed');
    expect(second.transferId).toBe('TRF-000001');
    expect(service.debug.executedCount()).toBe(1);
    expect(service.debug.balances()['USD']).toBe(489_900);
  });

  // SV-08: Late response resolves after the delay and replay returns same transfer ID
  test('SV-08: Late response delays first delivery and retry returns same transfer ID', async () => {
    jest.useFakeTimers();
    try {
      const { service, setChaos } = setupService();
      const q = (await service.getQuote({
        recipientId: 'rcp-001',
        sourceCurrency: 'USD',
        sourceMinor: 10000,
      })) as MockQuote;

      setChaos({ lateResponseMs: 15000 });

      const req = {
        idempotencyKey: 'idem-late-resp',
        quoteId: q.quoteId,
        recipientId: 'rcp-001',
        sourceCurrency: 'USD',
        sourceMinor: 10000,
      };

      const transferPromise = service.submitTransfer(req);
      // Give asynchronous execution steps a tick to reach sleep
      await Promise.resolve();
      jest.advanceTimersByTime(15000);

      const first = (await transferPromise) as MockTransfer;
      expect(first.transferId).toBe('TRF-000001');
      expect(service.debug.executedCount()).toBe(1);

      // Replay returns immediately without delay
      const replay = (await service.submitTransfer(req)) as MockTransfer;
      expect(replay.transferId).toBe('TRF-000001');
      expect(service.debug.executedCount()).toBe(1);
    } finally {
      jest.useRealTimers();
    }
  });

  // SV-09: hangForever does not resolve and reacts correctly to abort
  test('SV-09: hangForever does not resolve and rejects on abort', async () => {
    const { service } = setupService({ hangForever: true });
    const ac = new AbortController();

    const q = (await service.getQuote({
      recipientId: 'rcp-001',
      sourceCurrency: 'USD',
      sourceMinor: 10000,
    })) as MockQuote;

    const promise = service.submitTransfer(
      {
        idempotencyKey: 'idem-hang',
        quoteId: q.quoteId,
        recipientId: 'rcp-001',
        sourceCurrency: 'USD',
        sourceMinor: 10000,
      },
      { signal: ac.signal },
    );

    // Abort after launching
    ac.abort();

    await expect(promise).rejects.toThrow('This operation was aborted');
    expect(service.debug.executedCount()).toBe(0);
  });

  // SV-10: Malformed delivery removes transferId and changes status to 'done'
  test('SV-10: malformedPayload deletes transferId and changes status to done', async () => {
    const { service, setChaos } = setupService();
    const q = (await service.getQuote({
      recipientId: 'rcp-001',
      sourceCurrency: 'USD',
      sourceMinor: 10000,
    })) as MockQuote;

    setChaos({ malformedPayload: true });

    const resp = (await service.submitTransfer({
      idempotencyKey: 'idem-malformed',
      quoteId: q.quoteId,
      recipientId: 'rcp-001',
      sourceCurrency: 'USD',
      sourceMinor: 10000,
    })) as MockTransfer;

    expect(resp.transferId).toBeUndefined();
    expect(resp.status).toBe('done');

    // Also check getAccounts malformed payload (removes accounts key)
    const accountsResp = (await service.getAccounts()) as MockAccounts;
    expect(accountsResp.accounts).toBeUndefined();
  });

  // SV-11: Inconsistent delivery adds one minor unit to credited amount
  test('SV-11: inconsistentPayload adds one minor unit to credited.minor', async () => {
    const { service } = setupService({ inconsistentPayload: true });
    const q = (await service.getQuote({
      recipientId: 'rcp-001',
      sourceCurrency: 'USD',
      sourceMinor: 10000,
    })) as MockQuote;

    const resp = (await service.submitTransfer({
      idempotencyKey: 'idem-inconsistent',
      quoteId: q.quoteId,
      recipientId: 'rcp-001',
      sourceCurrency: 'USD',
      sourceMinor: 10000,
    })) as MockTransfer;

    // q.target.minor was 9200, so inconsistent payload should be 9201
    expect(resp.credited?.minor).toBe(9201);
  });

  // SV-12: Configured latency delays resolution by exactly latencyMs
  test('SV-12: Configured latency delays resolution by latencyMs', async () => {
    jest.useFakeTimers();
    try {
      const { service, sleepCalls } = setupService({ latencyMs: 500 });
      const accountsPromise = service.getAccounts();
      expect(sleepCalls.length).toBe(1);
      expect(sleepCalls[0]!.ms).toBe(500);
      jest.advanceTimersByTime(500);
      await accountsPromise;
    } finally {
      jest.useRealTimers();
    }
  });
});
