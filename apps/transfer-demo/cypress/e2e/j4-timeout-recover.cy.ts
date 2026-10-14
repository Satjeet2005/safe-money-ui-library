describe('J4 — Timeout recovery and late response', () => {
  it('j4a — handles timeout then recover', () => {
    // 1. Start fresh deterministic visit with fake clock installed
    cy.visitDeterministic({ withClock: true });

    // 2. Reach Review normally
    cy.get('#recipient').select('rcp-001');
    cy.get('#amount').clear().type('100');
    cy.contains('button', 'Review transfer').click();
    cy.contains('h1', 'Review your transfer').should('be.visible');
    cy.checkAppA11y();

    // 3. Open Chaos mode and enable "Timeout then recover" preset
    cy.get('#chaos-toggle-button').click();
    cy.contains('button', 'Timeout then recover').click();

    // 4. Confirm the transfer
    cy.get('#confirm-button').click();

    // 5. Advance clock by 12000 ms
    cy.tick(12000);

    // 6. Assert Result shows "We couldn't confirm this transfer"
    cy.contains('h1', "We couldn't confirm this transfer").should('be.visible');

    // 7. Assert execution count is 0
    cy.assertExecutedCount(0);

    // 8. Assert UI is in unconfirmed state, not success state
    cy.contains('h1', 'Transfer sent').should('not.exist');
    cy.contains(
      "Your money may or may not have been sent. Trying again is safe: we won't send it twice.",
    ).should('be.visible');
    cy.checkAppA11y();

    // 9. Activate Reset chaos
    cy.contains('button', 'Reset chaos').click();

    // 10. Activate Try again
    cy.contains('button', 'Try again').click();

    // 11. Assert Result heading is Transfer sent
    cy.contains('h1', 'Transfer sent').should('be.visible');

    // 12. Assert execution count is 1
    cy.assertExecutedCount(1);
    cy.checkAppA11y();
  });

  it('j4b — handles late response after timeout and retries idempotently', () => {
    // 1. Start fresh deterministic visit with fake clock installed
    cy.visitDeterministic({ withClock: true });

    // 2. Reach Review and set "Response arrives after the timeout (first attempt only)"
    cy.get('#recipient').select('rcp-001');
    cy.get('#amount').clear().type('100');
    cy.contains('button', 'Review transfer').click();
    cy.contains('h1', 'Review your transfer').should('be.visible');

    cy.get('#chaos-toggle-button').click();
    cy.get('#chaos-late').check();
    cy.checkAppA11y();

    // 3. Confirm the transfer
    cy.get('#confirm-button').click();

    // 4. Advance clock by 12000 ms
    cy.tick(12000);

    // 5. Assert Result shows "We couldn't confirm this transfer"
    cy.contains('h1', "We couldn't confirm this transfer").should('be.visible');

    // 6. Assert execution count is 1 (server executed before delayed delivery)
    cy.assertExecutedCount(1);
    cy.checkAppA11y();

    // 7. Activate Try again
    cy.contains('button', 'Try again').click();

    // 8. Assert Result now shows Transfer sent
    cy.contains('h1', 'Transfer sent').should('be.visible');

    // 9. Assert transfer ID is TRF-000001
    cy.contains('dt', 'Transfer ID').next('dd').should('have.text', 'TRF-000001');

    // 10. Advance clock by 5000 ms to allow late response to arrive
    cy.tick(5000);

    // 11. Assert UI remains in same success state with same transfer ID
    cy.contains('h1', 'Transfer sent').should('be.visible');
    cy.contains('dt', 'Transfer ID').next('dd').should('have.text', 'TRF-000001');

    // 12. Assert service execution count remains 1
    cy.assertExecutedCount(1);

    // 13. Assert exactly one completed Recent activity row exists for this transfer
    cy.get('section[aria-label="Recent activity"] ul li')
      .should('have.length', 1)
      .and('contain.text', 'Completed');
    cy.checkAppA11y();
  });
});
