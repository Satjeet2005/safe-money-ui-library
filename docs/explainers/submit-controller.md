# Explainer: submit-controller

## What it does

`packages/safe-money-ui/src/submit/controller.ts` is an asynchronous orchestration controller that manages side effects around the pure submit state machine, including timers, abort signals, idempotency tokens, and listener subscriptions.

## Why it exists

While pure state reducers handle state transitions cleanly, real submissions require managing network timeouts, cancellation via `AbortController`, promise lifecycle handling, and external subscribers. The controller encapsulates this complexity while ensuring that component unmounts and disposal do not leave active timers or trigger memory leaks.

## How it works

1. Instantiates with an injected scheduler, timeout duration, and idempotency key generator.
2. Exposes methods `submit(input)`, `retry()`, `reset()`, `dispose()`, and `subscribe(listener)`.
3. `submit` generates an idempotency key, transitions state machine to `submitting`, and triggers `run`.
4. Starts a timeout timer via `scheduler.setTimeout`; fires abort signal and dispatches `REJECT` on timeout.
5. Passes `signal`, `idempotencyKey`, and `attempt` to the caller's async `run` function.
6. When `run` resolves, parses response via `parseResponse` and dispatches `RESOLVE` with matching `requestId`.
7. When `run` rejects or parse fails, dispatches `REJECT` with matching `requestId` and typed `SubmitRejection`.
8. Clears the timeout timer upon completion or cancellation.
9. `retry()` preserves the original idempotency key and input, generating a new monotonic `requestId`.
10. Notifies subscribers only when the machine state reference changes.
11. `dispose()` aborts in-flight operations, clears active timers, empties listener sets, and ignores subsequent calls.

## Trade-offs

The controller accepts an injected `Scheduler` interface rather than directly using global `setTimeout` and `clearTimeout`. This trade-off requires slightly more setup in application code, but enables instant, synchronous, deterministic testing with fake clocks without real-time sleep delays.

## How it is tested

- Unit tests in `packages/safe-money-ui/test/submit/controller.test.ts` verify test cases `CT-01` through `CT-09`, listener unsubscriptions, disposal idempotency, and concurrent calls.
- Error tests in `packages/safe-money-ui/test/submit/errors.test.ts` verify `SubmitRejection` properties, error codes, and retryable flags.
- Property tests in `packages/safe-money-ui/test/property/submit.property.test.ts` verify asynchronous controller invariants.
- Mutation testing killed all mutants in listener management and timeout disposal.

## Questions an interviewer may ask

1. What happens if a network response arrives after the client-side timeout timer has already dispatched `REJECT`?
2. Why does `dispose()` clear the subscriber list before aborting in-flight network requests?
3. How does the controller distinguish between transient network errors and permanent business rejections?
