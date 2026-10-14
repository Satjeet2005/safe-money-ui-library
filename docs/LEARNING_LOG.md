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

## WP-16: Chaos Configuration, URL Presets, and Deterministic Debug Hook

- **Tools used:** URLSearchParams parsing, Zod boundary validation, sessionStorage / localStorage mutation, global test hooks (`window.__smu`).
- **Concept:** Declarative fault-injection configuration driven by UI state and URL presets, combined with deterministic reproducible test modes.
- **How it works:** Parses predefined presets (`hang`, `late`, `lost`, `shift`, `reject`, `all`) and granular boolean overrides from browser search parameters; applies corrupt storage mutations on demand; installs `window.__smu` debug harness in deterministic mode with sequential `idem-000001` keys and snapshot retrieval.

## WP-17: Redux Toolkit State, Boundary Thunks, and Dependency Injection

- **Tools used:** Redux Toolkit (`createSlice`, `createAsyncThunk`, `configureStore`), extraArgument dependency injection, Zod boundary validation.
- **Concept:** Predictable application state isolated entirely in `apps/transfer-demo` without leaking state management abstractions into the core money UI library.
- **How it works:** Implements slices for transfer draft (`draftSlice`), flow transitions and review snapshots (`flowSlice`), boundary-validated remote data (`dataSlice`), chaos fault controls (`chaosSlice`), and local transfer history (`historySlice`); async thunks (`loadAccounts`, `loadRecipients`, `fetchQuote`) execute with injected `service` dependencies via `thunk.extraArgument`, strictly validating API outputs through `parseBoundary` before mutating state or surfacing localized error banners.

## WP-18: React Library Primitives and Hooks

- **Tools used:** React 18, `useSyncExternalStore`, `useRef`, `useId`, `aria-*` accessibility patterns, Jest, React Testing Library.
- **Concept:** Accessible, resilient React UI primitives and hooks wrapping core money parsing, formatting, submit state machine, and review guard logic.
- **How it works:** `MoneyInput` maintains raw user text while providing live polite formatted previews and syncing with `parseAmount`/`formatAmountInput` without floating-point math; `ErrorSummary` announces error groups via `role="alert"` and shifts focus smoothly to invalid target elements upon `focusKey` changes; `useSafeSubmit` orchestrates submit lifecycles through a stable `SubmitController` ref connected via `useSyncExternalStore` and automatically disposes on unmount; `useReviewGuard` exposes a stable review guard instance across renders.

## WP-19: Send Form, Copy, Draft Persistence, and App Shell

- **Tools used:** React 18, Redux Toolkit, Zod runtime schema validation, sessionStorage API, React Testing Library.
- **Concept:** End-to-end form orchestration integrating library primitives, Redux state, defensive boundary validation, and centralized localization without hard-coded string literals.
- **How it works:** `SendForm` coordinates recipient/account/locale selection with `MoneyInput`, client-side fee-inclusive balance validation, and ordered accessible `ErrorSummary` error dispatch; `draftStorage` safely round-trips supported draft fields through `sessionStorage['smu.draft.v1']` with Zod boundary verification, immediately discarding invalid schemas and notifying the user via a polite warning banner while preventing stale auto-resaves.

## WP-20: Review Screen and Confirm Algorithm

- **Tools used:** React 18, Redux Toolkit, injected Clock helper, React Testing Library.
- **Concept:** Critical transfer confirmation screen combining review-guard snapshot verification, quote expiry re-validation, and safe single-submit dispatch.
- **How it works:** `Review` verifies live Redux draft values against the review snapshot; redirects back to form if values drifted; checks quote expiration against the clock and automatically refreshes rate quote if expired; halts submission and presents localized warning banners whenever parameters or rates change, requiring user re-confirmation before final submission.

## WP-21A: TransferFlow Ownership and Controller Integration

- **Tools used:** React 18, Redux Toolkit, useSafeSubmit, dependency injection, Jest.
- **Concept:** Centralizing transfer flow step ownership and stateful submit lifecycle above individual screen boundaries to prevent state resets.
- **How it works:** `TransferFlow` acts as the single step owner reading Redux `flow.step` and instantiates the `useSafeSubmit` controller; coordinates mock service operations with controller idempotency keys and abort signals; classifies service rejections with exact retryability; verifies raw responses against both boundary schemas and financial snapshot invariants before advancing to the result step.

