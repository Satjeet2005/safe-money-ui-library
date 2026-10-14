describe('J1 — Happy path', () => {
  const cases = [
    {
      name: 'Mateo Alvarez (EUR)',
      recipientId: 'rcp-001',
      send: '$100.00',
      fee: '$1.00',
      total: '$101.00',
      receive: '€92.00',
    },
    {
      name: 'Kenji Watanabe (JPY)',
      recipientId: 'rcp-003',
      send: '$100.00',
      fee: '$1.00',
      total: '$101.00',
      receive: '¥15,000',
    },
    {
      name: 'Omar Al-Sabah (KWD)',
      recipientId: 'rcp-005',
      send: '$100.00',
      fee: '$1.00',
      total: '$101.00',
      receive: 'KWD 30.700',
    },
  ];

  cases.forEach(({ name, recipientId, send, fee, total, receive }) => {
    it(`completes happy path transfer for ${name}`, () => {
      cy.visitDeterministic();
      cy.checkAppA11y();

      // Form step: select recipient, USD currency, type 100
      cy.get('#recipient').select(recipientId);
      cy.get('#account').should('contain.text', 'USD');
      cy.get('#amount').clear().type('100');
      cy.checkAppA11y();

      // Press Review
      cy.contains('button', 'Review transfer').click();

      // Review step assertions
      cy.contains('h1', 'Review your transfer').should('be.visible');
      cy.contains('dt', 'You send').next('dd').should('have.text', send);
      cy.contains('dt', 'Fee').next('dd').should('have.text', fee);
      cy.contains('dt', 'Total from your account').next('dd').should('have.text', total);
      cy.contains('dt', 'They receive')
        .next('dd')
        .invoke('text')
        .then((text) => {
          const normalized = text.replace(/\u00a0/g, ' ');
          cy.wrap(normalized).should('equal', receive);
        });
      cy.checkAppA11y();

      // Confirm
      cy.get('#confirm-button').click();

      // Result step assertions
      cy.contains('h1', 'Transfer sent').should('be.visible');
      cy.contains('dt', 'Transfer ID').next('dd').should('have.text', 'TRF-000001');
      cy.assertExecutedCount(1);
      cy.get('.account-summary').should('contain.text', 'USD · $4,899.00');
      cy.get('section[aria-label="Recent activity"] ul li')
        .first()
        .invoke('text')
        .should('match', /^Completed\s*·/);
      cy.checkAppA11y();
    });
  });

  it('j1k — completes keyboard-only variant for Mateo', () => {
    cy.visitDeterministic();

    // Verify step heading receives focus on arrival
    cy.focused().should('have.prop', 'tagName', 'H1').and('have.text', 'Send money');
    cy.checkAppA11y();

    // Tab to recipient select
    cy.realPress('Tab');
    cy.focused().should('have.id', 'recipient');

    // Select Mateo using arrow key
    cy.realPress('ArrowDown');
    cy.get('#recipient').should('have.value', 'rcp-001');

    // Tab past account and locale to amount
    cy.realPress('Tab');
    cy.focused().should('have.id', 'account');

    cy.realPress('Tab');
    cy.focused().should('have.id', 'locale');

    cy.realPress('Tab');
    cy.focused().should('have.id', 'amount');

    // Enter 100 using real keyboard
    cy.realType('100');
    cy.focused().should('have.id', 'amount').and('have.value', '100');

    // Tab to Review button and activate with Enter
    cy.realPress('Tab');
    cy.focused().should('have.prop', 'tagName', 'BUTTON').and('contain.text', 'Review transfer');
    cy.realPress('Enter');

    // Review step heading receives focus on arrival
    cy.focused().should('have.prop', 'tagName', 'H1').and('have.text', 'Review your transfer');
    cy.contains('dt', 'You send').next('dd').should('have.text', '$100.00');
    cy.contains('dt', 'Fee').next('dd').should('have.text', '$1.00');
    cy.contains('dt', 'Total from your account').next('dd').should('have.text', '$101.00');
    cy.contains('dt', 'They receive').next('dd').should('have.text', '€92.00');
    cy.checkAppA11y();

    // Tab to Confirm button and activate with Enter
    cy.realPress('Tab');
    cy.focused().should('have.id', 'confirm-button');
    cy.realPress('Enter');

    // Result heading receives focus on arrival
    cy.focused().should('have.prop', 'tagName', 'H1').and('have.text', 'Transfer sent');
    cy.contains('dt', 'Transfer ID').next('dd').should('have.text', 'TRF-000001');
    cy.assertExecutedCount(1);
    cy.get('.account-summary').should('contain.text', 'USD · $4,899.00');
    cy.get('section[aria-label="Recent activity"] ul li')
      .first()
      .invoke('text')
      .should('match', /^Completed\s*·/);
    cy.checkAppA11y();
  });

  it('completes mobile variant at 375x667 with no horizontal scroll', () => {
    cy.viewport(375, 667);
    cy.visitDeterministic();

    // Verify no horizontal scroll on form
    cy.window().then((win) => {
      cy.wrap(win.document.documentElement.scrollWidth).should('be.lte', win.innerWidth);
    });

    cy.get('#recipient').select('rcp-001');
    cy.get('#amount').clear().type('100');
    cy.contains('button', 'Review transfer').click();

    cy.contains('h1', 'Review your transfer').should('be.visible');
    cy.window().then((win) => {
      cy.wrap(win.document.documentElement.scrollWidth).should('be.lte', win.innerWidth);
    });

    cy.get('#confirm-button').click();

    cy.contains('h1', 'Transfer sent').should('be.visible');
    cy.window().then((win) => {
      cy.wrap(win.document.documentElement.scrollWidth).should('be.lte', win.innerWidth);
    });
    cy.contains('dt', 'Transfer ID').next('dd').should('have.text', 'TRF-000001');
    cy.assertExecutedCount(1);
    cy.get('.account-summary').should('contain.text', 'USD · $4,899.00');
  });
});
