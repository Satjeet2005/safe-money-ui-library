import { createSubmitMachine, type SubmitState, type SubmitMachine } from './machine.js';
import { SubmitRejection, type SubmitError } from './errors.js';

export type Clock = Readonly<{ now(): number }>;

export type Scheduler = Readonly<{
  setTimeout(fn: () => void, ms: number): unknown;
  clearTimeout(handle: unknown): void;
}>;

export type ControllerEvent =
  | { type: 'accepted'; requestId: number; attempt: number }
  | { type: 'duplicate_ignored' }
  | { type: 'stale_ignored'; requestId: number }
  | { type: 'state'; state: SubmitState<unknown, unknown> };

export type ControllerOptions<TIn, TOut> = Readonly<{
  run: (
    input: TIn,
    ctx: { signal: AbortSignal; idempotencyKey: string; attempt: number },
  ) => Promise<unknown>;
  parseResponse: (raw: unknown) => { ok: true; value: TOut } | { ok: false; message: string };
  newKey: () => string;
  timeoutMs?: number;
  scheduler?: Scheduler;
  timeoutMessage?: string;
  networkMessage?: string;
  invalidResponseMessage?: string;
  onEvent?: (e: ControllerEvent) => void;
}>;

export type SubmitController<TIn, TOut> = Readonly<{
  getState(): SubmitState<TIn, TOut>;
  subscribe(listener: () => void): () => void;
  submit(input: TIn): void;
  retry(): void;
  reset(): void;
  dispose(): void;
}>;

const defaultScheduler: Scheduler = {
  setTimeout: (fn, ms) => setTimeout(fn, ms),
  clearTimeout: (h) => clearTimeout(h as ReturnType<typeof setTimeout>),
};

/**
 * Creates a safe submit controller.
 * @example const controller = createSubmitController({ run, parseResponse, newKey })
 */
export function createSubmitController<TIn, TOut>(
  options: ControllerOptions<TIn, TOut>,
): SubmitController<TIn, TOut> {
  const machine: SubmitMachine<TIn, TOut> = createSubmitMachine<TIn, TOut>();
  let state: SubmitState<TIn, TOut> = { status: 'idle' };

  const scheduler = options.scheduler ?? defaultScheduler;
  const timeoutMs = options.timeoutMs ?? 12_000;
  const timeoutMessage = options.timeoutMessage ?? 'The request timed out.';
  const networkMessage = options.networkMessage ?? 'The network request failed.';
  const invalidResponseMessage =
    options.invalidResponseMessage ?? 'The response could not be understood.';

  const listeners = new Set<() => void>();
  let timerHandle: unknown = null;
  let abortController: AbortController | null = null;
  let disposed = false;
  let activeRequestId: number | null = null;

  function clearActiveTimer(): void {
    if (timerHandle !== null) {
      scheduler.clearTimeout(timerHandle);
      timerHandle = null;
    }
  }

  function notify(): void {
    if (disposed) return;
    options.onEvent?.({ type: 'state', state: state as SubmitState<unknown, unknown> });
    for (const listener of Array.from(listeners)) {
      listener();
    }
  }

  function execute(requestId: number, attempt: number, input: TIn, idempotencyKey: string): void {
    activeRequestId = requestId;
    abortController = new AbortController();
    const { signal } = abortController;

    options.onEvent?.({ type: 'accepted', requestId, attempt });

    timerHandle = scheduler.setTimeout(() => {
      if (disposed || activeRequestId !== requestId) return;
      abortController?.abort();
      const prev = state;
      const next = machine.reduce(state, {
        type: 'REJECT',
        requestId,
        error: { kind: 'timeout', retryable: true, message: timeoutMessage },
      });
      if (prev !== next) {
        state = next;
        notify();
      }
    }, timeoutMs);

    void options.run(input, { signal, idempotencyKey, attempt }).then(
      (raw) => {
        if (disposed || activeRequestId !== requestId || state.status !== 'submitting') {
          options.onEvent?.({ type: 'stale_ignored', requestId });
          return;
        }
        clearActiveTimer();
        const parsed = options.parseResponse(raw);
        const prev = state;
        let next = prev;
        if (parsed.ok) {
          next = machine.reduce(state, { type: 'RESOLVE', requestId, result: parsed.value });
        } else {
          const err: SubmitError = {
            kind: 'invalid_response',
            retryable: true,
            message: parsed.message || invalidResponseMessage,
          };
          next = machine.reduce(state, { type: 'REJECT', requestId, error: err });
        }
        if (prev !== next) {
          state = next;
          notify();
        }
      },
      (error: unknown) => {
        if (disposed || activeRequestId !== requestId || state.status !== 'submitting') {
          options.onEvent?.({ type: 'stale_ignored', requestId });
          return;
        }
        clearActiveTimer();
        if (signal.aborted) {
          return;
        }
        const prev = state;
        let err: SubmitError;
        if (error instanceof SubmitRejection) {
          err = {
            kind: 'rejected',
            code: error.code,
            retryable: error.retryable,
            message: error.message,
          };
        } else {
          const msg = error instanceof Error && error.message ? error.message : networkMessage;
          err = {
            kind: 'network',
            retryable: true,
            message: options.networkMessage ?? msg,
          };
        }
        const next = machine.reduce(state, { type: 'REJECT', requestId, error: err });
        if (prev !== next) {
          state = next;
          notify();
        }
      },
    );
  }

  function submit(input: TIn): void {
    if (disposed) return;
    if (state.status === 'submitting') {
      options.onEvent?.({ type: 'duplicate_ignored' });
      return;
    }
    const idempotencyKey = options.newKey();
    const prev = state;
    const next = machine.reduce(state, { type: 'SUBMIT', input, idempotencyKey });
    if (prev !== next && next.status === 'submitting') {
      state = next;
      notify();
      execute(next.requestId, next.attempt, next.input, next.idempotencyKey);
    }
  }

  function retry(): void {
    if (disposed) return;
    if (state.status !== 'failed' || !state.error.retryable) {
      return;
    }
    const prev = state;
    const next = machine.reduce(state, { type: 'RETRY' });
    if (prev !== next && next.status === 'submitting') {
      state = next;
      notify();
      execute(next.requestId, next.attempt, next.input, next.idempotencyKey);
    }
  }

  function reset(): void {
    if (disposed) return;
    if (state.status === 'submitting') {
      return;
    }
    clearActiveTimer();
    abortController?.abort();
    const prev = state;
    const next = machine.reduce(state, { type: 'RESET' });
    if (prev !== next) {
      state = next;
      notify();
    }
  }

  function dispose(): void {
    if (disposed) return;
    disposed = true;
    clearActiveTimer();
    abortController?.abort();
    listeners.clear();
  }

  return {
    getState: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    submit,
    retry,
    reset,
    dispose,
  };
}
