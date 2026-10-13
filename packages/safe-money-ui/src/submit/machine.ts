import type { SubmitError, SubmitErrorKind } from './errors.js';

export type { SubmitError, SubmitErrorKind };

/**
 * State of the submit state machine.
 */
export type SubmitState<TIn, TOut> =
  | Readonly<{ status: 'idle' }>
  | Readonly<{
      status: 'submitting';
      requestId: number;
      idempotencyKey: string;
      input: TIn;
      attempt: number;
    }>
  | Readonly<{
      status: 'succeeded';
      requestId: number;
      idempotencyKey: string;
      result: TOut;
    }>
  | Readonly<{
      status: 'failed';
      requestId: number;
      idempotencyKey: string;
      input: TIn;
      error: SubmitError;
      attempt: number;
    }>;

/**
 * Events processed by the submit state machine reducer.
 */
export type SubmitEvent<TIn, TOut> =
  | { type: 'SUBMIT'; input: TIn; idempotencyKey: string }
  | { type: 'RETRY' }
  | { type: 'RESOLVE'; requestId: number; result: TOut }
  | { type: 'REJECT'; requestId: number; error: SubmitError }
  | { type: 'RESET' };

/**
 * Interface for the submit state machine.
 */
export type SubmitMachine<TIn, TOut> = {
  reduce(state: SubmitState<TIn, TOut>, event: SubmitEvent<TIn, TOut>): SubmitState<TIn, TOut>;
};

/**
 * Creates a pure submit state machine with an internal request counter.
 *
 * Implements the 4-state transition table specified in PRD §9.2. Ignored events return
 * the exact existing state object reference.
 *
 * @returns A SubmitMachine instance with a pure `reduce` method.
 *
 * @example
 * ```ts
 * const machine = createSubmitMachine<string, number>();
 * const state1 = machine.reduce({ status: 'idle' }, { type: 'SUBMIT', input: 'test', idempotencyKey: 'k1' });
 * ```
 */
export function createSubmitMachine<TIn, TOut>(): SubmitMachine<TIn, TOut> {
  let nextRequestId = 1;

  return {
    reduce(state: SubmitState<TIn, TOut>, event: SubmitEvent<TIn, TOut>): SubmitState<TIn, TOut> {
      switch (state.status) {
        case 'idle': {
          if (event.type === 'SUBMIT') {
            return {
              status: 'submitting',
              requestId: nextRequestId++,
              idempotencyKey: event.idempotencyKey,
              input: event.input,
              attempt: 1,
            };
          }
          return state;
        }

        case 'submitting': {
          if (event.type === 'RESOLVE' && event.requestId === state.requestId) {
            return {
              status: 'succeeded',
              requestId: state.requestId,
              idempotencyKey: state.idempotencyKey,
              result: event.result,
            };
          }

          if (event.type === 'REJECT' && event.requestId === state.requestId) {
            return {
              status: 'failed',
              requestId: state.requestId,
              idempotencyKey: state.idempotencyKey,
              input: state.input,
              error: event.error,
              attempt: state.attempt,
            };
          }

          return state;
        }

        case 'failed': {
          if (event.type === 'RETRY' && state.error.retryable) {
            return {
              status: 'submitting',
              requestId: nextRequestId++,
              idempotencyKey: state.idempotencyKey,
              input: state.input,
              attempt: state.attempt + 1,
            };
          }

          if (event.type === 'RESET') {
            return { status: 'idle' };
          }

          return state;
        }

        case 'succeeded': {
          if (event.type === 'RESET') {
            return { status: 'idle' };
          }

          return state;
        }

        default:
          return state;
      }
    },
  };
}
