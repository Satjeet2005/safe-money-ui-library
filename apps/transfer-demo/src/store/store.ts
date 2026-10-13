import { configureStore } from '@reduxjs/toolkit';
import { draftSlice } from './draftSlice.js';
import { flowSlice } from './flowSlice.js';
import { dataSlice } from './dataSlice.js';
import { chaosSlice } from './chaosSlice.js';
import { historySlice } from './historySlice.js';
import type { MockService } from '../service/mockService.js';
import type { Clock } from '@satjeet2005/safe-money-ui/submit';

export type ThunkExtra = {
  service: MockService;
  clock?: Clock;
};

export function createAppStore(extra: ThunkExtra = {} as ThunkExtra) {
  return configureStore({
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
          extraArgument: extra,
        },
      }),
  });
}

export const store = createAppStore();
export type AppStore = typeof store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
