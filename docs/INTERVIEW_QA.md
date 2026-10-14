# Interview Q&A

This document prepares Satjeet to explain the architecture, design trade-offs, and verification methodology of `safe-money-ui` during technical interviews. Every answer is written in the first person, grounded in the actual codebase, and limited to 120 words or fewer.

---

### 1. Integer minor units: Why did I represent money in integer minor units instead of using floating-point arithmetic?

I represented money as integer minor units—like cents or pence—to eliminate IEEE 754 floating-point inaccuracies. In JavaScript, binary floating-point operations produce errors such as `0.1 + 0.2` equalling `0.30000000000000004`, or `19.99 * 100` resulting in `1998.9999999999998`. In a financial system, fractional-cent discrepancies can corrupt ledger balances and cause reconciliation failures. By storing amounts as integers in `Money.minor` and using BigInt for arithmetic, calculations remain exact and lossless. In a real banking backend, amounts are stored as integers or fixed-precision decimals in transactional databases, and maintaining integer minor units on the client ensures end-to-end mathematical consistency.

---

### 2. Amount input: Why did I avoid `type="number"` for the amount field?

I avoided `<input type="number">` because it has significant usability and accessibility drawbacks for payments. Native number inputs allow exponential notation like `1e5`, alter values unexpectedly when the mouse wheel scrolls, and handle international decimal separators inconsistently across browsers. In some locales, entering a comma decimal either fails silently or clears the field. Instead, I used `<input type="text">` paired with `inputMode="decimal"` (or `"numeric"` for zero-decimal currencies like JPY). This displays the numeric keypad on mobile devices while allowing the custom parser to validate locale-specific grouping and decimal separators deterministically.

---

### 3. Locale parsing: How does `parseAmount` decide whether a separator represents grouping or a decimal boundary?

`parseAmount` uses explicit locale configurations rather than guessing. When given an input and a locale like `de-DE` or `en-US`, it looks up the expected group and decimal separators for that locale. The parser identifies the last separator: if it matches the locale's decimal separator, everything following it is treated as fractional digits. Any preceding separators must match the locale's grouping rules—such as Western three-digit intervals or Indian two-digit intervals in `en-IN`. If separators are mixed or placed in invalid positions, the parser rejects the input as `INVALID_GROUPING` or `MULTIPLE_DECIMAL_SEPARATORS`. This strict separation prevents ambiguous amounts like `1,234` from being misinterpreted.

---

### 4. Rounding: Why does the money conversion logic use half-even rounding, and where is that behavior implemented?

I implemented half-even rounding, or banker's rounding, in `packages/safe-money-ui/src/money/fx.ts` and `fee.ts`. Standard round-half-up always rounds .5 upward, creating an upward statistical bias across thousands of transactions. Half-even rounding eliminates this systemic drift by rounding exact half-way remainders to the nearest even integer—for instance, 19.5 rounds to 20, but 58.5 rounds to 58. I implemented this by evaluating the BigInt division remainder against half the divisor. If the remainder is exactly half, the quotient's least significant bit determines whether to round up or stay even. In a real multi-currency payment platform, half-even rounding ensures fair, unbiased exchange fee and conversion settlements.

---

### 5. Idempotency contract: What does an idempotency key accomplish, and what must a real service guarantee for it to work?

An idempotency key guarantees that a payment request executes at most once, even if network disruptions cause the client to retry. In `useSafeSubmit` and the simulated service, the client attaches a unique UUID token to the transfer request. If the server receives a request with an existing key and matching payload, it returns the previously stored result without debiting the account again. For this contract to work in a real distributed system, the backend must implement atomic database transactions, distributed locking on the idempotency key, durable response caching, and payload fingerprint verification to reject conflicting parameter changes under the same key.

---

### 6. Retry reuse: Why does retrying after an uncertain result reuse the same idempotency key?