## WP-21B: Result Screen and Recent Activity History

- **Tools used:** React 18, Redux Toolkit, React Testing Library, accessible DOM focus management.
- **Concept:** Terminal result screen handling all submission outcomes (succeeded, business rejected, unconfirmed) with exact-once side effects and accessible focus transitions.
- **How it works:** `Result` renders success details (debited, credited, transfer ID), business rejections (with code-specific copy and Edit/Retry actions), and unconfirmed states (timeout, network, invalid_response with retry and leave options); `useSuccessSideEffect` executes exactly once per successful transfer ID to append a completed history entry, reset draft state, purge storage, and refresh account balances; leaving an unconfirmed outcome appends an unconfirmed entry keyed by the transfer's idempotency key and surfaces an unconfirmed banner.

## WP-22: Chaos Panel, Banners, Document Title, and Semantic Landmarks

- **Tools used:** React 18, Redux Toolkit, jest-axe, HTML5 semantic landmarks, Clipboard API.
- **Concept:** Accessible developer tooling and shell-level document metadata integrated without leaking service logic or violating accessibility rules.
- **How it works:** `ChaosPanel` provides accessible controls (4 presets, 3 latency options, 4 server rejection choices, 7 fault checkboxes, simulate edit, double-click confirm, reset, and copy-link) with `aria-expanded` and `aria-controls` semantics and passes Axe audit `A11Y-10` with zero violations; `Banner` enforces strict role separation (`status` for informational/warning banners, `alert` for errors); `App` synchronizes document titles across flow steps and guarantees `<header>`, `<main>`, and `<aside aria-label="Demo notice">` landmarks.

## WP-23: Webpack Application Build and SWC Compilation

- **Tools used:** Webpack 5, `swc-loader`, `mini-css-extract-plugin`, `html-webpack-plugin`, `webpack-dev-server`.
- **Concept:** Robust, production-grade application bundling configured with SWC transpilation, CSS extraction, deterministic dev server, and cross-toolchain path alias parity.
- **How it works:** Configures Webpack with `swc-loader` targeting ES2022 and automatic React runtime; extracts styles with `MiniCssExtractPlugin` into separate stylesheets; mounts `HtmlWebpackPlugin` against `public/index.html`; configures `devServer` on port `5173` with `historyApiFallback`; maps all library entry points and `.js` extension aliases matching TypeScript and Jest contracts; builds cleanly with zero errors and zero warnings, meeting bundle budgets.

## WP-24A: Cypress Infrastructure and Deterministic Journey Support

- **Tools used:** Cypress 13, `cypress-axe`, `cypress-real-events`, Node.js `http` static server.
- **Concept:** End-to-end test infrastructure orchestrating production-built assets against a zero-backend deterministic environment with accessibility auditing and browser-level keyboard events.
- **How it works:** Configures Cypress with 1280×800 viewport, video recordings, and failure screenshots; establishes `cy.visitDeterministic` with pre-load `sessionStorage` clearance and optional fake clock injection; provides typed helpers for `window.__smu` and execution-count validation; wires Axe checks with PRD WCAG tags and enables real keyboard events via `cy.realPress`; pipes `pnpm e2e` through an automated production build and static server pipeline.

## WP-24B: Cypress Journeys J1–J4

- **Tools used:** Cypress 13, `cypress-axe`, `cypress-real-events`, Sinon fake timers.
- **Concept:** Real-browser end-to-end journey execution covering multi-currency happy paths, keyboard navigation, mobile responsiveness, input validation, duplicate submit mitigation, and network timeout recovery.
- **How it works:** Proved `useSafeSubmit` and state machines prevent double submissions under synchronous same-tick Confirm clicks (`executedCount === 1`); verified idempotency key reuse during retry gracefully absorbs late responses without secondary execution; preserved active input focus during inline error correction by keeping `ErrorSummary` mounted across transient validation changes; and verified zero Axe violations under WCAG 2.2 AA tags at each flow checkpoint.

