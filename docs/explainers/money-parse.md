# Explainer: money-parse

## What it does

`parseAmount` in `packages/safe-money-ui/src/money/parse.ts` parses localized monetary strings into exact integer minor units without floating-point arithmetic. It validates grouped and ungrouped integer and decimal strings across four locales (`en-US`, `de-DE`, `pl-PL`, `en-IN`) and seven currencies (`USD`, `EUR`, `GBP`, `CAD`, `AUD`, `JPY`, `KWD`).

## Why it exists

JavaScript `Number` and `parseFloat` use IEEE 754 floating-point arithmetic, which introduces binary precision errors (e.g., `0.1 + 0.2 !== 0.3` and `19.99 * 100 === 1998.9999999999998`). Furthermore, international locales use varying grouping and decimal conventions, such as periods, commas, thin spaces, and Indian Lakh/Crore systems. The parser ensures total, deterministic validation that returns typed results instead of throwing.

## How it works

1. Validates string type and rejects empty or whitespace-only inputs as `EMPTY` or `NOT_A_NUMBER`.
2. Validates currency and locale, retrieving locale-specific group and decimal separators.
3. Checks for negative signs or minus symbols, rejecting them as `NEGATIVE_NOT_ALLOWED`.
4. Splits the input into integer and fractional digit strings on the locale decimal separator.
5. Rejects multiple decimal separators with `MULTIPLE_DECIMAL_SEPARATORS`.
6. Validates fractional digit length against currency minor unit scale, rejecting excess digits as `TOO_MANY_DECIMALS`.
7. Validates integer grouping patterns, rejecting invalid grouping as `INVALID_GROUPING`.
8. Strips grouping characters to leave raw ASCII integer digits.
9. Pads fractional digits with trailing zeros to match the minor unit scale.
10. Concatenates integer and fractional digits and parses as a BigInt.
11. Enforces `allowZero`, `minMinor`, `maxMinor`, and `MAX_MINOR` (10 billion major units) bounds.
12. Returns `{ ok: true, value: { currency, minor } }` or `{ ok: false, error: { reason, message } }`.

## Trade-offs

Strict locale grouping validation is chosen over permissive input parsing. While a permissive parser might guess the user's intent for mixed separators, strict validation prevents ambiguous payment errors where `1,234` could mean either 1.234 or 1,234 depending on user locale assumptions.

## How it is tested

- Unit tests in `packages/safe-money-ui/test/money/parse.test.ts` verify golden parse cases `PG-01` through `PG-23` and floating-point trap cases `FT-01` through `FT-05`.
- Property tests in `packages/safe-money-ui/test/property/money.property.test.ts` test round-trip formatting identity (P1), optional grouping invariance (P2), parse soundness and normalization idempotence (P4), and totality (P5) across 1,000 fast-check runs.
- Stryker mutation testing verified boundary conditions and error codes with 100% mutant kill rate across the parser.

## Questions an interviewer may ask

1. Why does `parseAmount` pad the fractional string with trailing zeros instead of multiplying by powers of ten?
2. How does the parser distinguish between Western three-digit grouping and Indian Lakh/Crore grouping rules?
3. Why is `MAX_MINOR` capped at 1,000,000,000,000 minor units rather than `Number.MAX_SAFE_INTEGER`?
