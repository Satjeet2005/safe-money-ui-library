import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { parseBoundary } from '@satjeetsingh1/safe-money-ui/boundary';
import { AccountsResponse, RecipientsResponse } from '../service/schemas.js';
import { setBanner } from './flowSlice.js';
import type { z } from 'zod';
import type { ThunkExtra } from './store.js';

export type DataStatus = 'idle' | 'loading' | 'ready' | 'failed';

export type Account = z.infer<typeof AccountsResponse>['accounts'][number];
export type Recipient = z.infer<typeof RecipientsResponse>['recipients'][number];

export type DataState = {
  accounts: Account[] | null;
  recipients: Recipient[] | null;
  accountsStatus: DataStatus;
  recipientsStatus: DataStatus;
};

const initialState: DataState = {
  accounts: null,
  recipients: null,
  accountsStatus: 'idle',
  recipientsStatus: 'idle',
};

export const loadAccounts = createAsyncThunk<Account[], void, { extra: ThunkExtra }>(
  'data/loadAccounts',
  async (_arg, { extra, dispatch, rejectWithValue, signal }) => {
    try {
      const raw = await extra.service.getAccounts({ signal });
      const result = parseBoundary('AccountsResponse', AccountsResponse, raw);
      if (!result.ok) {
        dispatch(setBanner({ kind: 'error', copyKey: 'load.accounts.failed' }));
        return rejectWithValue(result.error.message);
      }
      return result.value.accounts;
    } catch (err) {
      dispatch(setBanner({ kind: 'error', copyKey: 'load.accounts.failed' }));
      return rejectWithValue(err instanceof Error ? err.message : String(err));
    }
  },
);

export const loadRecipients = createAsyncThunk<Recipient[], void, { extra: ThunkExtra }>(
  'data/loadRecipients',
  async (_arg, { extra, dispatch, rejectWithValue, signal }) => {
    try {
      const raw = await extra.service.getRecipients({ signal });
      const result = parseBoundary('RecipientsResponse', RecipientsResponse, raw);
      if (!result.ok) {
        dispatch(setBanner({ kind: 'error', copyKey: 'load.recipients.failed' }));
        return rejectWithValue(result.error.message);
      }
      return result.value.recipients;
    } catch (err) {
      dispatch(setBanner({ kind: 'error', copyKey: 'load.recipients.failed' }));
      return rejectWithValue(err instanceof Error ? err.message : String(err));
    }
  },
);

export const dataSlice = createSlice({
  name: 'data',
  initialState,
  reducers: {
    setAccounts: (state, action: PayloadAction<Account[] | null>) => {
      state.accounts = action.payload;
      state.accountsStatus = 'ready';
    },
    setRecipients: (state, action: PayloadAction<Recipient[] | null>) => {
      state.recipients = action.payload;
      state.recipientsStatus = 'ready';
    },
    setAccountsStatus: (state, action: PayloadAction<DataStatus>) => {
      state.accountsStatus = action.payload;
    },
    setRecipientsStatus: (state, action: PayloadAction<DataStatus>) => {
      state.recipientsStatus = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadAccounts.pending, (state) => {
        state.accountsStatus = 'loading';
      })
      .addCase(loadAccounts.fulfilled, (state, action) => {
        state.accounts = action.payload;
        state.accountsStatus = 'ready';
      })
      .addCase(loadAccounts.rejected, (state) => {
        state.accountsStatus = 'failed';
      })
      .addCase(loadRecipients.pending, (state) => {
        state.recipientsStatus = 'loading';
      })
      .addCase(loadRecipients.fulfilled, (state, action) => {
        state.recipients = action.payload;
        state.recipientsStatus = 'ready';
      })
      .addCase(loadRecipients.rejected, (state) => {
        state.recipientsStatus = 'failed';
      });
  },
});

export const { setAccounts, setRecipients, setAccountsStatus, setRecipientsStatus } =
  dataSlice.actions;
