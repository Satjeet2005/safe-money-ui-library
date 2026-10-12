import { configureStore } from '@reduxjs/toolkit';
import { draftSlice } from './draftSlice.js';
import { flowSlice } from './flowSlice.js';
import { dataSlice } from './dataSlice.js';
import { chaosSlice } from './chaosSlice.js';
import { historySlice } from './historySlice.js';

export const store = configureStore({
  reducer: {
    draft: draftSlice.reducer,
    flow: flowSlice.reducer,
    data: dataSlice.reducer,
    chaos: chaosSlice.reducer,
    history: historySlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
