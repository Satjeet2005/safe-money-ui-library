# Explainer: review-guard

## What it does

`packages/safe-money-ui/src/submit/reviewGuard.ts` and `useReviewGuard.ts` provide client-side parameter tamper and drift protection. It snapshots transfer parameters when navigating to the review step and verifies them immediately before final submission.

## Why it exists

In multi-step payment flows, form fields can drift or be modified after the user has reviewed transfer details (e.g., via background tab activity, back-button navigation, or stale closures). The review guard ensures the user confirms exactly the parameters they inspected, preventing accidental or silent financial discrepancies.

## How it works

1. Exposes `capture(snapshot)` and `verify(current)` methods.
2. `capture` takes a key-value record and stores an immutable, frozen shallow clone via `Object.freeze`.
3. `verify` checks whether `capture` was called; returns `{ ok: false, reason: 'NO_SNAPSHOT' }` if missing.
4. Gathers the symmetric union of all keys present in both the snapshot and current objects.
5. Iterates through all keys and compares values using `Object.is` for exact value equality.
6. Detects added keys: present in current but absent in snapshot.
7. Detects removed keys: present in snapshot but absent in current.
8. Detects modified keys: present in both with mismatched values.
9. Aggregates all detected differences into a typed `diffs` array.
10. If `diffs` is empty, returns `{ ok: true }`.
11. If `diffs` contains discrepancies, returns `{ ok: false, reason: 'MUTATED', diffs }`.

## Trade-offs

The guard uses shallow `Object.is` comparison rather than deep recursive object diffing. Because transfer parameters in this architecture are modeled as flat key-value records of primitives and immutable `Money` objects, shallow comparison offers maximum performance and eliminates circular reference or prototype traversal risks.

## How it is tested

- Unit tests in `packages/safe-money-ui/test/submit/reviewGuard.test.ts` verify cases `RG-01` through `RG-05` (missing snapshots, pristine snapshots, value mutations, added/removed keys).
- Hook tests in `packages/safe-money-ui/test/react/hooks.test.tsx` verify stable guard instance persistence across component re-renders.
- Cypress journey J7 (`j7-stale-details.cy.ts`) tests real-browser parameter drift handling and user redirection.

## Questions an interviewer may ask

1. Why is `Object.is` used instead of the strict equality operator (`===`) for comparing snapshot values?
2. How does the application respond when `verify` returns `{ ok: false, reason: 'MUTATED' }`?
3. Why does `capture` freeze the stored snapshot object?
