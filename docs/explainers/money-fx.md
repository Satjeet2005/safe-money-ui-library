# Explainer: money-fx

## What it does

`packages/safe-money-ui/src/money/fx.ts` and `fee.ts` provide exact integer-based currency conversion (`convert`) and transfer fee calculation (`computeFee`) using lossless BigInt arithmetic and half-even rounding (banker's rounding).

## Why it exists

Cross-currency money calculations are prone to binary floating-point rounding errors and cumulative upward bias when using naive round-half-up logic. Financial applications require deterministic exchange rate scaling where conversions are monotonic, fees are bounded, and half-way calculations round to the nearest even number to maintain statistical neutrality.

## How it works

1. Validates the source `Money` object and supported currency codes.
2. Returns the original source reference immediately if source and target currencies match.
3. Retrieves fixed micro-unit exchange rates `PER_USD_MICRO` for source and target currencies.
4. Normalizes source minor units to USD micro-units using BigInt multiplication and division.
5. Scales intermediate USD values to target minor units using target exchange rates.
6. Calculates integer quotient and remainder to determine fractional remainder position.
7. Applies half-even rounding: rounds to nearest even integer when remainder is exactly half the divisor.
8. Enforces `MAX_MINOR` bounds, throwing `RangeError` if the converted amount exceeds the ceiling.
9. `computeFee` returns 0 for same-currency transfers.
10. `computeFee` charges 50 basis points (0.50%) with a 100 minor unit minimum for cross-currency transfers.
11. Applies half-even rounding to fractional fee calculations.
12. Returns a new immutable `Money` object.

## Trade-offs

The implementation uses a static fictional exchange rate table (`PER_USD_MICRO`) rather than real-time dynamic market feeds. This trade-off ensures zero external dependencies, immediate execution, and reproducible property test invariants, while isolating dynamic rate volatility to the application review step.

## How it is tested

- Unit tests in `packages/safe-money-ui/test/money/fx.test.ts` verify golden FX cases `FX-01` through `FX-05` and boundary conditions.
- Unit tests in `packages/safe-money-ui/test/money/fee.test.ts` verify golden fee cases `FE-01` through `FE-05` and minimum floor applications.
- Property tests in `packages/safe-money-ui/test/property/fx-maths.property.test.ts` (P3) test conversion monotonicity, additive drift bound within 1 minor unit, identity, half-minor rounding bounds, and independent fee calculation across 1,000 fast-check runs.
- Stryker mutation analysis proved all mutants killed, documenting one equivalent mutant at `fee.ts:62` (`<=` vs `<` on minimum fee check).

## Questions an interviewer may ask

1. Why is half-even rounding preferred over standard half-up rounding in payment calculations?
2. How does `convert` prevent intermediate integer overflow when converting large currency values?
3. Why is the transfer fee calculated and denominated in the source currency rather than the target currency?