When a payment request ends with an uncertain outcome—such as a network timeout or dropped connection—the client cannot know whether the server executed the debit before the connection failed. If the client generated a new idempotency key for the retry, the server would treat it as a distinct second payment, causing a duplicate debit. By reusing the identical idempotency key on retry, the client guarantees safety: if the server already processed the transfer, it simply replays the confirmation; if it never received the original attempt, it executes the payment once. This behavior is demonstrated in Cypress journey J5.

---

### 7. Late responses: What happens when a late or out-of-order response arrives, and how does the implementation prevent it from changing the wrong state?

If a network response arrives after a timeout has expired or after a subsequent retry has started, accepting it could corrupt state or display stale confirmation screens. In `packages/safe-money-ui/src/submit/machine.ts` and `controller.ts`, I prevented this using monotonically increasing `requestId` integers. Each submission attempt increments `requestId`. When the async runner resolves or rejects, it passes its attempt's `requestId`. The controller and machine check whether `action.requestId === state.requestId`. If they do not match, the response is discarded, and the state reducer returns the unchanged state reference. This guarantees that only responses from the active, in-flight attempt can transition the UI.

---

### 8. Accessible submission state: Why is `aria-disabled` used rather than `disabled` for the specified in-flight controls?

I used `aria-disabled="true"` instead of native `disabled` on submitting buttons to preserve focus and screen reader context. When a native HTML button becomes `disabled`, browsers immediately strip it of focusability and remove it from the keyboard tab sequence. This causes keyboard focus to drop abruptly back to the `<body>` element, disorienting blind end users. By applying `aria-disabled="true"`, the button communicates its disabled status to assistive technologies while retaining focus. I paired this with `pointer-events: none` in CSS and click-event suppression in JavaScript to prevent duplicate clicks while maintaining an accessible DOM experience.

---

### 9. Boundary validation: Why is Zod used at external payload boundaries?

TypeScript types exist only at compile time and provide zero runtime protection against malformed external payloads. Network responses, `sessionStorage` drafts, and URL parameters can arrive with corrupted fields, unexpected types, or omitted values. In `packages/safe-money-ui/src/boundary/boundary.ts`, I used Zod to parse untrusted payloads defensively. The `parseBoundary` helper validates schemas and returns a typed `{ ok: true, value }` or `{ ok: false, error }` result without throwing unhandled exceptions. In a real system, validating payloads at the boundary prevents runtime crashes, ensures corrupted drafts are cleanly discarded, and isolates internal application logic from external API contract drift.

---

### 10. Unknown response keys: Why are unknown keys stripped rather than rejected?

In `packages/safe-money-ui/src/boundary/boundary.ts`, Zod schemas strip unknown keys by default instead of using `.strict()`. This follows the Robustness Principle—be conservative in what you send and liberal in what you accept. In evolving distributed systems, backend teams frequently introduce new metadata or optional feature flags to API responses. If client schemas rejected unknown fields, any non-breaking backend addition would immediately crash clients. By stripping unrecognised properties, the application ensures forward compatibility with newer API versions while validating that all mandatory fields conform strictly to expected domain types.

---

### 11. Response verification: What does `verifyTransfer` catch that schema validation alone cannot?

Schema validation checks structure and data types—verifying that `amount` is an object and `transferId` is a string. However, it cannot verify financial semantic invariants between the user's intent and the server's execution. In `apps/transfer-demo/src/service/verifyTransfer.ts`, `verifyTransfer` validates domain consistency: it confirms that the debited currency and amount match the review snapshot, that fees equal the difference between total debit and transfer amount, and that recipient identifiers align. This catches backend calculation bugs, race conditions, or payload tampering that pass schema validation but represent financial discrepancies.

---

### 12. State management: Why is Redux Toolkit used in the reference app but not in the library?

