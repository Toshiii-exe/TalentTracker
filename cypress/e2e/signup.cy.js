describe('Athlete Sign Up Flow', () => {
    const uniqueId = Date.now();
    const testUser = {
        username: `athlete_${uniqueId}`,
        phoneNumber: '0771234567',
        email: `test_${uniqueId}@example.com`,
        password: 'Password123!'
    };

    beforeEach(() => {
        cy.clearLocalStorage();
        cy.clearCookies();
    });

    it('should successfully create a new athlete account', () => {
        // 1. Visit the signup page
        cy.visit('/signup-athlete.html');

        // 2. Fill in the details
        cy.get('[data-testid="signup-username-input"]')
            .should('be.visible')
            .type(testUser.username);

        cy.get('[data-testid="signup-phone-input"]')
            .should('be.visible')
            .type(testUser.phoneNumber);

        cy.get('[data-testid="signup-email-input"]')
            .should('be.visible')
            .type(testUser.email);

        cy.get('[data-testid="signup-password-input"]')
            .should('be.visible')
            .type(testUser.password);

        // 3. Click the Create Account button
        cy.get('[data-testid="signup-submit-btn"]').click();

        // 4. Handle the success modal if it appears
        // The signup-athlete.js calls showSuccessModal which likely has a button to continue
        // Let's look for a success message or the redirection

        // Check for "Account created successfully!" message
        cy.contains('Account created successfully!', { timeout: 10000 }).should('be.visible');

        // Click OK/Success button in the modal if it exists
        cy.get('button').contains('OK').click({ force: true });

        // 5. Verify redirection to createprofile.html
        cy.url({ timeout: 10000 }).should('include', 'createprofile.html');

        // 6. Verify local storage has the user data
        cy.window().then((win) => {
            const user = JSON.parse(win.localStorage.getItem('user'));
            expect(user.username).to.equal(testUser.username);
            expect(win.localStorage.getItem('token')).to.not.be.null;
        });
    });
});
