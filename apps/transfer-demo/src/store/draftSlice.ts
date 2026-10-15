import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { LocaleCode } from '@satjeetsingh1/safe-money-ui/money';
import type { z } from 'zod';
import type { SourceCurrency } from '../service/schemas.js';

export type DraftState = {
  recipientId: string | null;
  sourceCurrency: z.infer<typeof SourceCurrency>;
  amountText: string;
  locale: LocaleCode;
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
    setRecipient: (state, action: PayloadAction<string | null>) => {
      state.recipientId = action.payload;
    },
    setSourceCurrency: (state, action: PayloadAction<z.infer<typeof SourceCurrency>>) => {
      state.sourceCurrency = action.payload;
    },
    setAmountText: (state, action: PayloadAction<string>) => {
      state.amountText = action.payload;
    },
    setLocale: (state, action: PayloadAction<LocaleCode>) => {
      state.locale = action.payload;
    },
    attemptFailed: (state) => {
      state.showErrors = true;
      state.errorFocusKey += 1;
    },
    resetDraft: () => initialState,
    hydrateDraft: (state, action: PayloadAction<Partial<DraftState>>) => {
      Object.assign(state, action.payload);
    },
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
