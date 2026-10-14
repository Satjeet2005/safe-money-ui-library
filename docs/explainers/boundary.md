# Explainer: boundary

## What it does

`packages/safe-money-ui/src/boundary/boundary.ts` is a defensive parsing helper that wraps Zod schemas to validate untrusted external data (network responses, browser storage, and URL search parameters) without throwing runtime exceptions.

## Why it exists

External data sources cannot be assumed to match TypeScript types at runtime. Unhandled parsing exceptions cause React component crashes and unhandled promise rejections. Furthermore, standard Zod error dumps can leak sensitive payload data or flood logs with deeply nested validation failures. `parseBoundary` provides safe, sanitized error representations.

## How it works

1. Accepts a Zod schema `z.ZodType<T>` and an untrusted `unknown` input.
2. Invokes `schema.safeParse(input)` to prevent throwing exceptions.
3. If parsing succeeds, returns `{ ok: true, value: parseResult.data }`.
4. If parsing fails, extracts the array of Zod issues.
5. Formats property paths into clean JSON-path expressions (`$` for root, `$.data.amount`).
6. Maps issues to `{ path, message }` objects, strictly omitting unvalidated values.
7. Truncates the issue list to a maximum of 10 items to prevent log exhaustion.
8. Constructs a safe, concise composite summary error message.
9. Wraps issues and path information into a typed `BoundaryError`.
10. Returns `{ ok: false, error: boundaryError }`.

## Trade-offs

The boundary schemas strip unknown keys by default rather than rejecting them with `.strict()`. While strict validation catches unexpected fields, stripping unknown keys provides forward compatibility with evolving backend APIs, preventing client breaks when optional metadata is added.

## How it is tested

- Unit tests in `packages/safe-money-ui/test/boundary/boundary.test.ts` verify cases `BD-01` through `BD-04`, ensuring safe error returns, path formatting, issue truncation at 10 items, and sensitive value omission.
- Cypress journey J8 (`j8-bad-payloads.cy.ts`) tests real-browser recovery from malformed server responses and corrupted saved drafts.

## Questions an interviewer may ask

1. Why does `parseBoundary` avoid including the raw unparsed value in the `BoundaryError` object?
2. Why are error issue arrays truncated at 10 items?
3. When should a schema use `.strip()` versus `.strict()` at an application boundary?
