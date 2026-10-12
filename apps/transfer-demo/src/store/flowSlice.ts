import { createSlice } from '@reduxjs/toolkit';
import type { CopyKey } from '../copy.js';

export type FlowStep = 'form' | 'review' | 'result';

export type FlowState = {
  step: FlowStep;
  quote: unknown | null;
  snapshot: Record<string, string | number | boolean> | null;
  quoteStatus: 'idle' | 'loading' | 'failed';
  banner: { kind: 'info' | 'warning' | 'error'; copyKey: CopyKey } | null;
};

const initialState: FlowState = {
  step: 'form',
  quote: null,
  snapshot: null,
  quoteStatus: 'idle',
  banner: null,
};

export const flowSlice = createSlice({
  name: 'flow',
  initialState,
  reducers: {
    goToForm: (state) => {
      state.step = 'form';
    },
    goToReview: (state, action) => {
      state.step = 'review';
      state.quote = action.payload?.quote ?? null;
      state.snapshot = action.payload?.snapshot ?? null;
    },
    goToResult: (state) => {
      state.step = 'result';
    },
    setQuoteStatus: (state, action) => {
      state.quoteStatus = action.payload;
    },
    setBanner: (state, action) => {
      state.banner = action.payload;
    },
    clearBanner: (state) => {
      state.banner = null;
    },
  },
});

export const { goToForm, goToReview, goToResult, setQuoteStatus, setBanner, clearBanner } =
  flowSlice.actions;