## WP-24C: Cypress Journeys J5–J8 and Phase 3 MCR Gate

- **Tools used:** Cypress 13, `cypress-axe`, `cypress-real-events`, sessionStorage inspection, fake clock timers.
- **Concept:** Critical edge-case and fault tolerance verification across idempotent lost response recovery, server rejections, stale quotes/rates, malformed payloads, and corrupt storage recovery, concluding Phase 3 Minimum Complete Release.
- **How it works:** Verified idempotent retry upon lost responses with unchanged idempotency keys and exactly one backend execution (`executedCount === 1`); verified non-retryable vs. retryable server rejections (`INSUFFICIENT_FUNDS`, `RECIPIENT_BLOCKED`, `SERVICE_UNAVAILABLE`) preserving form state on "Edit details"; handled server quote expiration and rate shifts (+0.5%) prompting user re-acceptance; validated retry loops for malformed/tampered payloads; and proved corrupted `sessionStorage` drafts are gracefully discarded with an accessible notification banner, passing all Axe accessibility checkpoints with zero violations.

## WP-25: Automated Accessibility Checks (A11Y-01 through A11Y-10)

- **Tools used:** `jest-axe`, `cypress-axe`, WCAG 2.2 AA rule tags, React Testing Library.
- **Concept:** Exhaustive automated accessibility verification across all primary component and application states with zero rule exclusions except jsdom's documented lack of layout engine for `color-contrast`.
- **How it works:** Verified initial empty forms, active validation error states with linked focus targets, five variations of `MoneyInput`, `ErrorSummary` container semantics, default and banner-adorned review screens, and all terminal result states (succeeded, unconfirmed, and rejected), yielding zero Axe violations across both `pnpm test:a11y` and `pnpm e2e:a11y`.

## WP-26: Mutation Testing with Stryker

- **Tools used:** Stryker 8.x (`@stryker-mutator/core`, `@stryker-mutator/jest-runner`, `@stryker-mutator/typescript-checker`), Jest, Fast-Check.
- **Concept:** Validating test suite discrimination power by systematically injecting syntactic and logical mutations into core money and submit modules.
- **How it works:** Configured Stryker over `src/money/**/*.ts` and `src/submit/**/*.ts` using `perTest` coverage analysis and `FC_NUM_RUNS=50` to maintain deterministic property test execution within Stryker timeouts; resolved pnpm isolated package directory challenges by explicitly referencing plugin package names; added targeted unit tests for `SubmitRejection` identity, consecutive retry request IDs, listener unsubscribes, disposal idempotency, boundary ceiling math, and error message fallbacks, lifting mutation score from 82.78% to 90.63% (522 mutants killed, 53 survived, 1 equivalent mutant documented), comfortably exceeding the 80% break threshold.

## WP-27: Size Budgets, Budget Ratchet and Metrics Refresh

- **Tools used:** Node.js `zlib.gzipSync` (level 9), `scripts/size.mjs`, Jest, `scripts/claims-check.mjs`.
- **Concept:** One-time Phase 4 ratchet preventing size creep by clamping bundle allowances tightly to measured production outputs rather than leaving loose initial estimates.
- **How it works:** Measured all 4 library ESM entry files and the combined app JS output using gzip level 9; applied the exact PRD formula `ceil((measured * 1.10) / 100) * 100` to establish permanent ceilings (money: 900 B, submit: 200 B, boundary: 400 B, react: 1,700 B, app: 88,900 B); verified that all targets pass with zero failures and that budgets can never be raised again; refreshed the complete metrics ledger in `docs/METRICS.md` with verified command outputs, dates, and equivalent mutants.

## WP-28: Manual Accessibility Checklist and Usability Kit

- **Tools used:** Markdown templates, PRD manual checklist specification, privacy guardrail design.
- **Concept:** Structured manual accessibility testing protocol and participant usability study framework.
- **How it works:** Prepared `docs/A11Y_MANUAL.md` with the 6 mandatory PRD checks (screen reader happy/error/unconfirmed, 200%/400% zoom, keyboard only, phone device) and empty result fields to maintain honest claims; created `docs/USABILITY_CHECK.md` defining facilitator scripts, privacy guardrails (only first name and age band), 3 ordered tasks, neutral post-task questions, and 8 participant slots.

