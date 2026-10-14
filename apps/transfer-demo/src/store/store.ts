import { configureStore } from '@reduxjs/toolkit';
import { draftSlice } from './draftSlice.js';
import { flowSlice } from './flowSlice.js';
import { dataSlice } from './dataSlice.js';
import { chaosSlice } from './chaosSlice.js';
import { historySlice } from './historySlice.js';
import { createMockService, type MockService } from '../service/mockService.js';
import { systemClock } from '../service/clock.js';
import { createIdGenerator } from '../service/ids.js';
import { setupDeterministicDebugHook } from '../service/chaos.js';
import type { Clock } from '@satjeet2005/safe-money-ui/submit';

export type ThunkExtra = {
  service: MockService;
  clock?: Clock | undefined;
};

/**
 * Creates the default mock service wired to store chaos and environment settings.
 * @example
 * ```ts
 * const service = createDefaultService(() => store.getState().chaos, clock);
 * ```
 */
export function createDefaultService(
  getChaos: () => RootState['chaos'],
  clock: Clock = systemClock,
  deterministic?: boolean,
): MockService {
  const isDeterministic =
    deterministic ??
    (typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('deterministic') === '1');
  const ids = createIdGenerator(isDeterministic);
  const service = createMockService({
    clock,
    chaos: getChaos,
    ids,
    sleep: (ms, signal) =>
      new Promise((resolve, reject) => {
        if (signal?.aborted) {
          reject(new DOMException('This operation was aborted', 'AbortError'));
          return;
        }
        const timer = setTimeout(resolve, ms);
        signal?.addEventListener(
          'abort',
          () => {
            clearTimeout(timer);
            reject(new DOMException('This operation was aborted', 'AbortError'));
          },
          { once: true },
        );
      }),
  });
  setupDeterministicDebugHook(service.debug, isDeterministic);
  return service;
}

/**
 * Creates a configured Redux Toolkit application store with injected thunk dependencies.
 * @example
 * ```ts
 * const store = createAppStore({ service });
 * ```
 */
export function createAppStore(extra: Partial<ThunkExtra> = {}) {
  const extraObj: ThunkExtra = {
    service: extra.service as MockService,
    clock: extra.clock,
  };

  const store = configureStore({
    reducer: {
      draft: draftSlice.reducer,
      flow: flowSlice.reducer,
      data: dataSlice.reducer,
      chaos: chaosSlice.reducer,
      history: historySlice.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        thunk: {
          extraArgument: extraObj,
        },
      }),
  });

  if (!extraObj.service) {
    extraObj.service = createDefaultService(
      () => store.getState().chaos,
      extraObj.clock ?? systemClock,
    );
  }

  return Object.assign(store, { extra: extraObj });
}

export const store = createAppStore();
export type AppStore = typeof store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
