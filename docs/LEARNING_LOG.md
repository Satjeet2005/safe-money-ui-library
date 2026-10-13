# Learning Log

Record of technical concepts, tools, and lessons learned across each work package.

## WP-01: Repository Scaffold

- **Tools used:** pnpm workspaces, Corepack, Node.js 22 LTS, strict TypeScript, ESLint (flat config), Prettier.
- **Concept:** Setting up a monorepo with strict boundary isolation between the reusable library (`@satjeet2005/safe-money-ui`) and the demo consumer application (`transfer-demo`).
- **How it works:** Corepack pins the exact package manager version; strict compiler options ensure full type safety with no unchecked indexed access or loose optional properties.

## WP-02: Jest, SWC and Test Infrastructure

- **Tools used:** Jest 29, `@swc/jest`, `jest-environment-jsdom`, `@testing-library/react`, `jest-axe`, `fast-check`, `ts-node`.
- **Concept:** Fast unit and component test execution across packages using SWC transpilation without ts-jest overhead, combined with deterministic fake timers and clock helpers.
- **How it works:** `@swc/jest` compiles TypeScript and JSX with automatic React runtime; `setup.ts` extends Jest expectations with accessibility assertions via `jest-axe`; `fakeScheduler` and `fakeClock` give deterministic time control for async state-machine and network tests.

## WP-03: CI, Metrics Scaffold and Verification Scripts

- **Tools used:** GitHub Actions, Node.js `zlib.gzipSync`, regex pattern analysis, PyYAML.
- **Concept:** Continuous verification gates and honest metrics enforcement to guarantee reproducibility and prevent deceptive or untracked claims.
- **How it works:** `ci.yml` orchestrates 4 independent jobs (`verify`, `property`, `e2e`, `mutation`); `size.mjs` verifies gzip budgets per module; `claims-check.mjs` validates metric markers against `METRICS.md`, bans forbidden marketing claims, and verifies mandatory AI disclosures.

## WP-04: Currency Model and createMoney

- **Tools used:** TypeScript strict typing, Jest, TDD assertions.
- **Concept:** Representation of monetary amounts as non-negative safe integers in minor currency units (bounded by `MAX_MINOR = 10^12`) to eliminate floating-point inaccuracies.
- **How it works:** `CURRENCIES` records exact decimal precision for 7 ISO currencies; `createMoney` acts as the single invariant gate, rejecting negative, fractional, NaN, non-finite, unsafe, or out-of-bounds numbers by throwing `RangeError`.

## WP-05: Locale-Aware Money Parsing

- **Tools used:** TypeScript, Jest, BigInt string-based math, TDD red/green workflow.
- **Concept:** Deterministic, locale-aware parsing of user string input into integer minor units without IEEE 754 floating-point inaccuracies.
- **How it works:** Implements a strict 12-step validation pipeline checking trimming, negative signs, locale-permitted separators, canonical grouping regexes, currency-specific decimal bounds, and safe magnitude (`MAX_MINOR = 10^12`) using `BigInt` scaling.

## WP-06: Locale-Aware Money Formatting

- **Tools used:** TypeScript strict types, `Intl.NumberFormat`, BigInt string arithmetic, Jest.
- **Concept:** Dual formatting architecture separating input field formatting from display localization to ensure lossless round-trip parse/format consistency without floating-point hazards.
- **How it works:** `formatAmountInput` formats purely from integer minor units using a hard-coded separator table matching the parser, while `formatMoney` converts minor units into an exact decimal string passed to `Intl.NumberFormat` via a narrow type compatibility bridge.

## WP-07: FX Conversion and Fees

- **Tools used:** BigInt exact integer arithmetic, Banker's rounding (round-half-to-even), Jest.
- **Concept:** Lossless multi-currency conversion and percentage fee calculation without floating-point drift.
- **How it works:** `convert` scales decimal exponents via `BigInt` power factors and fixed USD micro-rates, rounding once at the quotient end with half-even parity rules; `computeFee` calculates cross-currency fees in source currency with a 100 minor unit floor while preserving zero fee for same-currency transfers.
