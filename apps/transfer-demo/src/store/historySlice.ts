import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type HistoryEntry = Readonly<{
  id: string;
  kind: 'completed' | 'unconfirmed';
  recipientName: string;
  amountText: string;
}>;

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
    addEntry: (state, action: PayloadAction<HistoryEntry>) => {
      state.entries.unshift(action.payload);
    },
  },
});

export const { addEntry } = historySlice.actions;
