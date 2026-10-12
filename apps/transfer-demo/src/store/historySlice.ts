import { createSlice } from '@reduxjs/toolkit';

export type HistoryEntry = {
  id: string;
  kind: 'completed' | 'unconfirmed';
  recipientName: string;
  amountText: string;
};

export type HistoryState = {
  entries: HistoryEntry[];
};

const initialState: HistoryState = {
  entries: [],
};

export const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {
    addEntry: (state, action) => {
      state.entries.unshift(action.payload);
    },
  },
});

export const { addEntry } = historySlice.actions;
