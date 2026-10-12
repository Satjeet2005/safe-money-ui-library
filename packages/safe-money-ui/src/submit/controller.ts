import type { SubmitState } from './machine.js';

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

/**
 * Creates a safe submit controller.
 * @example const controller = createSubmitController({ run, parseResponse, newKey })
 */
export function createSubmitController<TIn, TOut>(
  _options: ControllerOptions<TIn, TOut>,
): SubmitController<TIn, TOut> {
  // Placeholder for WP-11
  let state: SubmitState<TIn, TOut> = { status: 'idle' };
  const listeners = new Set<() => void>();

  return {
    getState: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    submit: () => {
      state = { status: 'idle' };
    },
    retry: () => {},
    reset: () => {},
    dispose: () => {},
  };
}
