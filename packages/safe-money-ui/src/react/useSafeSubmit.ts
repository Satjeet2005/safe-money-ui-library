import { useRef, useEffect, useSyncExternalStore } from 'react';
import {
  createSubmitController,
  type ControllerOptions,
  type SubmitController,
} from '../submit/controller.js';
import type { SubmitState } from '../submit/machine.js';

export type UseSafeSubmitResult<TIn, TOut> = Readonly<{
  state: SubmitState<TIn, TOut>;
  submit: (input: TIn) => void;
  retry: () => void;
  reset: () => void;
}>;

/**
 * React hook wrapping the safe-submit state machine controller.
 * @example
 * ```ts
 * const { state, submit, retry, reset } = useSafeSubmit({
 *   run: async (input, ctx) => executeApi(input, ctx.signal),
 *   parseResponse: (raw) => ({ ok: true, value: raw }),
 *   newKey: () => crypto.randomUUID(),
 * });
 * ```
 */
export function useSafeSubmit<TIn, TOut>(
  options: ControllerOptions<TIn, TOut>,
): UseSafeSubmitResult<TIn, TOut> {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const controllerRef = useRef<SubmitController<TIn, TOut> | null>(null);
  if (!controllerRef.current) {
    controllerRef.current = createSubmitController<TIn, TOut>({
      ...options,
      run: (input, ctx) => optionsRef.current.run(input, ctx),
      parseResponse: (raw) => optionsRef.current.parseResponse(raw),
    });
  }

  const controller = controllerRef.current;
  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getState,
    controller.getState,
  );

  useEffect(() => {
    return () => {
      controllerRef.current?.dispose();
    };
  }, []);

  return {
    state,
    submit: controller.submit,
    retry: controller.retry,
    reset: controller.reset,
  };
}
