# Explainer: stryker-setup

## What it does

`packages/safe-money-ui/stryker.config.mjs` configures Stryker mutation testing for the core `money` and `submit` library packages, measuring test suite assertion strength by systematically injecting artificial bugs (mutants) into source code.

## Why it exists

Traditional code coverage only measures whether lines of code were executed during tests, not whether the test assertions actually verify behavior or catch regressions. Mutation testing modifies conditional operators, mathematical operations, and return values to confirm that tests fail when logic changes.

## How it works

1. Configures `@stryker-mutator/jest-runner` using `jest.config.ts`.
2. Configures `@stryker-mutator/typescript-checker` using `tsconfig.json`.
3. Targets core domain logic: `src/money/**/*.ts` and `src/submit/**/*.ts`.
4. Excludes barrel files (`!src/**/index.ts`) to prevent trivial re-export mutations.
5. Uses `perTest` coverage analysis to run only tests that execute mutated source lines.
6. Sets mutation score thresholds: break at 80%, low at 85%, high at 90%.
7. Sets mutation timeout to 10,000ms.
8. Configures reporters: `clear-text`, `html`, and `json`.
9. Sets `FC_NUM_RUNS=50` during runs to prevent property tests from timing out during mutation cycles.

## Trade-offs

The configuration enables `perTest` coverage analysis rather than `all` or `off`. While `perTest` requires strict test isolation and no shared mutable state, it dramatically accelerates mutation testing by executing only the specific unit tests that exercise the mutated lines of code.

## How it is tested

- Configured and executed in WP-26, producing a verified mutation score of 90.63% (522 killed, 53 survived, 1 equivalent mutant documented), surpassing the 80% break threshold.
- Verified test suite additions in `test/submit/errors.test.ts` and `test/submit/controller.test.ts` to kill surviving mutants in error construction and listener unsubscribes.
- Mutation results are tracked in `docs/METRICS.md` and verified during quality gates.

## Questions an interviewer may ask

1. What is the fundamental difference between code coverage and mutation score?
2. What is an equivalent mutant, and why cannot automated tests kill it?
3. Why are property test run counts reduced during mutation testing runs?
