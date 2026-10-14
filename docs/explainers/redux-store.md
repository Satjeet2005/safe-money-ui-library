# Explainer: redux-store

## What it does

`apps/transfer-demo/src/store/store.ts` configures the Redux Toolkit store and slices (`draftSlice`, `flowSlice`, `dataSlice`, `chaosSlice`, `historySlice`) managing application state in the transfer reference demo.

## Why it exists

The multi-step payment demo requires coordinated state across forms, confirmation steps, outcome banners, local draft persistence, and developer chaos controls. Encapsulating this in Redux Toolkit isolates state management in the reference application while keeping the core library free of framework dependencies.

## How it works

1. Configures the root store via Redux Toolkit `configureStore` with 5 domain slices.
2. Injects the simulated service into thunks via `extraArgument` middleware configuration.
3. `draftSlice` manages form fields, currency selection, and touch states.
4. `flowSlice` tracks step transitions (`form`, `review`, `result`), quotes, and review snapshots.
5. `dataSlice` holds boundary-validated account balances and recipient lists.
6. `chaosSlice` stores active fault injection toggles and latency presets.
7. `historySlice` manages completed and unconfirmed transfer activity records.
8. Async thunks (`loadAccounts`, `loadRecipients`, `fetchQuote`) execute API calls through the injected service.
9. Thunks validate external responses with `parseBoundary` before committing to state.
10. `storageMiddleware` synchronizes draft state to `sessionStorage` with schema validation.

## Trade-offs

Redux Toolkit is used in the reference demo but completely excluded from the library package. This architectural trade-off keeps the library lightweight and unopinionated, allowing developers to embed its primitives into any state management solution (Redux, Zustand, or native React state).

## How it is tested

- Unit tests in `apps/transfer-demo/src/store/store.test.ts` verify all slice reducers, draft hydration, and async thunk lifecycles (success, network error, and boundary schema rejection).
- Screen tests in `SendForm.test.tsx`, `Review.test.tsx`, and `Result.test.tsx` verify store interactions.
- Cypress journeys J1 through J8 verify end-to-end state transitions across screens.

## Questions an interviewer may ask

1. Why is Redux Toolkit used in the demo application but omitted from the library package?
2. How does `extraArgument` enable clean dependency injection for asynchronous thunks in tests?
3. Why does `draftSlice` store raw amount strings rather than parsed minor unit integers?
