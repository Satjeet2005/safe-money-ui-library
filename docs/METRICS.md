# Metrics Ledger

| key                    | value        | command that produced it | date (YYYY-MM-DD) |
| ---------------------- | ------------ | ------------------------ | ----------------- |
| tests_total            | 401          | pnpm test                | 2026-10-14        |
| tests_passed           | 401          | pnpm test                | 2026-10-14        |
| property_runs          | 1000         | pnpm test:property       | 2026-10-14        |
| mutation_score         | 90.63%       | pnpm mutation            | 2026-10-14        |
| mutants_killed         | 522          | pnpm mutation            | 2026-10-14        |
| mutants_survived       | 53           | pnpm mutation            | 2026-10-14        |
| coverage_lines         | not measured | pnpm test --coverage     | 2026-10-12        |
| coverage_branches      | not measured | pnpm test --coverage     | 2026-10-12        |
| size_money_gz          | 737 B        | pnpm size                | 2026-10-14        |
| size_submit_gz         | 155 B        | pnpm size                | 2026-10-14        |
| size_boundary_gz       | 320 B        | pnpm size                | 2026-10-14        |
| size_react_gz          | 1488 B       | pnpm size                | 2026-10-14        |
| size_app_gz            | 80771 B      | pnpm size                | 2026-10-14        |
| axe_violations_jest    | 0            | pnpm test:a11y           | 2026-10-14        |
| axe_violations_cypress | 0            | pnpm e2e:a11y            | 2026-10-14        |
| journeys_passed        | 8            | pnpm e2e                 | 2026-10-14        |

## Equivalent Mutants

- `src/money/fee.ts:62`: `rawFeeBig <= minFeeBig` (mutated from `rawFeeBig < minFeeBig`). Reason: When `rawFeeBig === minFeeBig` (100n), both branches produce 100n, rendering `<=` functionally identical to `<` across all inputs.
