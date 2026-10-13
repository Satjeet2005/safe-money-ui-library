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

## WP-08: Public Money Entry, Build and Properties P1/P2/P4/P5

- **Tools used:** fast-check property testing, tsup multi-format bundler (ESM/CJS/DTS).
- **Concept:** Exposing a strictly bounded public domain API while proving end-to-end algebraic properties across arbitrary inputs.
- **How it works:** Wires `./money` and root `.` package exports without runtime imports; verifies parser totality (P5), round-trip format/parse identity (P1), optional grouping invariance (P2), and parse soundness/normalization idempotence (P4) under 1,000 randomized iterations with reproducible seed.

## WP-09: Property P3 and Money Module Coverage

- **Tools used:** fast-check property testing, Jest code coverage reporter.
- **Concept:** Mathematical invariant validation of foreign exchange arithmetic and ensuring exhaustive edge-case test coverage.
- **How it works:** Proves conversion monotonicity, additive drift bound within 1 minor unit, identity, half-minor rounding bounds, and independent fee formulas under P3; achieved 100% statements, 99% branches, 100% functions, and 100% lines across the entire `src/money` module.

## WP-10: Pure Submit Machine Reducer

- **Tools used:** TypeScript strict discriminated unions, pure state reducer pattern, Jest.
- **Concept:** A zero-dependency, pure transition reducer governing submit lifecycles across 4 explicit states (`idle`, `submitting`, `succeeded`, `failed`) to eliminate race conditions and double submits at the state level.
- **How it works:** Rigidly enforces transition permissions according to PRD §9.2 transition matrix; protects against stale responses via monotonic `requestId` matching; preserves input and idempotency tokens upon failure; ignores out-of-order `SUBMIT` actions during in-flight submissions by returning the unchanged state reference.

## WP-11: Async Submit Controller

- **Tools used:** Injected Scheduler, AbortController, Promise orchestration, Event notifications.
- **Concept:** Orchestration layer driving the pure submit state machine alongside real-world side effects (timeouts, abort signals, idempotency tokens, response parsing, and listener subscriptions).
- **How it works:** Starts configurable timeout timer with `scheduler.setTimeout` concurrently with async `run`; dispatches `REJECT` and aborts on timeout; ignores stale/late responses after timeout or disposal via active `requestId` checks; handles network failure and typed `SubmitRejection` distinctions; guarantees listener notifications fire only on true state reference mutations.

## WP-12: Generic Review Guard

- **Tools used:** TypeScript generics, `Object.freeze`, `Object.is` value equality.
- **Concept:** Client-side consistency verification protecting high-risk money actions against silent parameter mutations between confirmation preview and final submit.
- **How it works:** Stores a frozen shallow clone upon `capture`; evaluates live vs snapshot values using `Object.is` across the symmetric key union; accurately detects added, modified, or removed keys while failing safely when no snapshot exists.

## WP-13: Zod Boundary Helper

- **Tools used:** Zod schema validation, safe parse pattern, error redaction.
- **Concept:** Defensive parsing layer insulating application internals against malformed or hostile external data from network APIs or browser events.
- **How it works:** Wraps `schema.safeParse` in `parseBoundary` returning a typed `{ ok: true, value } | { ok: false, error }` result without throwing; formats issue paths cleanly (`$` for root, dot notation for nested); caps error issues at 10 items to prevent log pollution; strictly prevents raw unvalidated values or sensitive payload strings from leaking into error messages or serialization.

## WP-14: Property P6 and Submit Module Coverage

- **Tools used:** fast-check property testing, Jest code coverage reporter, async property testing.
- **Concept:** Formal property verification of state machine lifecycle invariants (I1–I7) alongside rigorous branch and statement coverage.
- **How it works:** Drives state machine and controller with up to 40 randomized operations per run verifying at-most-one-in-flight (I1), exactly-one-run per submit/retry (I2), monotonic request IDs (I5), idempotency key persistence across retry (I4), reachability of success only via active request matching (I3), complete silence after disposal (I6), and referential identity on ignored events (I7); achieved >96% statements, >92% branches, >95% functions, and >98% lines across the submit module.

## WP-15: Simulated Service, Schemas, and Chaos Fault Injection

- **Tools used:** Zod schema validation, BigInt exact math, in-memory stateful mock service, injected clock and timer scheduling.
- **Concept:** A zero-backend deterministic simulated money transfer service capable of reproducing real-world distributed systems faults (lost responses, hanging connections, delayed responses, malformed payloads, rate shifts, and duplicate requests).
- **How it works:** Enforces boundary validation through strict schemas stripping unknown keys; computes exchange rates and fees using lossless integer math; maintains an in-memory idempotency store with request fingerprinting; models one-shot fault behaviors (e.g., throwing network error after debiting for lost-response, but replaying successfully on retry) verified under 12 targeted service test cases (SV-01..SV-12).
