import { useEffect, useRef } from 'react';
import { loadAccounts, loadRecipients } from '../store/dataSlice.js';
import { hydrateDraft, type DraftState } from '../store/draftSlice.js';
import { setBanner } from '../store/flowSlice.js';
import type { AppDispatch } from '../store/store.js';
import { loadDraft, saveDraft } from '../persistence/draftStorage.js';

/**
 * Handles hydrating saved draft from storage and saving draft updates.
 * @example
 * ```ts
 * useDraftPersistence(dispatch, draft);
 * ```
 */
export function useDraftPersistence(dispatch: AppDispatch, draft: DraftState): void {
  const initializedRef = useRef(false);
  const prevDraftRef = useRef<{
    recipientId: string | null;
    sourceCurrency: string;
    amountText: string;
  } | null>(null);

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      const { draft: saved, discarded } = loadDraft();
      if (discarded) {
        dispatch(setBanner({ kind: 'warning', copyKey: 'draft.discarded' }));
        prevDraftRef.current = {
          recipientId: draft.recipientId,
          sourceCurrency: draft.sourceCurrency,
          amountText: draft.amountText,
        };
      } else if (saved) {
        prevDraftRef.current = {
          recipientId: saved.recipientId,
          sourceCurrency: saved.sourceCurrency,
          amountText: saved.amountText,
        };
        dispatch(
          hydrateDraft({
            recipientId: saved.recipientId,
            sourceCurrency: saved.sourceCurrency,
            amountText: saved.amountText,
          }),
        );
      } else {
        prevDraftRef.current = {
          recipientId: draft.recipientId,
          sourceCurrency: draft.sourceCurrency,
          amountText: draft.amountText,
        };
      }
    }
  }, [dispatch, draft.recipientId, draft.sourceCurrency, draft.amountText]);

  useEffect(() => {
    if (prevDraftRef.current) {
      const hasChanged =
        draft.recipientId !== prevDraftRef.current.recipientId ||
        draft.sourceCurrency !== prevDraftRef.current.sourceCurrency ||
        draft.amountText !== prevDraftRef.current.amountText;

      if (hasChanged) {
        prevDraftRef.current = {
          recipientId: draft.recipientId,
          sourceCurrency: draft.sourceCurrency,
          amountText: draft.amountText,
        };
        saveDraft({
          version: 1,
          recipientId: draft.recipientId,
          sourceCurrency: draft.sourceCurrency,
          amountText: draft.amountText,
        });
      }
    }
  }, [draft.recipientId, draft.sourceCurrency, draft.amountText]);
}

/**
 * Loads accounts and recipients if their status is idle.
 * @example
 * ```ts
 * useInitialDataLoad(dispatch, accountsStatus, recipientsStatus);
 * ```
 */
export function useInitialDataLoad(
  dispatch: AppDispatch,
  accountsStatus: string,
  recipientsStatus: string,
): void {
  useEffect(() => {
    if (accountsStatus === 'idle') {
      void dispatch(loadAccounts());
    }
    if (recipientsStatus === 'idle') {
      void dispatch(loadRecipients());
    }
  }, [dispatch, accountsStatus, recipientsStatus]);
}
