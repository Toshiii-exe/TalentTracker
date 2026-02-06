describe('Talent Tracker End-to-End System Flow', () => {
  const testUser = {
    identifier: 'testathlete@example.com',
    password: 'Password123!'
  };

  const performanceData = {
    event: '100m',
    date: '2024-05-20',
    result: '10.55'
  };

  beforeEach(() => {
    // Clear local storage and cookies to ensure a fresh state
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  it('should allow an athlete to login, submit a performance record, and verify data persistence', () => {
    // 1. Open the application
    cy.visit('/');

    // 2. Login as a test user
    cy.get('[data-testid="nav-login-btn"]').click();

    // Fill the login form
    cy.get('[data-testid="login-identifier-input"]')
      .should('be.visible')
      .type(testUser.identifier);

    cy.get('[data-testid="login-password-input"]')
      .should('be.visible')
      .type(testUser.password);

    cy.get('[data-testid="login-submit-btn"]').click();

    // 3. Navigate to the dashboard (Automatic redirect after login)
    cy.url().should('include', 'dashboard.html');

    // Wait for the profile to load (signaled by dashUserName content change)
    cy.get('#dashUserName').should('not.contain', 'Athlete');

    // 4. Create a new record / submit main form
    // Select the event
    cy.get('[data-testid="performance-event-select"]')
      .select(performanceData.event);

    // Set the date
    cy.get('[data-testid="performance-date-input"]')
      .type(performanceData.date);

    // Set the result (Time)
    cy.get('[data-testid="performance-result-input"]')
      .type(performanceData.result);

    // Submit the form
    cy.get('[data-testid="performance-save-btn"]').click();

    // Verify success (Checking for the result in the PB display section)
    cy.get('[data-testid="performance-pb-display"]')
      .should('contain', performanceData.result);

    // 5. Verify the data is saved and visible after reload
    cy.reload();

    // Verify data still exists after reload
    cy.get('[data-testid="performance-pb-display"]')
      .should('be.visible')
      .should('contain', performanceData.result);

    // 6. Logout
    // Click the user toggle to open dropdown
    cy.get('[data-testid="nav-user-toggle"]').click();

    // Click logout
    cy.get('[data-testid="nav-logout-btn"]').click();

    // Verify we are back on the landing page
    cy.url().should('include', 'index.html');
    cy.get('[data-testid="nav-login-btn"]').should('be.visible');
  });
});