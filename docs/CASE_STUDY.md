# Case Study: safe-money-ui

## The problem

Payment interfaces can show misleading states when input formatting is ambiguous, buttons are clicked repeatedly, or network responses are delayed or lost. In typical web forms, double-clicking triggers redundant submissions, floating-point math causes rounding discrepancies, and timeouts leave an end user uncertain whether money was sent. If an interface blindly reports failure when a backend transfer succeeded, retrying duplicates the debit. Conversely, assuming success on malformed payloads creates false confidence.

## What I built

I built `safe-money-ui`, a TypeScript and React library paired with a reference transfer demo enforcing money correctness and defensive submit orchestration.

The library models monetary values as integer minor units using `BigInt` scaling, validates inputs against strict locale grouping rules, and coordinates submit lifecycles through a pure finite-state reducer. A review guard snapshot freezes parameters, halting submission if values change before confirmation.

The transfer demo connects these primitives to a simulated service with a chaos control panel. The panel injects faults—dropped responses, network hangs, rate shifts, and malformed payloads—so a reviewer can verify client resilience. Exchange rates, fees, and service responses are simulated and fictional.

The repository verification suite includes <!-- metric:tests_total -->400<!-- /metric --> passing tests, property tests with <!-- metric:property_runs -->1000<!-- /metric --> iterations, a Stryker mutation score of <!-- metric:mutation_score -->90.63%<!-- /metric -->, and <!-- metric:journeys_passed -->8<!-- /metric --> Cypress journeys.

## One decision and its trade-off

I decided that retrying an unconfirmed transfer reuses the existing idempotency key rather than blocking the person or generating a fresh key.

When a request times out or its response is lost, the client cannot know if the server executed the transfer. Generating a new key on retry risks a double debit if the server processed the original attempt. Reusing the key permits recovery: an executed transfer replays the existing record without second execution, while an unreceived request executes normally.

The trade-off is that this client strategy depends on the backend implementing reliable idempotency handling. If a server lacks idempotency support, key reuse cannot prevent duplicate side effects.

## Limitations

- The project does not prove performance, security, or scale; there is no real backend, real money, or authentication.
- The service is a simulation written by the same author; passing tests show client logic consistency, not how a real payment API behaves.
- Coverage and mutation score indicate test strength, not proof of correctness.
- Automated Axe checks catch only part of accessibility issues; they do not establish conformance. Manual screen-reader checks are reported only where `docs/A11Y_MANUAL.md` records them.
- Currency formatting depends on browser or Node `Intl` data.
- Exchange rates and fees are fictional.
- No usability study was done unless `docs/USABILITY_CHECK.md` records one, and then it is a small informal sample.

## What I learned

Building this project deepened my understanding of several core tools:

- **Redux Toolkit:** Structuring isolated slices and injecting dependencies via thunk `extraArgument`, keeping async flows testable without singletons.
- **Jest:** Using SWC for fast execution and pairing unit assertions with fast-check property testing.
- **Cypress:** Driving deterministic end-to-end journeys using `cy.clock` and `cy.tick` rather than arbitrary wait timers.
- **Webpack:** Configuring SWC loaders, style extraction, and cross-toolchain path alias parity.
- **Zod:** Applying boundary schemas to insulate application state against unexpected payload shapes and corrupted storage.
