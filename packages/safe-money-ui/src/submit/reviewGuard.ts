export type ReviewSnapshot = Record<string, string | number | boolean>;

export type ReviewGuard<T extends ReviewSnapshot> = {
  capture(snapshot: T): void;
  check(live: T): { ok: true } | { ok: false; changed: ReadonlyArray<keyof T> };
  clear(): void;
  hasSnapshot(): boolean;
};

/**
 * Creates a review guard to ensure transaction parameters do not change between review and confirm.
 * @example const guard = createReviewGuard()
 */
export function createReviewGuard<T extends ReviewSnapshot>(): ReviewGuard<T> {
  let savedSnapshot: T | null = null;

  return {
    capture(snapshot) {
      savedSnapshot = Object.freeze({ ...snapshot });
    },
    check(live) {
      if (!savedSnapshot) {
        return { ok: false, changed: [] };
      }
      const keys = new Set([...Object.keys(savedSnapshot), ...Object.keys(live)]) as Set<keyof T>;
      const changed: Array<keyof T> = [];
      for (const k of keys) {
        if (!Object.is(savedSnapshot[k], live[k])) {
          changed.push(k);
        }
      }
      if (changed.length > 0) {
        return { ok: false, changed };
      }
      return { ok: true };
    },
    clear() {
      savedSnapshot = null;
    },
    hasSnapshot() {
      return savedSnapshot !== null;
    },
  };
}
