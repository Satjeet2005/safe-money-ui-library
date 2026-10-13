import {
  DEFAULT_CHAOS_CONFIG,
  parseChaosFromUrl,
  applyCorruptStorage,
  setupDeterministicDebugHook,
} from '../../src/service/chaos.js';
import { createIdGenerator } from '../../src/service/ids.js';

describe('WP-16: Chaos Configuration, URL Presets, Deterministic Mode', () => {
  const sessionStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value.toString();
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
    };
  })();

  beforeAll(() => {
    Object.defineProperty(globalThis, 'sessionStorage', {
      value: sessionStorageMock,
      writable: true,
    });
  });

  beforeEach(() => {
    sessionStorage.clear();
    delete (globalThis as any).__smu;
  });

  test('DEFAULT_CHAOS_CONFIG has exact PRD defaults', () => {
    expect(DEFAULT_CHAOS_CONFIG).toEqual({
      latencyMs: 0,
      hangForever: false,
      lateResponseMs: 0,
      malformedPayload: false,
      inconsistentPayload: false,
      rejectWith: 'none',
      loseResponse: false,
      rateMoves: false,
      corruptStorage: false,
    });
  });

  test('parseChaosFromUrl: valid preset in ?chaos URL parameter is parsed and applied', () => {
    const preset = {
      latencyMs: 3000,
      hangForever: false,
      lateResponseMs: 0,
      malformedPayload: true,
      inconsistentPayload: false,
      rejectWith: 'none',
      loseResponse: false,
      rateMoves: false,
      corruptStorage: false,
    };
    const search = `?chaos=${encodeURIComponent(JSON.stringify(preset))}`;
    const result = parseChaosFromUrl(search);

    expect(result.isInvalid).toBe(false);
    expect(result.config).toEqual(preset);
  });

  test('parseChaosFromUrl: invalid preset in ?chaos URL parameter is flagged as invalid and returns null config', () => {
    const invalidPreset = {
      latencyMs: 99999, // invalid literal
      hangForever: 'not-a-boolean',
    };
    const search = `?chaos=${encodeURIComponent(JSON.stringify(invalidPreset))}`;
    const result = parseChaosFromUrl(search);

    expect(result.isInvalid).toBe(true);
    expect(result.config).toBeNull();

    // Malformed JSON string
    const malformedSearch = '?chaos=NOT_JSON_AT_ALL';
    const malformedResult = parseChaosFromUrl(malformedSearch);
    expect(malformedResult.isInvalid).toBe(true);
    expect(malformedResult.config).toBeNull();
  });

  test('parseChaosFromUrl: strips unknown properties from incoming JSON preset', () => {
    const presetWithUnknown = {
      latencyMs: 500,
      hangForever: false,
      lateResponseMs: 0,
      malformedPayload: false,
      inconsistentPayload: false,
      rejectWith: 'none',
      loseResponse: false,
      rateMoves: false,
      corruptStorage: false,
      evilInjectedField: 'hack',
    };
    const search = `?chaos=${encodeURIComponent(JSON.stringify(presetWithUnknown))}`;
    const result = parseChaosFromUrl(search);

    expect(result.isInvalid).toBe(false);
    expect(result.config).not.toBeNull();
    expect((result.config as any).evilInjectedField).toBeUndefined();
  });

  test('applyCorruptStorage writes {"version":2,"junk":true} to sessionStorage["smu.draft.v1"]', () => {
    applyCorruptStorage();
    expect(sessionStorage.getItem('smu.draft.v1')).toBe('{"version":2,"junk":true}');
  });

  test('setupDeterministicDebugHook exposes window.__smu only when deterministic mode is enabled', () => {
    const mockDebug = {
      executedCount: () => 42,
      balances: () => ({ USD: 500_000 }),
      transferIds: () => ['TRF-000001'],
    };

    // When deterministic = false
    setupDeterministicDebugHook(mockDebug, false);
    expect((globalThis as any).__smu).toBeUndefined();

    // When deterministic = true
    setupDeterministicDebugHook(mockDebug, true);
    expect((globalThis as any).__smu).toBe(mockDebug);
    expect((globalThis as any).__smu.executedCount()).toBe(42);
  });

  test('Deterministic mode produces counter-based idempotency keys idem-000001..', () => {
    const ids = createIdGenerator(true);
    expect(ids.idempotencyKey()).toBe('idem-000001');
    expect(ids.idempotencyKey()).toBe('idem-000002');
  });
});
