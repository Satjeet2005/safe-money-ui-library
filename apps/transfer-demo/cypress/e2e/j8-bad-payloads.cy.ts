describe('J8 — Invalid and corrupted data recovery', () => {
  function ensureChaosPanelOpen() {
    cy.get('body').then(($body) => {
      if (!$body.find('#chaos-panel').length) {
        cy.get('#chaos-toggle-button').click();
      }
    });
  }

  it('j8a — handles malformed service response and retries cleanly', () => {
    // 1. Reach Review and enable Malformed response
    cy.visitDeterministic({ withClock: true });
    cy.get('#recipient').select('rcp-001');
    cy.get('#amount').clear().type('100');
    cy.contains('button', 'Review transfer').click();
    cy.contains('h1', 'Review your transfer').should('be.visible');

    ensureChaosPanelOpen();
    cy.get('#chaos-malformed').check();

    // 2. Confirm transfer
    cy.get('#confirm-button').click();

    // 3. Assert unconfirmed result
    cy.contains('h1', "We couldn't confirm this transfer").should('be.visible');

    // 4. Assert executed count is 1
    cy.assertExecutedCount(1);

    // 5. Assert no success state displayed
    cy.contains('h1', 'Transfer sent').should('not.exist');

    // 6. Disable malformed response
    ensureChaosPanelOpen();
    cy.get('#chaos-malformed').uncheck();

    // 7. Activate Try again
    cy.contains('button', 'Try again').click();

    // 8. Assert Result heading is Transfer sent
    cy.contains('h1', 'Transfer sent').should('be.visible');

    // 9. Assert transfer ID is TRF-000001
    cy.contains('dt', 'Transfer ID').next('dd').should('have.text', 'TRF-000001');

    // 10. Assert executed count remains 1 after retry
    cy.assertExecutedCount(1);
  });

  it('j8b — handles well-formed response with inconsistent amounts', () => {
    // 1. Reach Review and enable Valid response with wrong amounts
    cy.visitDeterministic({ withClock: true });
    cy.get('#recipient').select('rcp-001');
    cy.get('#amount').clear().type('100');
    cy.contains('button', 'Review transfer').click();
    cy.contains('h1', 'Review your transfer').should('be.visible');

    ensureChaosPanelOpen();
    cy.get('#chaos-wrong-amounts').check();

    // 2. Confirm transfer
    cy.get('#confirm-button').click();

    // 3. Assert unconfirmed Result heading
    cy.contains('h1', "We couldn't confirm this transfer").should('be.visible');

    // 4. Assert executed count is 1
    cy.assertExecutedCount(1);

    // 5. Assert no false success state
    cy.contains('h1', 'Transfer sent').should('not.exist');

    // 6. Disable inconsistent payload control
    ensureChaosPanelOpen();
    cy.get('#chaos-wrong-amounts').uncheck();

    // 7. Activate Try again
    cy.contains('button', 'Try again').click();

    // 8. Assert Result heading is Transfer sent
    cy.contains('h1', 'Transfer sent').should('be.visible');

    // 9. Assert transfer ID is TRF-000001
    cy.contains('dt', 'Transfer ID').next('dd').should('have.text', 'TRF-000001');

    // 10. Assert executed count remains 1 after retry
    cy.assertExecutedCount(1);
  });

  it('j8c — handles corrupt persisted draft', () => {
    // 1. Start fresh deterministic visit with clean storage
    cy.visitDeterministic();
    cy.checkAppA11y();

    // 2. Activate Corrupt the saved draft
    ensureChaosPanelOpen();
    cy.get('#chaos-corrupt-storage').check();

    // 3. Confirm storage has written corrupted value
    cy.window().then((win) => {
      cy.wrap(win.sessionStorage.getItem('smu.draft.v1')).should('exist');
    });

    // 4. Reload page
    cy.reload();

    // 5. Assert banner reads "Your saved draft was unreadable, so we cleared it."
    cy.contains('Your saved draft was unreadable, so we cleared it.').should('be.visible');
    cy.checkAppA11y();

    // 6. Assert form is empty
    cy.get('#recipient').should('have.value', '');
    cy.get('#amount').should('have.value', '');

    // 7. Assert no transfer was executed
    cy.assertExecutedCount(0);
    cy.checkAppA11y();
  });
});