I used Redux Toolkit exclusively in the reference demo application (`apps/transfer-demo`) while keeping the library (`packages/safe-money-ui`) completely state-manager agnostic. The library provides pure mathematical functions, a pure submit reducer, and headless React primitives that work with native React state. Forcing Redux into the library would impose heavy architectural dependencies and bundle bloat on external consumers who might use Zustand, React Context, or vanilla TypeScript. In the application, Redux Toolkit manages complex multi-step screen flows, local transfer history, and developer chaos controls cleanly through modular slices.

---

### 13. Controller lifecycle: How does the submit controller prevent state updates after disposal or unmount?

In `packages/safe-money-ui/src/submit/controller.ts` and `src/react/useSafeSubmit.ts`, the controller implements a `dispose()` lifecycle method. When the component unmounts, the hook calls `dispose()`. The controller immediately aborts any active in-flight network requests via `AbortController`, clears pending timeout timers, and empties its internal set of state listeners. Furthermore, an internal `isDisposed` flag causes the controller to ignore any subsequent `submit`, `retry`, or resolved promises. This completely prevents React unmounted component warnings, stale callbacks, and memory leaks when end users navigate away mid-transfer.

---

### 14. Property tests: What do the property's generated test cases establish that example-based unit tests do not establish by themselves?

Example-based unit tests verify specific, human-selected inputs like `$1,234.56` or `0.01`. However, they cannot prove that mathematical invariants hold across the entire input space. Using `fast-check` in `test/property/`, I ran 1,000 randomized test iterations per property. These tests established algebraic invariants: parser totality (never throwing on arbitrary strings), format-then-parse round-trip identity, optional grouping invariance, conversion monotonicity, and state machine lifecycle invariants (such as at-most-one in-flight request). Property tests systematically discover boundary edge cases—like negative zero, max integer thresholds, and multi-tier digit groupings—that manual test cases overlook.

---

### 15. Mutation testing: What did mutation testing reveal? Use the actual mutation score and a real example of a mutant that initially survived and was subsequently addressed, only if the repository records that history.

Mutation testing with Stryker revealed that high code coverage can mask weak test assertions. Our test suite achieved a 90.63% mutation score, killing 522 mutants across core money and submit modules. In WP-26, mutation analysis revealed surviving mutants in `packages/safe-money-ui/src/submit/errors.ts`: mutations altering `this.name = 'SubmitRejection'`, `this.code = code`, and `this.retryable = retryable` survived because existing tests only caught the error without inspecting its custom properties. I added targeted unit tests in `test/submit/errors.test.ts` to assert error names, codes, and retry flags, killing the surviving mutants and raising the score above our 80% threshold.

---

### 16. Chaos panel: How is the chaos panel implemented, and how does it change the behavior of the simulated service?

The chaos panel in `apps/transfer-demo/src/components/ChaosPanel.tsx` is an accessible developer control panel backed by `chaosSlice`. It allows deliberate fault injection into the simulated backend service, including artificial latency (200ms or 2500ms), hanging connections, server rejections, rate shifts (+0.5%), and lost responses. The service inspects these settings on every call. For example, under the `lostResponse` preset, the service debits the account and saves the completed transfer, but throws a network disconnection before returning. This allows us to test and demonstrate client idempotent recovery in real browsers.

---

### 17. Fixed property-test seed: Why does the property-testing setup use a fixed seed, and what are the trade-offs?

In `test/property/`, `fast-check` is configured with a fixed numerical seed (`seed: 42`). The primary benefit is determinism: every CI run and developer machine generates the exact same sequence of randomized inputs. This guarantees reproducible test suites and eliminates intermittent flakiness where a random seed fails once and cannot be reproduced. The trade-off is that a fixed seed explores a static subspace of inputs rather than continuously expanding test coverage over time. To balance this, our local runs execute 1,000 iterations per property, covering extensive boundary combinations deterministically.

---

### 18. Webpack and SWC: How is Webpack configured, and why is SWC used in this project?

