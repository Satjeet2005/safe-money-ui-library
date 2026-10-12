import { createSlice } from '@reduxjs/toolkit';

export type ChaosConfig = {
  latencyMs: 0 | 500 | 3000;
  hangForever: boolean;
  lateResponseMs: 0 | 15000;
  malformedPayload: boolean;
  inconsistentPayload: boolean;
  rejectWith: 'none' | 'INSUFFICIENT_FUNDS' | 'RECIPIENT_BLOCKED' | 'SERVICE_UNAVAILABLE';
  loseResponse: boolean;
  rateMoves: boolean;
  corruptStorage: boolean;
};

export type ChaosState = ChaosConfig & {
  panelOpen: boolean;
};

const defaultChaosConfig: ChaosConfig = {
  latencyMs: 0,
  hangForever: false,
  lateResponseMs: 0,
  malformedPayload: false,
  inconsistentPayload: false,
  rejectWith: 'none',
  loseResponse: false,
  rateMoves: false,
  corruptStorage: false,
};

const initialState: ChaosState = {
  ...defaultChaosConfig,
  panelOpen: false,
};

export const chaosSlice = createSlice({
  name: 'chaos',
  initialState,
  reducers: {
    setChaos: (state, action) => {
      Object.assign(state, action.payload);
    },
    resetChaos: (state) => {
      Object.assign(state, defaultChaosConfig);
    },
    togglePanel: (state) => {
      state.panelOpen = !state.panelOpen;
    },
  },
});

export const { setChaos, resetChaos, togglePanel } = chaosSlice.actions;
