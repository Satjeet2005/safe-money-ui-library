import type { SubmitError } from './errors.js';

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

export type SubmitEvent<TIn, TOut> =
  | { type: 'SUBMIT'; input: TIn; idempotencyKey: string }
  | { type: 'RETRY' }
  | { type: 'RESOLVE'; requestId: number; result: TOut }
  | { type: 'REJECT'; requestId: number; error: SubmitError }
  | { type: 'RESET' };

export type SubmitMachine<TIn, TOut> = {
  reduce(state: SubmitState<TIn, TOut>, event: SubmitEvent<TIn, TOut>): SubmitState<TIn, TOut>;
};

/**
 * Creates a safe submit state machine.
 * @example const machine = createSubmitMachine()
 */
export function createSubmitMachine<TIn, TOut>(): SubmitMachine<TIn, TOut> {
  let nextRequestId = 1;
  return {
    reduce(state, event) {
      // Placeholder for WP-10
      if (state.status === 'idle' && event.type === 'SUBMIT') {
        return {
          status: 'submitting',
          requestId: nextRequestId++,
          idempotencyKey: event.idempotencyKey,
          input: event.input,
          attempt: 1,
        };
      }
      return state;
    },
  };
}