Webpack in `apps/transfer-demo/webpack.config.cjs` bundles the reference application for development and production. It extracts CSS using `MiniCssExtractPlugin`, serves the app via `webpack-dev-server` with `historyApiFallback`, and maps monorepo path aliases directly to TypeScript source files. I used SWC via `swc-loader` rather than Babel or `ts-loader`. SWC is written in Rust and compiles TypeScript and JSX 10 to 20 times faster than standard JavaScript transpilers, providing near-instant dev server restarts. Type checking is handled separately via `tsc --noEmit`, decoupling type validation from asset compilation.

---

### 19. Cypress timing: How does Cypress control time so the failure and recovery journeys remain deterministic?

To test network timeouts and rate expiration without waiting for real-world clocks, Cypress uses Sinon fake timers injected via `cy.visitDeterministic`. In journey J4, the client has a 2500ms timeout. Instead of using `cy.wait(3000)`—which slows test suites and introduces flakiness—Cypress overrides `window.setTimeout` and advances time synchronously using `cy.tick(2500)`. This triggers client timeout transitions instantly and deterministically. Paired with `?deterministic=1` URL parameters that enforce sequential idempotency keys, Cypress runs our eight multi-screen failure and recovery journeys in seconds without race conditions.

---

### 20. Axe limitations: What problems can Axe detect, and what kinds of accessibility issues can it miss?

Axe is an automated accessibility engine that detects programmatic DOM rule violations—such as missing accessible labels, invalid ARIA attributes, duplicate IDs, improper landmark structures, and color contrast failures. However, automated audits catch only an estimated 30% to 50% of real accessibility barriers. Axe cannot evaluate whether voiceover announcements make cognitive sense, whether focus order follows logical visual layout, whether custom keyboard shortcuts conflict with screen reader navigation, or whether dynamic content changes disrupt blind end users. That is why automated Axe checks must always be complemented by manual keyboard, screen-reader, and zoom testing.

---

### 21. Three limitations: What are the three biggest limitations of this project?

First, the backend is a client-side in-memory simulation without real database persistence, distributed locks, or server-side idempotency storage. Second, currency exchange rates are fictional and static, and the transfer flow lacks real authentication, KYC verification, and compliance checks. Third, while automated tests verify zero Axe violations, the application has not yet undergone complete manual testing with screen reader software across diverse devices, nor has it been evaluated in an empirical user study. These limitations are explicitly documented in `README.md` and `docs/METRICS.md` to prevent unsupported claims.

---

### 22. Real backend: If I were to connect a real backend, what would need to change or be verified first?

First, I would replace the mock service with an HTTP client using TLS, authentication, and token management. Second, I would verify the backend idempotency contract: ensuring the server implements atomic database transactions, unique key constraints, distributed locks (such as Redis Redlock), and payload fingerprint validation. Third, the client would need background polling or WebSocket subscriptions for asynchronous settlement, webhook reconciliation for delayed payments, and structured error mapping for banking error codes. Finally, client-side rate quotes would need dynamic expiration timestamps synchronized with server clocks.

---

### 23. Learning reflection: What have I learned about Redux Toolkit, Jest, and Cypress from using them in this project?

From Redux Toolkit, I learned how to isolate domain concerns using slices and how `extraArgument` enables clean dependency injection for async thunks without global mocks. From Jest, I learned the speed advantages of `@swc/jest` alongside the nuances of JSDOM—specifically why the `color-contrast` Axe rule must be disabled in JSDOM due to the absence of a layout engine. From Cypress, I learned how to orchestrate deterministic browser journeys using fake timers, how to perform automated Axe audits across flow checkpoints, and how real keyboard events differ from simulated DOM dispatches.

---

### 24. Next step: What would I build or investigate next, and why?

Next, I would build an integration layer connecting `useSafeSubmit` to a real payment gateway API supporting idempotency keys (such as Stripe or an ISO 20022 banking service). Specifically, I want to investigate client-side state machine handling for three-party asynchronous flows—like 3D Secure biometric authentication and redirect-based authorization. Handling temporary redirects while preserving idempotency tokens and form snapshots across external browser tabs would extend the resilience patterns established in this project to full web payments.
