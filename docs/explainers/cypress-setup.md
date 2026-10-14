# Explainer: cypress-setup

## What it does

`apps/transfer-demo/cypress.config.ts` and `apps/transfer-demo/cypress/support/` configure end-to-end browser journey testing against production builds, setting viewports, deterministic test harnesses (`?deterministic=1`), and automated Axe accessibility auditing.

## Why it exists

Unit tests running in JSDOM cannot evaluate real browser rendering, layout shift, native keyboard tab focus, or asynchronous browser events. Cypress verifies full multi-screen user journeys against compiled production assets under deterministic timing and storage conditions.

## How it works

1. Configures a 1280×800 desktop viewport with video recordings and failure screenshot capture.
2. Sets `baseUrl` to the local test server (`http://localhost:5173`).
3. Defines spec pattern targeting `cypress/e2e/**/*.cy.{js,jsx,ts,tsx}`.
4. Provides `cy.visitDeterministic` helper that clears `sessionStorage` and appends `?deterministic=1`.
5. Injects Sinon fake timers for instant deterministic clock advancement without real-time delays.
6. Integrates `cypress-real-events` for authentic OS-level keyboard focus and tab navigation.
7. Configures `cypress-axe` with WCAG 2.2 AA tags (`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`).
8. Keeps color contrast rules enabled under real browser layout rendering.
9. Exposes `window.__smu` debug interface for verifying internal execution counts and state snapshots.

## Trade-offs

Cypress journeys run against production-built static assets served via a local HTTP server rather than against the development dev server. This catches real-world issues such as minification bugs, missing CSS extraction, and bundle path resolution failures before deployment.

## How it is tested

- Configuration tests in `apps/transfer-demo/src/cypressSetup.test.ts` verify assertions `CS-01` through `CS-06` (viewport, paths, Axe tags, URL builder, debug helper).
- 8 comprehensive browser journeys (`j1` through `j8`) verify happy path, invalid inputs, double clicks, timeouts, lost responses, rejections, stale details, and bad payloads.
- Automated accessibility audits in `pnpm e2e:a11y` verify zero Axe violations across all journey checkpoints.

## Questions an interviewer may ask

1. How does `cy.visitDeterministic` eliminate timing flakiness in timeout and recovery journeys?
2. Why does Cypress use `cypress-real-events` instead of standard `cy.type()` or `cy.trigger()` for keyboard navigation?
3. What role does `window.__smu` play during Cypress journey execution?
