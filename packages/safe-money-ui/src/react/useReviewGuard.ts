import { useRef } from 'react';
import { createReviewGuard, type ReviewGuard, type ReviewSnapshot } from '../submit/reviewGuard.js';

/**
 * Hook providing a stable review guard instance.
 * @example const guard = useReviewGuard()
 */
export function useReviewGuard<T extends ReviewSnapshot>(): ReviewGuard<T> {
  const guardRef = useRef<ReviewGuard<T> | null>(null);
  if (!guardRef.current) {
    guardRef.current = createReviewGuard<T>();
  }
  return guardRef.current;
}
