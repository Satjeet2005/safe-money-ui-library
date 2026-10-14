/// <reference types="cypress" />
/// <reference types="cypress-real-events" />

import { AXE_CONFIG, buildDeterministicUrl, extractSmuDebug, type SmuDebug } from './helpers';

export interface VisitDeterministicOptions {
  withClock?: boolean;
  clockNow?: number | Date;
  extraParams?: Record<string, string>;
  onBeforeLoad?: (win: Cypress.AUTWindow) => void;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      visitDeterministic(options?: VisitDeterministicOptions): Chainable<AUTWindow>;
      getSmuDebug(): Chainable<SmuDebug>;
      assertExecutedCount(expected: number): Chainable<void>;
      checkAppA11y(
        context?: Parameters<typeof cy.checkA11y>[0],
        options?: Parameters<typeof cy.checkA11y>[1],
      ): Chainable<void>;
    }
  }
}

Cypress.Commands.add('visitDeterministic', (options: VisitDeterministicOptions = {}) => {
  if (options.withClock) {
    if (options.clockNow !== undefined) {
      cy.clock(options.clockNow);
    } else {
      cy.clock();
    }
  }

  const url = buildDeterministicUrl(options.extraParams);
  return cy.visit(url, {
    onBeforeLoad(win) {
      win.sessionStorage.clear();
      if (options.onBeforeLoad) {
        options.onBeforeLoad(win);
      }
    },
  });
});

Cypress.Commands.add('getSmuDebug', () => {
  return cy.window().then((win) => extractSmuDebug(win));
});

Cypress.Commands.add('assertExecutedCount', (expected: number) => {
  cy.window().then((win) => {
    const debug = extractSmuDebug(win);
    cy.wrap(debug.executedCount()).should('equal', expected);
  });
});

Cypress.Commands.add('checkAppA11y', (context, options) => {
  cy.injectAxe();
  cy.window({ log: false }).then((win) => {
    const isFakeTimer =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Boolean((win.setTimeout as any)?.clock) ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Boolean((win.setTimeout as any)?.isSinonProxy) ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Boolean((win.Date as any)?.isSinonProxy);

    if (isFakeTimer) {
      const fakeSetTimeout = win.setTimeout;
      const fakeClearTimeout = win.clearTimeout;
      const nativeSetTimeout = window.top?.setTimeout.bind(window.top) ?? fakeSetTimeout;
      const nativeClearTimeout = window.top?.clearTimeout.bind(window.top) ?? fakeClearTimeout;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      win.setTimeout = nativeSetTimeout as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      win.clearTimeout = nativeClearTimeout as any;

      cy.checkA11y(context, {
        ...AXE_CONFIG,
        ...options,
      });
      return cy.then(() => {
        win.setTimeout = fakeSetTimeout;
        win.clearTimeout = fakeClearTimeout;
      });
    }

    return cy.checkA11y(context, {
      ...AXE_CONFIG,
      ...options,
    });
  });
});

export {};
