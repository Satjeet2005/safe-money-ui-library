import { createSlice } from '@reduxjs/toolkit';

export type DataStatus = 'idle' | 'loading' | 'ready' | 'failed';

export type DataState = {
  accounts: unknown[] | null;
  recipients: unknown[] | null;
  accountsStatus: DataStatus;
  recipientsStatus: DataStatus;
};

const initialState: DataState = {
  accounts: null,
  recipients: null,
  accountsStatus: 'idle',
  recipientsStatus: 'idle',
};

export const dataSlice = createSlice({
  name: 'data',
  initialState,
  reducers: {
    setAccounts: (state, action) => {
      state.accounts = action.payload;
      state.accountsStatus = 'ready';
    },
    setRecipients: (state, action) => {
      state.recipients = action.payload;
      state.recipientsStatus = 'ready';
    },
    setAccountsStatus: (state, action) => {
      state.accountsStatus = action.payload;
    },
    setRecipientsStatus: (state, action) => {
      state.recipientsStatus = action.payload;
    },
  },
});

export const { setAccounts, setRecipients, setAccountsStatus, setRecipientsStatus } =
  dataSlice.actions;
