import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { DEFAULT_CHAOS_CONFIG } from '../service/chaos.js';
import type { ChaosConfigPayload } from '../service/schemas.js';

export type ChaosState = ChaosConfigPayload & {
  panelOpen: boolean;
};

const initialState: ChaosState = {
  ...DEFAULT_CHAOS_CONFIG,
  panelOpen: false,
};

export const chaosSlice = createSlice({
  name: 'chaos',
  initialState,
  reducers: {
    setChaos: (state, action: PayloadAction<Partial<ChaosConfigPayload>>) => {
      Object.assign(state, action.payload);
    },
    resetChaos: (state) => {
      Object.assign(state, DEFAULT_CHAOS_CONFIG);
    },
    togglePanel: (state) => {
      state.panelOpen = !state.panelOpen;
    },
  },
});

export const { setChaos, resetChaos, togglePanel } = chaosSlice.actions;
