# safe-money-ui

_Money-correct, failure-tolerant UI primitives for React and TypeScript, with a chaos-mode demo._

[![CI](https://github.com/Satjeet2005/safe-money-ui-library/actions/workflows/ci.yml/badge.svg)](https://github.com/Satjeet2005/safe-money-ui-library/actions/workflows/ci.yml)

_a payment UI can be built so that malformed input, duplicate clicks, slow or lost responses, stale data and bad payloads never produce a false success or a double submission, and every one of those claims is backed by a test a reviewer can run in under five minutes._

- Live demo: `<DEMO_URL>`
- Walkthrough video: `<VIDEO_URL>`

## Quick start

```bash
corepack enable && pnpm install --frozen-lockfile
pnpm dev
pnpm verify
```

- `corepack enable && pnpm install --frozen-lockfile` enables Corepack and installs reproducible pinned dependencies.
- `pnpm dev` starts the local development server for the transfer demo on port 5173.
- `pnpm verify` runs the full verification pipeline: type checking, linting, unit tests, accessibility audits, production bundling, size checks, and claims verification.

## Try to break it

- `Timeout then recover`: Select the `Timeout then recover` preset in Chaos mode to simulate a hanging connection; upon confirming the transfer, client-side timeout triggers the unconfirmed result screen, and clicking Reset chaos followed by Try again safely completes execution without duplicating.
- `Lost response`: Select the `Lost response` preset in Chaos mode to simulate a response dropped after server execution; the UI displays an unconfirmed result screen, and clicking Try again uses the identical idempotency key to confirm the transfer while debiting the source balance only once.
- `Bad payload`: Select the `Bad payload` preset in Chaos mode to return malformed response data; the runtime boundary schema rejects the payload and the application transitions to a recoverable error screen without creating false success.
- `Simulate edit from another tab`: Click `Simulate edit from another tab` in Chaos mode while on the review screen to alter the draft amount; upon confirming, the review guard detects the snapshot discrepancy, refreshes the quote with an alert banner, and blocks submission.
- `Double-click Confirm`: Click `Double-click Confirm` in Chaos mode to dispatch two confirm button clicks in the same JavaScript execution tick; the state machine controller ignores the second submission and executes the transfer exactly once.

## What is inside

| Entry          | Exports (names are final)                                                                                                                                                                                                         | Runtime imports |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| `./money`      | `CURRENCIES`, `MAX_MINOR`, `createMoney`, `parseAmount`, `formatAmountInput`, `formatMoney`, `convert`, `computeFee`, `PER_USD_MICRO`; types `Money`, `CurrencyCode`, `LocaleCode`, `ParseErrorCode`, `ParseError`, `ParseResult` | none            |
| `./submit`     | `createSubmitMachine`, `createSubmitController`, `createReviewGuard`, `SubmitErrorKind`; types `SubmitState`, `SubmitEvent`, `SubmitError`, `SubmitController`, `ReviewSnapshot`, `Clock`, `Scheduler`                            | none            |
| `./boundary`   | `parseBoundary`, `BoundaryError`, `BoundaryResult`                                                                                                                                                                                | `zod`           |
| `./react`      | `MoneyInput`, `ErrorSummary`, `useSafeSubmit`, `useReviewGuard`; types of their props                                                                                                                                             | `react` (peer)  |
| `./styles.css` | Default styles for `MoneyInput` and `ErrorSummary` (class prefix `smu-`)                                                                                                                                                          | none            |

The root `.` entry re-exports everything from `./money` and nothing else.

## Usage

### 1. Locale-aware parsing (`parseAmount`)

```typescript
import { parseAmount } from '@satjeetsingh1/safe-money-ui/money';

const result = parseAmount('1,234.50', {
  currency: 'USD',
  locale: 'en-US',
  minMinor: 100,
  maxMinor: 500000,
});

if (result.ok) {
  // result.money.minor is 123450 integer minor units
  console.log(`Parsed amount: ${result.money.minor} minor units`);
} else {
  // result.error.code e.g. 'INVALID_GROUPING', 'BELOW_MIN'
  console.error(`Validation error code: ${result.error.code}`);
}
```

### 2. Controlled money field (`MoneyInput`)

```tsx
import { useState, type JSX } from 'react';
import { MoneyInput } from '@satjeetsingh1/safe-money-ui/react';
import type { ParseError, ParseErrorCode, CurrencyCode } from '@satjeetsingh1/safe-money-ui/money';

const messages: Record<ParseErrorCode, (ctx: ParseError & { currency: CurrencyCode }) => string> = {
  EMPTY: () => 'Enter an amount to continue.',
  NOT_A_NUMBER: () => 'Use numbers and currency separators only.',
  NEGATIVE_NOT_ALLOWED: () => 'Negative amounts are not allowed.',
  MULTIPLE_DECIMAL_SEPARATORS: () => 'Enter only one decimal separator.',
  INVALID_GROUPING: () => 'Check thousands grouping separators.',
  TOO_MANY_DECIMALS: () => 'Too many decimal places for this currency.',
  ZERO_NOT_ALLOWED: () => 'Amount must be greater than zero.',
  BELOW_MIN: () => 'Amount is below the minimum limit.',
  ABOVE_MAX: () => 'Amount exceeds the maximum limit.',
  UNSAFE_MAGNITUDE: () => 'Amount exceeds safe processing magnitude.',
};

export function AmountField(): JSX.Element {
  const [value, setValue] = useState('100.00');

  return (
    <MoneyInput
      id="amount"
      label="Transfer amount"
      currency="USD"
      locale="en-US"
      value={value}
      onChange={(next) => setValue(next.text)}
      messages={messages}
      hint="Between $1.00 and $5,000.00"
      previewLabel={(formatted) => `Recipient will receive approximately ${formatted}`}
      minMinor={100}
      maxMinor={500000}
    />
  );
}
```

### 3. Safe submission lifecycle (`useSafeSubmit`)

```tsx
import { useSafeSubmit } from '@satjeetsingh1/safe-money-ui/react';
import { parseBoundary } from '@satjeetsingh1/safe-money-ui/boundary';
import { z } from 'zod';

const TransferResponseSchema = z.object({
  transferId: z.string(),
  status: z.literal('completed'),
});

type TransferInput = {
  recipientId: string;
  sourceCurrency: string;
  sourceMinor: number;
};
type TransferResponse = z.infer<typeof TransferResponseSchema>;

export function useTransferSubmit() {
  return useSafeSubmit<TransferInput, TransferResponse>({
    run: async (input, ctx) => {
      const response = await fetch('/api/transfers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': ctx.idempotencyKey,
        },
        body: JSON.stringify(input),
        signal: ctx.signal,
      });
      return response.json();
    },
    parseResponse: (raw) => {
      const parsed = parseBoundary('TransferResponse', TransferResponseSchema, raw);
      if (!parsed.ok) {
        return { ok: false, message: 'Invalid response received from server' };
      }
      return { ok: true, value: parsed.value };
    },
    newKey: () => crypto.randomUUID(),
    timeoutMs: 12000,
  });
}
```

## Evidence

The table below reports measured evidence collected directly from local command outputs and recorded in `docs/METRICS.md`:

| Metric                                         | Result                                                  | Source / Verification Gate                  |
| ---------------------------------------------- | ------------------------------------------------------- | ------------------------------------------- |
| Total test suite count                         | <!-- metric:tests_total -->400<!-- /metric -->          | `pnpm test` (all tests passing)             |
| Deterministic property test iterations         | <!-- metric:property_runs -->1000<!-- /metric -->       | `pnpm test:property` (fast-check seeds)     |
| Stryker mutation testing score                 | <!-- metric:mutation_score -->90.63%<!-- /metric -->    | `pnpm mutation` (Stryker 8 on core modules) |
| Line coverage (library)                        | <!-- metric:coverage_lines -->99.09%<!-- /metric -->    | `pnpm test --coverage`                      |
| Branch coverage (library)                      | <!-- metric:coverage_branches -->96.94%<!-- /metric --> | `pnpm test --coverage`                      |
| Bundle size `./money` (gzip level 9)           | <!-- metric:size_money_gz -->737 B<!-- /metric -->      | `pnpm size` (budget 900 B)                  |
| Bundle size `./submit` (gzip level 9)          | <!-- metric:size_submit_gz -->155 B<!-- /metric -->     | `pnpm size` (budget 200 B)                  |
| Bundle size `./boundary` (gzip level 9)        | <!-- metric:size_boundary_gz -->320 B<!-- /metric -->   | `pnpm size` (budget 400 B)                  |
| Bundle size `./react` (gzip level 9)           | <!-- metric:size_react_gz -->1488 B<!-- /metric -->     | `pnpm size` (budget 1700 B)                 |
| Combined application JavaScript (gzip level 9) | <!-- metric:size_app_gz -->82372 B<!-- /metric -->      | `pnpm size` (budget 88900 B)                |
| Component accessibility violations (Axe)       | <!-- metric:axe_violations_jest -->0<!-- /metric -->    | `pnpm test:a11y` (A11Y-01 through A11Y-10)  |
| End-to-end accessibility violations (Axe)      | <!-- metric:axe_violations_cypress -->0<!-- /metric --> | `pnpm e2e:a11y` (Cypress Axe WCAG AA tags)  |
| Real-browser end-to-end journeys               | <!-- metric:journeys_passed -->8<!-- /metric -->        | `pnpm e2e` (J1 through J8 in Cypress)       |

## Failure modes covered

| ID    | One-line description                                                                                                |
| ----- | ------------------------------------------------------------------------------------------------------------------- |
| FM-01 | Invalid amount or recipient blocks review and moves focus to the first error link in the error summary.             |
| FM-02 | Locale separator confusion is resolved by strict per-locale grouping rules and instant format switching.            |
| FM-03 | Currency decimal precision rules enforce integer-only for zero-decimal currencies (JPY) and three decimals for KWD. |
| FM-04 | Exact integer arithmetic and banker's rounding prevent floating-point drift and fee tie errors.                     |
| FM-05 | Synchronous duplicate clicks on Confirm are ignored by the pure submit state machine.                               |
| FM-06 | Network timeout transitions to an unconfirmed failure state offering safe retry without false success.              |
| FM-07 | Out-of-order or late responses arriving after timeout or completion are safely ignored.                             |
| FM-08 | Parameter mutation between review and submit triggers the review guard, refreshes the quote, and blocks submit.     |
| FM-09 | Malformed API response payloads are rejected at the runtime schema boundary with a recoverable error.               |
| FM-10 | Server rejection displays specific error copy, preserves form input, and permits retry only when retryable.         |
| FM-11 | Lost response after server execution is recovered by idempotent retry with the identical key.                       |
| FM-12 | Out-of-range amounts trigger safe bounds errors without integer overflow or thrown exceptions.                      |
| FM-13 | Round-trip format and parse identity holds across all supported currencies and locales.                             |
| FM-14 | Floating-point multiplication traps (such as 19.99 or 4.35) are eliminated via exact BigInt scaling.                |
| FM-15 | Stale exchange rates and expired quotes refresh transparently and require explicit re-confirmation.                 |
| FM-16 | Well-formed response payloads with inconsistent or modified amounts are rejected before success.                    |
| FM-17 | Corrupted or unreadable session storage drafts are safely discarded with an accessible notification banner.         |
| FM-18 | Complete transfer flow is operable using keyboard navigation alone with visible focus indicators.                   |
| FM-19 | Insufficient funds validation compares available balance against transfer amount plus fee before review.            |

## Decisions and trade-offs

- Retry reuses the idempotency key instead of blocking the user.
- The amount field does not use `type="number"`.
- Unknown response keys are stripped rather than rejected.

## What this does not prove

- It does not prove anything about performance, security or scale; there is no real backend, no real money and no authentication.
- The service is a simulation written by the same author; passing against it shows the client logic is consistent, not that a real payment API behaves this way.
- Coverage and mutation score are indicators of test strength, not proof of correctness.
- Automated Axe checks catch only part of accessibility problems; they are not a conformance claim. Manual screen-reader checks are reported only where `docs/A11Y_MANUAL.md` records them.
- Currency formatting depends on the `Intl` data of the browser or Node version in use.
- The exchange rates and fees are fictional.
- No usability study was done unless `docs/USABILITY_CHECK.md` records one, and then it is a small informal sample.

## Disclosures

This project was built with AI coding assistance (Gemini Flash, by Google). The design decisions, review and testing were directed by the author, and the test-first order is visible in the commit history.

Northwind Pay is a fictional brand. This is an independent project and is not affiliated with, endorsed by or sponsored by any bank, payments company or employer.

## Licence

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