## WP-29: Main README and Package README

- **Tools used:** GitHub-flavored Markdown, PRD metric-markers specification, `scripts/claims-check.mjs`.
- **Concept:** Reviewer-facing documentation architecture, metric marker tracking, and Honest Claims compliance.
- **How it works:** Authored the 14-section root `README.md` following the exact PRD order with verifiable claims, exact metric comment markers matching `docs/METRICS.md`, verified three compiling code snippets, and authored `packages/safe-money-ui/README.md` with install guidelines and library examples.

## WP-30: npm Packaging Dry Run and Release Checklist

- **Tools used:** `pnpm publish --dry-run`, `tsup`, `vercel.json` verification.
- **Concept:** Package distribution verification, monorepo artifact bundling, and human-in-the-loop release gating.
- **How it works:** Updated `packages/safe-money-ui/package.json` with a dedicated size verification script and wired `tsup`'s `onSuccess` callback to ensure `dist/styles.css` is packaged into tarball outputs; proved packaging viability with a 34-file dry run; verified Vercel hosting settings; and authored `docs/RELEASE_CHECKLIST.md` covering all manual release steps while maintaining `Q-AI-001` as an explicit release blocker.

## WP-31: Case Study

- **Tools used:** `wc -w`, `scripts/claims-check.mjs`, markdown drafting.
- **Concept:** Technical case-study authoring, strict word budgeting, and honest limitation reporting.
- **How it works:** Authored `docs/CASE_STUDY.md` under 600 words (546 words) following the exact PRD section order; omitted the unrecorded bug heading per PRD rules; detailed the idempotent key reuse trade-off; verified metric markers against `docs/METRICS.md`; and passed all claims verification checks.

## WP-32: Walkthrough Script

- **Tools used:** Markdown table structure, PRD walkthrough timeline specification, `scripts/claims-check.mjs`.
- **Concept:** Spoken-video walkthrough script authoring with precise timing, visual cues, and metrics grounding.
- **How it works:** Authored `docs/WALKTHROUGH_SCRIPT.md` structuring the 5 required beats across 60–90 seconds (thesis, happy path, lost-response fault injection with idempotent recovery, pnpm verify with 90.63% mutation score, and limitations/next steps) using plain conversational language for Satjeet to record in his own voice.

## WP-33: Technical Explainers and Interview Q&A

- **Tools used:** Markdown structural validation, word count verification scripts, source code dependency tracing.
- **Concept:** Translating codebase architecture, testing methodology, and failure modes into structured interview preparation resources.
- **How it works:** Authored 13 deep-dive module explainers using strict 6-heading templates and <=12-step flows, created 24 first-person interview answers under 120 words grounded in real test IDs and metrics, and synthesized lessons learned across Redux Toolkit, Jest, and Cypress without rewriting historical records.

## Visual Redesign Phase 1: Presentation Regression Tests and Visual Acceptance Map

- **Tools used:** Testing Library, Jest, Cypress, axe-core, Markdown traceability matrix.
- **Concept:** Establishing an immutable behavior and presentation regression safety net prior to any visual design or CSS modifications.
- **How it works:** Reconciled Phase 0 E2E test counts across `pnpm e2e` (20 tests across 9 specs) and `pnpm e2e:a11y` (14 tests across 5 specs); created `docs/VISUAL_ACCEPTANCE.md` mapping all 14 visual PRD requirements (VIS-01 through VIS-14) to components and automated/manual tests; authored `apps/transfer-demo/src/presentation.test.tsx` containing 12 unit/integration presentation tests (PR-01 through PR-12) asserting landmark structure, form step controls, error summaries, review breakdown, chaos presets/radios/checkboxes, unconfirmed/rejected/succeeded states, and recent activity history without altering any runtime or styling code.

## Visual Redesign Phase 2: Design Tokens, Page Shell, and First-Screen Hierarchy

