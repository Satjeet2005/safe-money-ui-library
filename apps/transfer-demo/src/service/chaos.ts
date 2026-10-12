import { parseBoundary } from '@satjeet2005/safe-money-ui/boundary';
import { ChaosConfig, type ChaosConfigPayload } from './schemas.js';

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
