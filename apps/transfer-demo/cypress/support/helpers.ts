export interface SmuDebug {
  executedCount(): number;
  balances(): Record<string, number>;
  transferIds(): string[];
}

export const AXE_CONFIG = {
  runOnly: {
    type: 'tag' as const,
    values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
  },
};

export function buildDeterministicUrl(extraParams?: Record<string, string>): string {
  const params = new URLSearchParams({ deterministic: '1', ...extraParams });
  return `/?${params.toString()}`;
}

export function extractSmuDebug(win: unknown): SmuDebug {
  if (!win || typeof win !== 'object' || !('__smu' in win) || !(win as { __smu?: unknown }).__smu) {
    throw new Error(
      'window.__smu is not available. Ensure the journey visited /?deterministic=1 to activate deterministic mode.',
    );
  }
  return (win as { __smu: SmuDebug }).__smu;
}
