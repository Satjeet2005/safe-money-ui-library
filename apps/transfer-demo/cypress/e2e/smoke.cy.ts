describe('Cypress Infrastructure Smoke Check (WP-24A)', () => {
  it('launches against production served app with deterministic setup and Axe helpers', () => {
    // 1. Verify default viewport 1280x800
    cy.wrap(Cypress.config('viewportWidth')).should('equal', 1280);
    cy.wrap(Cypress.config('viewportHeight')).should('equal', 800);

    // 2. Deterministic visit with cleared sessionStorage
    cy.visitDeterministic();

    // 3. Verify window.__smu exists and executedCount is 0 initially
    cy.assertExecutedCount(0);
    cy.getSmuDebug().then((debug) => {
      cy.wrap(debug.executedCount()).should('equal', 0);
      cy.wrap(debug.balances()).should('be.an', 'object');
      cy.wrap(debug.transferIds()).should('be.an', 'array');
    });

    // 4. Verify Axe check helper works without violations
    cy.checkAppA11y();

    // 5. Verify real keyboard support is registered
    cy.wrap(typeof cy.realPress).should('equal', 'function');
  });
});
