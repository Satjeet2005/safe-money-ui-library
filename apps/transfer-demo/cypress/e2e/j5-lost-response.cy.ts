describe('J5 — Lost response and idempotent retry', () => {
  it('recovers from lost response on retry without duplicate debit', () => {
    // 1. Start fresh deterministic visit with fake clock installed
    cy.visitDeterministic({ withClock: true });

    // 2. Reach Review normally
    cy.get('#recipient').select('rcp-001');
    cy.get('#amount').clear().type('100');
    cy.contains('button', 'Review transfer').click();
    cy.contains('h1', 'Review your transfer').should('be.visible');

    // 3. Open Chaos mode and apply "Lost response" preset
    cy.get('#chaos-toggle-button').click();
    cy.contains('button', 'Lost response').click();

    // 4. Confirm the transfer
    cy.get('#confirm-button').click();

    // 5. Assert Result heading is unconfirmed
    cy.contains('h1', "We couldn't confirm this transfer").should('be.visible');

    // 6. Assert executedCount() === 1 (server executed before dropping delivery)
    cy.assertExecutedCount(1);

    // 7. Activate Try again
    cy.contains('button', 'Try again').click();

    // 8. Assert Result heading becomes Transfer sent
    cy.contains('h1', 'Transfer sent').should('be.visible');

    // 9. Assert transfer ID is TRF-000001
    cy.contains('dt', 'Transfer ID').next('dd').should('have.text', 'TRF-000001');

    // 10. Assert executedCount() === 1 after retry (idempotent replay)
    cy.assertExecutedCount(1);

    // 11. Assert USD balance is $4,899.00 (debited only once)
    cy.get('.account-summary').should('contain.text', 'USD · $4,899.00');
  });
});
