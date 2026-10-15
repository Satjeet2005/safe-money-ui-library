import { parseBoundary } from '@satjeetsingh1/safe-money-ui/boundary';
import { ChaosConfig, type ChaosConfigPayload } from './schemas.js';

export const DEFAULT_CHAOS_CONFIG: ChaosConfigPayload = {
  latencyMs: 0,
  hangForever: false,
  lateResponseMs: 0,
  malformedPayload: false,
  inconsistentPayload: false,
  rejectWith: 'none',
  loseResponse: false,
  rateMoves: false,
  corruptStorage: false,
};

/**
 * Parses chaos configuration from URL query params.
 * @example parseChaosFromUrl('?chaos=%7B%7D')
 */
export function parseChaosFromUrl(search: string): {
  config: ChaosConfigPayload | null;
  isInvalid: boolean;
} {
  const params = new URLSearchParams(search);
  const chaosParam = params.get('chaos');
  if (!chaosParam) {
    return { config: null, isInvalid: false };
  }

  try {
    const raw = JSON.parse(decodeURIComponent(chaosParam));
    const result = parseBoundary('Chaos URL config', ChaosConfig, raw);
    if (result.ok) {
      return { config: result.value, isInvalid: false };
    }
    return { config: null, isInvalid: true };
  } catch {
    return { config: null, isInvalid: true };
  }
}

/**
 * Corrupts the persisted draft in sessionStorage for chaos testing.
 * @example applyCorruptStorage()
 */
export function applyCorruptStorage(): void {
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('smu.draft.v1', '{"version":2,"junk":true}');
    }
  } catch {
    // Ignore storage errors in non-browser environments
  }
}

/**
 * Sets up the window.__smu debug hook if deterministic mode is enabled.
 * @example setupDeterministicDebugHook(service.debug, true)
 */
export function setupDeterministicDebugHook(debugObject: unknown, deterministic: boolean): void {
  if (typeof window !== 'undefined' || typeof globalThis !== 'undefined') {
    const target = (typeof window !== 'undefined' ? window : globalThis) as Record<string, unknown>;
    if (deterministic) {
      target['__smu'] = debugObject;
    } else {
      delete target['__smu'];
    }
  }
}