- **Tools used:** CSS custom properties, WCAG contrast calculation, Testing Library, Webpack MiniCssExtractPlugin.
- **Concept:** Establishing a restrained semantic design system and calm page shell foundation while enforcing zero bundle creep and WCAG 2.1 AA compliance.
- **How it works:** Implemented semantic plain-CSS design tokens in `apps/transfer-demo/src/tokens.css` covering canvas (`#F5F7F6`), surface (`#FFFFFF`), ink (`#14231F`), primary action (`#146B57`), semantic status colors, spacing scale, elevation shadows, tabular numerals, and reduced-motion overrides; restructured the page header in `App.tsx` with a quiet Northwind Pay brand mark, "Transfer sandbox" descriptor, simulated environment indicator, and prominent simulation notice; verified all color pairs meet WCAG AA contrast (normal text >= 4.5:1, UI boundaries >= 3:1); added `PR-13` and `PR-14` tests; and verified that `pnpm size` passes with App JS at 80,944 B within the 88,900 B budget.

## Visual Redesign: Phase 2 Rollback and Design Direction Reset

- **Tools used:** Git revert, Testing Library, Cypress, Axe accessibility audit.
- **Concept:** Reversible UI iteration, isolating design aesthetic from presentation behavior, and explicit research gating.
- **How it works:** The initial Phase 2 visual direction was rolled back to restore the verified pre-Phase-2 baseline so the demo can undergo dedicated design research and direction selection before another implementation attempt. The rollback safely restored the prior page shell and baseline styling while keeping the Phase 1 presentation regression safety net (`PR-01` through `PR-12`) and full functional verification intact. Tests specifically coupled to the rejected token names and header badges (`PR-13`, `PR-14`) were removed, and visual acceptance criteria were reset to pending design selection.

## Visual UI & Motion Implementation (Northwind Pay)

- **Tools used:** Plain CSS custom properties (`--nw-*`), React 18, Redux Toolkit, Cypress 13, cypress-axe, Jest, Webpack 5.
- **Concept:** Complete semantic visual design system, epistemic tri-modal state representation, zero-dependency CSS architecture, and strict accessibility-preserving refactoring.
- **How it works:** Implemented the full 9-phase visual overhaul across `tokens.css`, `App.tsx`, `SendForm.tsx`, `Review.tsx`, `Result.tsx`, `AccountSummary.tsx`, and `ChaosPanel.tsx`:
  1. _Design Tokens & Base Typography_: Established `--nw-*` semantic tokens for canvas, surfaces, text, borders, actions, status tints, tabular numerals, focus rings, and reduced-motion overrides without third-party CSS dependencies.
  2. _Page Shell & Navigation_: Built responsive 7:5 desktop workspace grid collapsing to 1fr on mobile, persistent `[SIMULATION ONLY]` disclaimer badge, step progress indicator, and mobile chaos quick banner.
  3. _Transfer Workflow & Inputs_: Styled SendForm with focused hero input, aligned select controls, and full-width CTA while preserving all input IDs and keyboard behaviors.
  4. _Receipt Snapshot & Spinner_: Designed review snapshot list with tabular figures and a dual-arc CSS spinner running at 800ms.
  5. _Epistemic State Clarity_: Enforced tri-modal result styling: Succeeded (mint bg, emerald left bar, `✓`, tag `Confirmed`), Rejected (rose bg, crimson left bar, `⊘`, tag `Rejected`), and Unconfirmed (parchment amber bg, 2px dashed border with solid left bar, `◆`, tag `Outcome unconfirmed`).
  6. _Account Summary & Ledger_: Enhanced account card with tabular numerals and recent activity history without altering test string bindings.
  7. _Chaos Simulation Console_: Structured 2x2 failure preset cards with non-color indicators (`✓`/`○`), status pills, touch-friendly radios and checkboxes, and grouped fieldsets. Solved WCAG 2.5.3 (Label in Name) by strictly matching button accessible name to visible text.
  8. _Motion & A11Y Verification_: Verified zero Axe violations across all E2E journeys (`pnpm e2e:a11y`), 100% passing Cypress tests (`20/20` across 9 specs), 400 passing unit/integration tests, and full CI verification (`pnpm verify`).
