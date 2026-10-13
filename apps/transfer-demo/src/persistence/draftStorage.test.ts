import { loadDraft, saveDraft, clearDraft, DRAFT_STORAGE_KEY } from './draftStorage.js';

describe('draftStorage (DS-01..DS-04)', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('DS-01: valid draft round-trips through sessionStorage, preserving its supported fields', () => {
    const validDraft = {
      version: 1 as const,
      recipientId: 'rcp-001',
      sourceCurrency: 'USD' as const,
      amountText: '100.00',
    };

    saveDraft(validDraft);

    const storedRaw = sessionStorage.getItem(DRAFT_STORAGE_KEY);
    expect(storedRaw).not.toBeNull();
    expect(JSON.parse(storedRaw!)).toEqual(validDraft);

    const loaded = loadDraft();
    expect(loaded.discarded).toBe(false);
    expect(loaded.draft).toEqual(validDraft);

    clearDraft();
    expect(sessionStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull();
    const emptyLoad = loadDraft();
    expect(emptyLoad.discarded).toBe(false);
    expect(emptyLoad.draft).toBeNull();
  });

  it('DS-02: a persisted value with a wrong version is discarded', () => {
    const invalidVersion = {
      version: 2,
      recipientId: 'rcp-001',
      sourceCurrency: 'USD',
      amountText: '100.00',
    };
    sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(invalidVersion));

    const loaded = loadDraft();
    expect(loaded.draft).toBeNull();
    expect(loaded.discarded).toBe(true);
    expect(sessionStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull();
  });

  it('DS-03: malformed JSON is discarded without crashing the app', () => {
    sessionStorage.setItem(DRAFT_STORAGE_KEY, '{invalid-json:::');

    const loaded = loadDraft();
    expect(loaded.draft).toBeNull();
    expect(loaded.discarded).toBe(true);
    expect(sessionStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull();
  });

  it('DS-04: a value with incorrect field types is discarded without crashing the app', () => {
    // recipientId as a number instead of string or null
    sessionStorage.setItem(
      DRAFT_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        recipientId: 12345,
        sourceCurrency: 'USD',
        amountText: '100.00',
      }),
    );
    let loaded = loadDraft();
    expect(loaded.draft).toBeNull();
    expect(loaded.discarded).toBe(true);
    expect(sessionStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull();

    // Invalid source currency (e.g. JPY is a valid currency, but not a SourceCurrency)
    sessionStorage.setItem(
      DRAFT_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        recipientId: 'rcp-001',
        sourceCurrency: 'JPY',
        amountText: '100',
      }),
    );
    loaded = loadDraft();
    expect(loaded.draft).toBeNull();
    expect(loaded.discarded).toBe(true);
    expect(sessionStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull();

    // amountText longer than 40 chars
    sessionStorage.setItem(
      DRAFT_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        recipientId: 'rcp-001',
        sourceCurrency: 'USD',
        amountText: '1'.repeat(45),
      }),
    );
    loaded = loadDraft();
    expect(loaded.draft).toBeNull();
    expect(loaded.discarded).toBe(true);
    expect(sessionStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull();
  });
});
