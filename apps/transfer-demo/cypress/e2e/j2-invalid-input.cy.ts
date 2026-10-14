describe('J2 — Invalid input, locale behaviour and insufficient funds', () => {
  it('enforces validation, error summary navigation, and client balance limits', () => {
    cy.visitDeterministic();
    cy.checkAppA11y();

    // 1. Attempt Review without choosing a recipient or entering an amount
    cy.contains('button', 'Review transfer').click();

    // 2. Assert error summary says "Fix 2 problems to continue" and receives focus
    cy.get('#error-summary').should('be.visible').and('contain.text', 'Fix 2 problems to continue');
    cy.focused().should('have.id', 'error-summary');
    cy.checkAppA11y();

    // 3. Activate its first error link and assert focus moves to #recipient
    cy.get('#error-summary a').first().click();
    cy.focused().should('have.id', 'recipient');

    // 4. Choose Mateo
    cy.get('#recipient').select('rcp-001');

    // 5. Enter 1,5 and blur the amount field
    cy.get('#amount').clear().type('1,5').blur();

    // 6. Assert grouping error specified by PRD (error.INVALID_GROUPING)
    cy.get('#amount-error')
      .should('be.visible')
      .and(
        'contain.text',
        'Thousands separators are in the wrong place. Remove them or check the number format.',
      );
    cy.checkAppA11y();

    // 7. Switch Number format to de-DE
    cy.get('#locale').select('de-DE');

    // 8. Enter 1,234 and assert exact validation message "USD allows up to 2 decimals."
    cy.get('#amount').clear().type('1,234').blur();
    cy.get('#amount-error')
      .should('be.visible')
      .and('contain.text', 'USD allows up to 2 decimals.');
    cy.checkAppA11y();

    // 9. Enter 6.000,00 and assert insufficient-funds message "Not enough funds. Available: 5.000,00 $"
    cy.get('#amount').clear().type('6.000,00').blur();
    cy.get('#amount-error')
      .should('be.visible')
      .invoke('text')
      .then((text) => {
        const normalized = text.replace(/\u00a0/g, ' ');
        cy.wrap(normalized).should('contain', 'Not enough funds. Available: 5.000,00 $');
      });
    cy.checkAppA11y();

    // 10. Enter 0,99 and assert "Minimum is 1,00 $."
    cy.get('#amount').clear().type('0,99').blur();
    cy.get('#amount-error')
      .should('be.visible')
      .invoke('text')
      .then((text) => {
        const normalized = text.replace(/\u00a0/g, ' ');
        cy.wrap(normalized).should('contain', 'Minimum is 1,00 $.');
      });
    cy.checkAppA11y();

    // 11. Assert Review is never entered
    cy.contains('h1', 'Review your transfer').should('not.exist');

    // 12. Assert service transfer execution count remains 0
    cy.assertExecutedCount(0);
  });
});
