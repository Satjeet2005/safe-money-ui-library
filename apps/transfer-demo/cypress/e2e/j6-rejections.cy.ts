describe('J6 — Server rejection cases', () => {
  it('handles non-retryable rejection: INSUFFICIENT_FUNDS', () => {
    cy.visitDeterministic({ withClock: true });

    // Reach Review normally
    cy.get('#recipient').select('rcp-001');
    cy.get('#amount').clear().type('100');
    cy.contains('button', 'Review transfer').click();
    cy.contains('h1', 'Review your transfer').should('be.visible');
    cy.checkAppA11y();

    // Set Server rejection to Insufficient funds
    cy.get('#chaos-toggle-button').click();
    cy.get('#chaos-reject-funds').check();

    // Confirm transfer
    cy.get('#confirm-button').click();

    // Assert heading is Transfer not sent
    cy.contains('h1', 'Transfer not sent').should('be.visible');

    // Assert exact copy
    cy.contains(
      "Your account doesn't have enough money for this transfer. Nothing was sent.",
    ).should('be.visible');

    // Assert Try again is absent
    cy.contains('button', 'Try again').should('not.exist');
    cy.checkAppA11y();

    // Activate Edit details
    cy.contains('button', 'Edit details').click();

    // Assert form restored with same recipient and amount text
    cy.contains('h1', 'Send money').should('be.visible');
    cy.get('#recipient').should('have.value', 'rcp-001');
    cy.get('#amount').should('have.value', '100.00');
    cy.checkAppA11y();
  });

  it('handles non-retryable rejection: RECIPIENT_BLOCKED', () => {
    cy.visitDeterministic({ withClock: true });

    // Reach Review normally
    cy.get('#recipient').select('rcp-001');
    cy.get('#amount').clear().type('100');
    cy.contains('button', 'Review transfer').click();
    cy.contains('h1', 'Review your transfer').should('be.visible');
    cy.checkAppA11y();

    // Set Server rejection to Recipient blocked
    cy.get('#chaos-toggle-button').click();
    cy.get('#chaos-reject-blocked').check();

    // Confirm transfer
    cy.get('#confirm-button').click();

    // Assert heading is Transfer not sent
    cy.contains('h1', 'Transfer not sent').should('be.visible');

    // Assert exact copy
    cy.contains("This recipient can't receive transfers right now. Nothing was sent.").should(
      'be.visible',
    );

    // Assert Try again is absent
    cy.contains('button', 'Try again').should('not.exist');
    cy.checkAppA11y();

    // Activate Edit details
    cy.contains('button', 'Edit details').click();

    // Assert form restored with same recipient and amount text
    cy.contains('h1', 'Send money').should('be.visible');
    cy.get('#recipient').should('have.value', 'rcp-001');
    cy.get('#amount').should('have.value', '100.00');
    cy.checkAppA11y();
  });

  it('handles retryable rejection: SERVICE_UNAVAILABLE', () => {
    cy.visitDeterministic({ withClock: true });

    // Reach Review normally
    cy.get('#recipient').select('rcp-001');
    cy.get('#amount').clear().type('100');
    cy.contains('button', 'Review transfer').click();
    cy.contains('h1', 'Review your transfer').should('be.visible');
    cy.checkAppA11y();

    // Set Server rejection to Service unavailable
    cy.get('#chaos-toggle-button').click();
    cy.get('#chaos-reject-unavailable').check();

    // Confirm transfer
    cy.get('#confirm-button').click();

    // Assert heading is Transfer not sent
    cy.contains('h1', 'Transfer not sent').should('be.visible');

    // Assert exact copy
    cy.contains('The service is temporarily unavailable. Nothing was sent.').should('be.visible');

    // Assert Try again is available
    cy.contains('button', 'Try again').should('be.visible');

    // Assert executed count is 0 before retry
    cy.assertExecutedCount(0);
    cy.checkAppA11y();

    // Set Server rejection to None
    cy.get('body').then(($body) => {
      if (!$body.find('#chaos-reject-none').length) {
        cy.get('#chaos-toggle-button').click();
      }
    });
    cy.get('#chaos-reject-none').check();

    // Activate Try again
    cy.contains('button', 'Try again').click();

    // Assert Result heading is Transfer sent
    cy.contains('h1', 'Transfer sent').should('be.visible');

    // Assert execution count is 1 after success
    cy.assertExecutedCount(1);
    cy.checkAppA11y();
  });
});
