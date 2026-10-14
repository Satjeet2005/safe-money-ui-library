describe('J7 — Stale details and quote/rate changes', () => {
  it('j7a — handles details changed after Review', () => {
    // 1. Reach Review with an amount of 100
    cy.visitDeterministic({ withClock: true });
    cy.get('#recipient').select('rcp-001');
    cy.get('#amount').clear().type('100');
    cy.contains('button', 'Review transfer').click();
    cy.contains('h1', 'Review your transfer').should('be.visible');

    // 2. Open Chaos mode and activate "Simulate edit from another tab"
    cy.get('#chaos-toggle-button').click();
    cy.contains('button', 'Simulate edit from another tab').click();

    // 3. Confirm the transfer
    cy.get('#confirm-button').click();

    // 4. Assert app remains on Review
    cy.contains('h1', 'Review your transfer').should('be.visible');

    // 5. Assert review.changed banner appears
    cy.contains(
      'Your details changed after review. Review the updated transfer before confirming.',
    ).should('be.visible');

    // 6. Assert send amount is updated to $101.00
    cy.contains('dt', 'You send').next('dd').should('have.text', '$101.00');

    // 7. Assert executedCount() === 0
    cy.assertExecutedCount(0);

    // 8. Confirm again after reviewing updated details
    cy.get('#confirm-button').click();

    // 9. Assert Result heading is Transfer sent
    cy.contains('h1', 'Transfer sent').should('be.visible');
  });

  it('j7b — handles quote expired without amount changes', () => {
    // 1. Reach Review
    cy.visitDeterministic({ withClock: true });
    cy.get('#recipient').select('rcp-001');
    cy.get('#amount').clear().type('100');
    cy.contains('button', 'Review transfer').click();
    cy.contains('h1', 'Review your transfer').should('be.visible');

    // 2. Advance fake clock by 31000 ms to expire quote hold
    cy.tick(31000);

    // 3. Activate Confirm
    cy.get('#confirm-button').click();

    // 4. Assert review.rateRefreshed banner appears
    cy.contains('Your rate expired, so we refreshed it. Your amounts have not changed.').should(
      'be.visible',
    );

    // 5. Assert executedCount() === 0
    cy.assertExecutedCount(0);

    // 6. Assert user remains on Review and inspects refreshed quote
    cy.contains('h1', 'Review your transfer').should('be.visible');
    cy.contains('dt', 'You send').next('dd').should('have.text', '$100.00');
  });

  it('j7c — handles rate moves while quote is held', () => {
    // 1. Reach Review with 100
    cy.visitDeterministic({ withClock: true });
    cy.get('#recipient').select('rcp-001');
    cy.get('#amount').clear().type('100');
    cy.contains('button', 'Review transfer').click();
    cy.contains('h1', 'Review your transfer').should('be.visible');

    // 2. Enable "Rate moves on the next quote (+0.5%)"
    cy.get('#chaos-toggle-button').click();
    cy.get('#chaos-rate').check();

    // 3. Advance fake clock by 31000 ms
    cy.tick(31000);

    // 4. Activate Confirm
    cy.get('#confirm-button').click();

    // 5. Assert review.rateChanged banner appears
    cy.contains('The rate changed. Review the new amounts before confirming.').should('be.visible');

    // 6. Assert receive amount reads €92.46
    cy.contains('dt', 'They receive').next('dd').should('have.text', '€92.46');

    // 7. Assert executedCount() === 0
    cy.assertExecutedCount(0);
  });
});
