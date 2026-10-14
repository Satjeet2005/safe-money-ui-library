# Explainer: mock-service-chaos

## What it does

`apps/transfer-demo/src/service/mockService.ts` and `chaos.ts` implement an in-memory, stateful simulated transfer service with fault injection controls (latency, dropped responses, rate shifts, server rejections, and malformed payloads).

## Why it exists

Verifying payment resilience against distributed systems failure modes—such as lost responses, network timeouts, and stale quotes—is impractical against live backends and impossible with static mocks. A stateful simulated service enables deterministic reproduction of edge-case failures and verifies idempotent recovery.

## How it works

1. Maintains in-memory state: account balances, recipient records, transfer logs, and an idempotency registry.
2. Inspects active chaos configuration on every API request.
3. Injects latency via configurable delays (0ms, 200ms, 2500ms) or indefinite hangs.
4. Checks server rejection flags (e.g., `INSUFFICIENT_FUNDS`, `SERVICE_UNAVAILABLE`) and throws typed rejections.
5. In `executeTransfer`, checks the idempotency store for existing keys.
6. If the key exists with identical parameters: returns previous transfer details without a second debit.
7. If the key exists with conflicting parameters: rejects with `IDEMPOTENCY_CONFLICT`.
8. Simulates market rate shifts (+0.5% or -0.5%) when the rate shift fault is active.
9. If `lostResponse` is active: debits account, records completed transfer, but throws a network error before returning.
10. On retry with identical key: retrieves the completed transfer and returns success without debiting again.
11. Returns malformed JSON or mutated payloads when the bad payload fault is active.

## Trade-offs

The service is implemented as an in-memory TypeScript module rather than an HTTP Mock Service Worker (MSW) or external server. This allows direct dependency injection into Redux thunks, eliminates network port collisions during parallel test runs, and supports instant virtual clock advancement.

## How it is tested

- Unit tests in `apps/transfer-demo/src/service/mockService.test.ts` verify cases `SV-01` through `SV-12` (quotes, transfers, idempotency deduplication, rate shifts, lost response fault injection).
- Chaos configuration tests in `apps/transfer-demo/src/service/chaos.test.ts` verify URL presets and deterministic mode.
- Cypress journeys J3, J4, J5, J6, J7, and J8 test real-browser failure and recovery journeys.

## Questions an interviewer may ask

1. How does the mock service simulate a lost response fault while verifying that the account was debited only once?
2. What happens when an idempotency key is reused with mismatched transfer parameters?
3. How does deterministic mode (`?deterministic=1`) ensure reproducible test executions?
