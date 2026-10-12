import { useState } from 'react';
import type { ControllerOptions } from '../submit/controller.js';
import type { SubmitState } from '../submit/machine.js';

export type UseSafeSubmitResult<TIn, TOut> = {
  state: SubmitState<TIn, TOut>;
  submit: (input: TIn) => void;
  retry: () => void;
  reset: () => void;
};

/**
 * Hook for managing safe, idempotent submit lifecycle.
 * @example const { state, submit } = useSafeSubmit(opts)
 */
export function useSafeSubmit<TIn, TOut>(
  _options: ControllerOptions<TIn, TOut>,
): UseSafeSubmitResult<TIn, TOut> {
  const [state] = useState<SubmitState<TIn, TOut>>({ status: 'idle' });

  return {
    state,
    submit: () => {},
    retry: () => {},
    reset: () => {},
  };
}
