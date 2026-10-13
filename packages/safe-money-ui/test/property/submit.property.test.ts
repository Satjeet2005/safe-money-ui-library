import fc from 'fast-check';
import {
  createSubmitMachine,
  type SubmitState,
  type SubmitEvent,
} from '../../src/submit/machine.js';
import { createSubmitController } from '../../src/submit/controller.js';
import { SubmitRejection, type SubmitErrorKind } from '../../src/submit/errors.js';
import { createFakeScheduler } from '../helpers/fakeScheduler.js';
import { createDeferred, type Deferred } from '../helpers/deferred.js';
import { getPropertyConfig } from '../helpers/arbitraries.js';

describe('Property P6: Submit Invariants I1..I7 (PRD §9.5, §14.3)', () => {
  // Part 1: Reducer-only harness
  it('P6 (reducer-only): invariant checks on state transitions and ignored event identity', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.oneof(
            fc.record({
              type: fc.constant('SUBMIT' as const),
              input: fc.integer(),
              idempotencyKey: fc.string({ minLength: 1 }),
            }),
            fc.constant({ type: 'RETRY' as const }),
            fc.constant({ type: 'RESET' as const }),
            fc.record({
              type: fc.constant('RESOLVE' as const),
              requestId: fc.integer({ min: 0, max: 50 }),
              result: fc.string(),
            }),
            fc.record({
              type: fc.constant('REJECT' as const),
              requestId: fc.integer({ min: 0, max: 50 }),
              error: fc.record({
                kind: fc.constantFrom<SubmitErrorKind>(
                  'timeout',
                  'network',
                  'rejected',
                  'invalid_response',
                ),
                message: fc.string(),
                retryable: fc.boolean(),
              }),
            }),
          ),
          { maxLength: 40 },
        ),
        (events) => {
          const machine = createSubmitMachine<number, string>();
          let state: SubmitState<number, string> = { status: 'idle' };
          let prevRequestId = 0;

          for (const event of events) {
            const prevState: SubmitState<number, string> = state;
            state = machine.reduce(state, event as SubmitEvent<number, string>);

            // I7. Any ignored event returns the identical state reference
            // If states did not change, reference must be identical
            if (
              (prevState.status === 'idle' && event.type !== 'SUBMIT') ||
              (prevState.status === 'submitting' &&
                (event.type === 'SUBMIT' || event.type === 'RETRY' || event.type === 'RESET')) ||
              (prevState.status === 'failed' && event.type === 'SUBMIT') ||
              (prevState.status === 'failed' &&
                event.type === 'RETRY' &&
                !prevState.error.retryable) ||
              (prevState.status === 'failed' &&
                (event.type === 'RESOLVE' || event.type === 'REJECT')) ||
              (prevState.status === 'succeeded' && event.type !== 'RESET')
            ) {
              expect(state).toBe(prevState);
            }

            // I3. succeeded is reachable only from submitting via matching requestId
            if (state.status === 'succeeded' && prevState !== state) {
              expect(prevState.status).toBe('submitting');
              if (prevState.status === 'submitting') {
                expect(state.requestId).toBe(prevState.requestId);
                expect(state.idempotencyKey).toBe(prevState.idempotencyKey);
              }
            }

            // I4. idempotencyKey never changes across RETRY
            if (prevState.status === 'failed' && state.status === 'submitting') {
              expect(state.idempotencyKey).toBe(prevState.idempotencyKey);
              expect(state.input).toBe(prevState.input);
              expect(state.attempt).toBe(prevState.attempt + 1);
            }

            // I5. requestId strictly increases on every accepted SUBMIT or RETRY
            if (
              (prevState.status === 'idle' && state.status === 'submitting') ||
              (prevState.status === 'failed' && state.status === 'submitting')
            ) {
              expect(state.requestId).toBeGreaterThan(prevRequestId);
              prevRequestId = state.requestId;
            }
          }
        },
      ),
      getPropertyConfig(),
    );
  });

  // Part 2: Controller harness with fakeScheduler and deferred
  it('P6 (controller): invariant assertions I1..I7 across arbitrary command sequences', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.oneof(
            fc.record({
              type: fc.constant('submit' as const),
              n: fc.integer({ min: 1, max: 10_000 }),
            }),
            fc.constant({ type: 'retry' as const }),
            fc.constant({ type: 'reset' as const }),
            fc.constant({ type: 'resolveCurrent' as const }),
            fc.constant({ type: 'resolveStale' as const }),
            fc.record({
              type: fc.constant('rejectCurrent' as const),
              kind: fc.constantFrom<SubmitErrorKind>(
                'timeout',
                'network',
                'rejected',
                'invalid_response',
              ),
            }),
            fc.constant({ type: 'rejectStale' as const }),
            fc.constant({ type: 'fireTimeout' as const }),
            fc.constant({ type: 'dispose' as const }),
          ),
          { maxLength: 40 },
        ),
        async (commands) => {
          const scheduler = createFakeScheduler();
          let inFlightCount = 0;
          const deferredHolder: { current: Deferred<unknown> | null } = { current: null };
          const staleDeferreds: Deferred<unknown>[] = [];
          let currentRequestId = 0;
          let lastAcceptedKey = '';
          let totalRunCalls = 0;
          let totalAccepted = 0;
          let keySeq = 1;
          let isDisposed = false;
          let notificationsAfterDispose = 0;

          const controller = createSubmitController<number, { val: number }>({
            run: (_input, ctx) => {
              totalRunCalls++;
              inFlightCount++;
              const d = createDeferred<unknown>();
              deferredHolder.current = d;
              ctx.signal.addEventListener('abort', () => {
                // If controller aborted due to timeout or dispose, settle the run promise as aborted
                d.reject(new Error('Aborted'));
              });
              return d.promise.finally(() => {
                inFlightCount = Math.max(0, inFlightCount - 1);
              });
            },
            parseResponse: (raw: unknown) => {
              if (raw && typeof raw === 'object' && 'val' in raw) {
                return { ok: true, value: raw as { val: number } };
              }
              return { ok: false, message: 'Invalid payload' };
            },
            newKey: () => `key-${keySeq++}`,
            timeoutMs: 5000,
            scheduler,
            onEvent: (e) => {
              if (e.type === 'accepted') {
                totalAccepted++;
              }
            },
          });

          controller.subscribe(() => {
            if (isDisposed) {
              notificationsAfterDispose++;
            }
          });

          for (const cmd of commands) {
            const stateBefore = controller.getState();

            switch (cmd.type) {
              case 'submit': {
                controller.submit(cmd.n);
                break;
              }
              case 'retry': {
                controller.retry();
                break;
              }
              case 'reset': {
                controller.reset();
                break;
              }
              case 'resolveCurrent': {
                const target = deferredHolder.current;
                if (target !== null) {
                  target.resolve({ val: 42 });
                  staleDeferreds.push(target);
                  deferredHolder.current = null;
                }
                break;
              }
              case 'resolveStale': {
                for (const d of staleDeferreds) {
                  d.resolve({ val: 999 });
                }
                break;
              }
              case 'rejectCurrent': {
                const target = deferredHolder.current;
                if (target !== null) {
                  if (cmd.kind === 'rejected') {
                    target.reject(new SubmitRejection('Rejected', 'BIZ_ERR', false));
                  } else if (cmd.kind === 'invalid_response') {
                    target.resolve({ bad: true });
                  } else {
                    target.reject(new Error('Network drop'));
                  }
                  staleDeferreds.push(target);
                  deferredHolder.current = null;
                }
                break;
              }
              case 'rejectStale': {
                for (const d of staleDeferreds) {
                  d.reject(new Error('Stale reject'));
                }
                break;
              }
              case 'fireTimeout': {
                scheduler.advance(5000);
                if (deferredHolder.current !== null) {
                  staleDeferreds.push(deferredHolder.current);
                  deferredHolder.current = null;
                }
                break;
              }
              case 'dispose': {
                controller.dispose();
                isDisposed = true;
                break;
              }
            }

            await Promise.resolve();

            const stateAfter = controller.getState();

            // I1. At most one run is in flight per controller
            expect(inFlightCount).toBeLessThanOrEqual(1);

            // I2. run is called exactly once per accepted SUBMIT or RETRY
            expect(totalRunCalls).toBe(totalAccepted);

            // I3. succeeded is reachable only from submitting via RESOLVE carrying current requestId
            if (stateAfter.status === 'succeeded' && stateBefore.status !== 'succeeded') {
              expect(stateBefore.status).toBe('submitting');
              if (stateBefore.status === 'submitting') {
                expect(stateAfter.requestId).toBe(stateBefore.requestId);
                expect(stateAfter.idempotencyKey).toBe(stateBefore.idempotencyKey);
              }
            }

            // I4. idempotencyKey never changes across RETRY, and changes only on an accepted SUBMIT from idle
            if (stateAfter.status === 'submitting') {
              if (stateBefore.status === 'failed') {
                expect(stateAfter.idempotencyKey).toBe(stateBefore.idempotencyKey);
              } else if (stateBefore.status === 'idle') {
                expect(stateAfter.idempotencyKey).not.toBe(lastAcceptedKey);
                lastAcceptedKey = stateAfter.idempotencyKey;
              }
            }

            // I5. requestId strictly increases on every accepted SUBMIT or RETRY
            if (stateAfter.status === 'submitting' && stateBefore.status !== 'submitting') {
              expect(stateAfter.requestId).toBeGreaterThan(currentRequestId);
              currentRequestId = stateAfter.requestId;
            }

            // I6. After dispose, nothing changes and no callback fires
            if (isDisposed) {
              expect(notificationsAfterDispose).toBe(0);
            }
          }
        },
      ),
      getPropertyConfig(),
    );
  });
});
