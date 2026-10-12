import { createSlice } from '@reduxjs/toolkit';

export type DraftState = {
  recipientId: string | null;
  sourceCurrency: 'USD' | 'EUR' | 'GBP';
  amountText: string;
  locale: 'en-US' | 'de-DE' | 'pl-PL' | 'en-IN';
  showErrors: boolean;
  errorFocusKey: number;
};

const initialState: DraftState = {
  recipientId: null,
  sourceCurrency: 'USD',
  amountText: '',
  locale: 'en-US',
  showErrors: false,
  errorFocusKey: 0,
};

export const draftSlice = createSlice({
  name: 'draft',
  initialState,
  reducers: {
    setRecipient: (state, action) => {
      state.recipientId = action.payload;
    },
    setSourceCurrency: (state, action) => {
      state.sourceCurrency = action.payload;
    },
    setAmountText: (state, action) => {
      state.amountText = action.payload;
    },
    setLocale: (state, action) => {
      state.locale = action.payload;
    },
    attemptFailed: (state) => {
      state.showErrors = true;
      state.errorFocusKey += 1;
    },
    resetDraft: () => initialState,
    hydrateDraft: (_state, action) => action.payload,
  },
});

export const {
  setRecipient,
  setSourceCurrency,
  setAmountText,
  setLocale,
  attemptFailed,
  resetDraft,
  hydrateDraft,
} = draftSlice.actions;
