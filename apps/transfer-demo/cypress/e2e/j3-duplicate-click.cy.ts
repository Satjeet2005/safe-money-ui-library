describe('J3 — Duplicate Confirm in the same tick', () => {
  it('prevents duplicate execution on synchronous double-click', () => {
    // 1. Start a fresh deterministic visit with fake clock installed before app timers
    cy.visitDeterministic({ withClock: true });

    // 2. Reach Review through normal form interaction
    cy.get('#recipient').select('rcp-001');
    cy.get('#amount').clear().type('100');
    cy.contains('button', 'Review transfer').click();
    cy.contains('h1', 'Review your transfer').should('be.visible');

    // 3. Open Chaos mode and set Latency to 500 ms
    cy.get('#chaos-toggle-button').click();
    cy.get('#chaos-latency-500').check();

    // 4. Activate Double-click Confirm
    cy.contains('button', 'Double-click Confirm').click();

    // 5. Advance fake clock by exactly 500 ms for submit
    cy.tick(500);

    // 6. Assert Result heading is Transfer sent
    cy.contains('h1', 'Transfer sent').should('be.visible');

    // Advance clock by 500 ms to allow loadAccounts to complete with latency
    cy.tick(500);

    // 7. Assert window.__smu.executedCount() equals 1
    cy.assertExecutedCount(1);

    // 8. Assert USD balance reads $4,899.00
    cy.get('.account-summary').should('contain.text', 'USD · $4,899.00');

    // 9. Assert exactly one completed Recent activity row exists for this transfer
    cy.get('section[aria-label="Recent activity"] ul li')
      .should('have.length', 1)
      .and('contain.text', 'Completed');

    cy.checkAppA11y();
  });
});
