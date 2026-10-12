import { parseBoundary } from '@satjeet2005/safe-money-ui/boundary';
import { PersistedDraft } from '../service/schemas.js';

export const DRAFT_STORAGE_KEY = 'smu.draft.v1';

export type PersistedDraftData = {
  version: 1;
  recipientId: string | null;
  sourceCurrency: 'USD' | 'EUR' | 'GBP';
  amountText: string;
};

/**
 * Loads and validates saved draft from sessionStorage.
 * @example loadDraft()
 */
export function loadDraft(): {
  draft: PersistedDraftData | null;
  discarded: boolean;
} {
  try {
    const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) {
      return { draft: null, discarded: false };
    }
    const parsed = JSON.parse(raw);
    const result = parseBoundary('Persisted draft', PersistedDraft, parsed);
    if (result.ok) {
      return { draft: result.value, discarded: false };
    }
    sessionStorage.removeItem(DRAFT_STORAGE_KEY);
    return { draft: null, discarded: true };
  } catch {
    sessionStorage.removeItem(DRAFT_STORAGE_KEY);
    return { draft: null, discarded: true };
  }
}

/**
 * Saves draft to sessionStorage.
 * @example saveDraft(data)
 */
export function saveDraft(data: PersistedDraftData): void {
  sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(data));
}

/**
 * Clears saved draft from sessionStorage.
 * @example clearDraft()
 */
export function clearDraft(): void {
  sessionStorage.removeItem(DRAFT_STORAGE_KEY);
}
