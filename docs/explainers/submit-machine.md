# Explainer: submit-machine

## What it does

`packages/safe-money-ui/src/submit/machine.ts` is a pure state reducer governing payment submission lifecycles across four explicit states: `idle`, `submitting`, `succeeded`, and `failed`.

## Why it exists

Payment interfaces frequently suffer from race conditions, duplicate submissions from impatient clicks, and out-of-order network responses. A pure reducer enforces a strict transition matrix where invalid operations are ignored and return the identical state reference, preventing unnecessary React re-renders and duplicate network requests.

## How it works

1. Accepts current `SubmitState` and an incoming `SubmitAction` (`SUBMIT`, `RESOLVE`, `REJECT`, `RETRY`, `RESET`).
2. If `idle` and `SUBMIT`: returns `submitting` state with `requestId = 1`, `attempt = 1`, and idempotency key.
3. If `submitting` and `SUBMIT`: ignores action and returns the exact previous state reference.
4. If `submitting` and `RESOLVE`: verifies matching `requestId`; transitions to `succeeded` with result payload.
5. If `submitting` and `REJECT`: verifies matching `requestId`; transitions to `failed` with error, input, and idempotency key.
6. If `submitting` and mismatched `requestId`: ignores action and returns previous state reference.
7. If `failed` (retryable error) and `RETRY`: transitions to `submitting` with incremented `attempt` and new `requestId`, preserving the key.
8. If `failed` (non-retryable error) and `RETRY`: ignores action and returns previous state reference.
9. If `failed` or `succeeded` and `RESET`: transitions back to `idle`.
10. All other unexpected action/state combinations return the previous state reference.

## Trade-offs

The state machine is implemented as a synchronous pure reducer decoupled from side effects, rather than using an integrated actor framework. While this requires a separate controller layer for timers and promises, it allows 100% of state transitions and edge cases to be tested deterministically without mock clocks.

## How it is tested

- Unit tests in `packages/safe-money-ui/test/submit/machine.test.ts` verify every cell in the PRD §9.2 state transition table.
- Property tests in `packages/safe-money-ui/test/property/submit.property.test.ts` verify lifecycle invariants I1 through I7 (at-most-one-in-flight, monotonic request IDs, idempotency key persistence) across 1,000 randomized action sequences.
- Stryker mutation testing achieved a 100% kill rate on all reducer logic and guards.

## Questions an interviewer may ask

1. Why does the reducer return the exact previous state reference instead of a new cloned object when an action is ignored?
2. How does the reducer protect against late-arriving responses from previous timed-out attempts?
3. Why are idempotency keys preserved across retries rather than regenerated?
