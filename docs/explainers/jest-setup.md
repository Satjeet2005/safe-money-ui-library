# Explainer: jest-setup

## What it does

`packages/safe-money-ui/jest.config.ts`, `apps/transfer-demo/jest.config.ts`, and `test/helpers/setup.ts` configure the Jest test environment across the monorepo, providing TypeScript compilation via `@swc/jest`, JSDOM emulation, and automated accessibility matchers.

## Why it exists

Thorough automated testing requires fast execution, consistent DOM simulation for React components, isolated mock lifecycles, and automated accessibility checks without cross-test leakage. Jest configuration standardizes module resolution and provides custom matchers across unit and property tests.

## How it works

1. Configures `@swc/jest` as the transformer for `.ts` and `.tsx` source files.
2. Selects `jsdom` environment to provide browser DOM APIs for component testing.
3. Points `setupFilesAfterEnv` to setup helper scripts.
4. Registers `@testing-library/jest-dom` and `jest-axe` custom matchers (`toHaveNoViolations`).
5. Disables only the `color-contrast` Axe rule in JSDOM due to the absence of a layout and rendering engine.
6. Maps package module paths and extension aliases matching TypeScript imports.
7. Enforces test isolation with `clearMocks: true`.
8. Enforces code coverage collection across library source modules, ignoring barrel index files.

## Trade-offs

The Jest configuration disables only the `color-contrast` rule in JSDOM, while Cypress leaves it enabled in real browsers. Because JSDOM does not compute layout geometry, text bounding boxes, or background pixel rendering, contrast checks in JSDOM produce inaccurate results. Disabling only this single rule in Jest avoids false positives while retaining full contrast checks in Cypress.

## How it is tested

- Smoke tests in `packages/safe-money-ui/test/smoke.test.ts` and `apps/transfer-demo/src/smoke.test.tsx` verify runner execution.
- All 400 automated unit, component, and property tests execute cleanly via `pnpm test`.
- Automated accessibility checks in `pnpm test:a11y` verify zero violations with `toHaveNoViolations()`.

## Questions an interviewer may ask

1. Why is the `color-contrast` Axe rule disabled in Jest but enabled in Cypress?
2. How does `@swc/jest` improve test suite execution speed compared to `ts-jest`?
3. How does the test setup helper clean up DOM state between tests?
