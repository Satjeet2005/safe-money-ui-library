import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { parseBoundary } from '@satjeet2005/safe-money-ui/boundary';
import { parseAmount, type CurrencyCode } from '@satjeet2005/safe-money-ui/money';
import type { CopyKey } from '../copy.js';
import { QuoteResponse } from '../service/schemas.js';
import type { z } from 'zod';
import type { ThunkExtra, RootState } from './store.js';

export type FlowStep = 'form' | 'review' | 'result';

export type QuotePayload = z.infer<typeof QuoteResponse>;

export type ReviewSnapshot = Readonly<{
  recipientId: string;
  quoteId: string;
  sourceCurrency: string;
  sourceMinor: number;
  feeMinor: number;
  targetCurrency: string;
  targetMinor: number;
}>;

export type FlowState = {
  step: FlowStep;
  quote: QuotePayload | null;
  snapshot: ReviewSnapshot | null;
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

export type FetchQuoteArg = {
  recipientId?: string;
  sourceCurrency?: string;
  sourceMinor?: number;
} | void;

export const fetchQuote = createAsyncThunk<
  { quote: QuotePayload; snapshot: ReviewSnapshot },
  FetchQuoteArg,
  { extra: ThunkExtra; state: RootState }
>('flow/fetchQuote', async (arg, { extra, getState, dispatch, rejectWithValue, signal }) => {
  const state = getState();
  const recipientId = arg?.recipientId ?? state.draft.recipientId;
  const sourceCurrency = arg?.sourceCurrency ?? state.draft.sourceCurrency;
  let sourceMinor = arg?.sourceMinor;

  if (sourceMinor === undefined) {
    const parsed = parseAmount(state.draft.amountText, {
      currency: sourceCurrency as CurrencyCode,
      locale: state.draft.locale,
    });
    if (!parsed.ok) {
      dispatch(setQuoteStatus('failed'));
      dispatch(setBanner({ kind: 'error', copyKey: 'quote.failed' }));
      return rejectWithValue('Invalid draft amount');
    }
    sourceMinor = parsed.money.minor;
  }

  if (!recipientId) {
    dispatch(setQuoteStatus('failed'));
    dispatch(setBanner({ kind: 'error', copyKey: 'quote.failed' }));
    return rejectWithValue('Recipient is required');
  }

  dispatch(setQuoteStatus('loading'));
  dispatch(clearBanner());

  try {
    const raw = await extra.service.getQuote(
      { recipientId, sourceCurrency, sourceMinor },
      { signal },
    );
    const result = parseBoundary('QuoteResponse', QuoteResponse, raw);
    if (!result.ok) {
      dispatch(setQuoteStatus('failed'));
      dispatch(setBanner({ kind: 'error', copyKey: 'quote.failed' }));
      return rejectWithValue(result.error.message);
    }
    const quote = result.value;
    const snapshot: ReviewSnapshot = {
      recipientId,
      quoteId: quote.quoteId,
      sourceCurrency: quote.source.currency,
      sourceMinor: quote.source.minor,
      feeMinor: quote.feeMinor,
      targetCurrency: quote.target.currency,
      targetMinor: quote.target.minor,
    };
    dispatch(goToReview({ quote, snapshot }));
    return { quote, snapshot };
  } catch (err) {
    dispatch(setQuoteStatus('failed'));
    dispatch(setBanner({ kind: 'error', copyKey: 'quote.failed' }));
    return rejectWithValue(err instanceof Error ? err.message : String(err));
  }
});

export const flowSlice = createSlice({
  name: 'flow',
  initialState,
  reducers: {
    goToForm: (state) => {
      state.step = 'form';
    },
    goToReview: (
      state,
      action: PayloadAction<{ quote: QuotePayload; snapshot: ReviewSnapshot }>,
    ) => {
      state.step = 'review';
      state.quote = action.payload.quote;
      state.snapshot = action.payload.snapshot;
      state.quoteStatus = 'idle';
    },
    goToResult: (state) => {
      state.step = 'result';
    },
    setQuoteStatus: (state, action: PayloadAction<'idle' | 'loading' | 'failed'>) => {
      state.quoteStatus = action.payload;
    },
    setBanner: (
      state,
      action: PayloadAction<{ kind: 'info' | 'warning' | 'error'; copyKey: CopyKey } | null>,
    ) => {
      state.banner = action.payload;
    },
    clearBanner: (state) => {
      state.banner = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchQuote.pending, (state) => {
        state.quoteStatus = 'loading';
      })
      .addCase(fetchQuote.rejected, (state) => {
        state.quoteStatus = 'failed';
        state.banner = { kind: 'error', copyKey: 'quote.failed' };
      });
  },
});

export const { goToForm, goToReview, goToResult, setQuoteStatus, setBanner, clearBanner } =
  flowSlice.actions;
