describe('Talent Tracker Complete System QA Audit', () => {
    let uniqueId = Date.now().toString().slice(-6);
    let athleteName = `Test Athlete ${uniqueId}`;
    let athleteUsername = `athlete_${uniqueId}`;
    let coachUsername = `coach_${uniqueId}`;

    const admin = {
        email: 'federation@talenttracker.com',
        password: 'admin123'
    };

    beforeEach(() => {
        cy.clearLocalStorage();
        cy.clearCookies();
    });

    it('Scenario 1: Full Athlete Journey (Signup -> Profile -> Performance)', () => {
        // 1. Signup
        cy.visit('/signup-athlete.html');
        cy.get('[data-testid="signup-username-input"]').type(athleteUsername);
        cy.get('[data-testid="signup-phone-input"]').type('0771112222');
        cy.get('[data-testid="signup-email-input"]').type(`ath_${uniqueId}@example.com`);
        cy.get('[data-testid="signup-password-input"]').type('Password123!');
        cy.get('[data-testid="signup-submit-btn"]').click();

        // Increased timeout and wait for modal visibility
        cy.get('#successModal', { timeout: 30000 }).should('be.visible');
        cy.get('#successModalBtn').click();


        // Redirects directly to createprofile.html from signup-athlete.js
        cy.url().should('include', 'createprofile.html');

        // 2. Profile Creation
        cy.get('#fullName').type(athleteName);
        cy.get('#gender').select('Male');
        cy.get('#dob').type('2005-01-01');
        cy.get('#citySelect').select('Colombo');

        cy.get('#height').type('175');
        cy.get('#weight').type('70');

        // Category
        cy.get('#category').select('Open');

        // Event
        cy.get('button').contains('Add Another Event').click();
        cy.get('.event-select').first().select('100m');
        cy.get('.event-time').first().type('11.5');
        cy.get('.event-experience').first().select('National Competitor');
        cy.get('.event-level').first().select('National Sports Festival');

        // Submit
        cy.get('#submitBtn').click();

        cy.contains('Profile saved successfully!', { timeout: 30000 }).should('be.visible');
        cy.get('button').contains('OK').click({ force: true });
        cy.url().should('include', 'dashboard.html');

        // 3. Performance Record
        cy.get('#dashUserName').should('contain', athleteUsername.toUpperCase());
        cy.get('[data-testid="performance-event-select"]').should('be.visible');
        cy.get('[data-testid="performance-event-select"]').select('100m');
        cy.get('[data-testid="performance-date-input"]').type('2024-05-20');
        cy.get('[data-testid="performance-result-input"]').type('11.20');
        cy.get('[data-testid="performance-save-btn"]').click();

        cy.get('[data-testid="performance-pb-display"]').should('contain', '11.20');

        // 4. Logout
        cy.get('[data-testid="nav-user-toggle"]').click();
        cy.get('[data-testid="nav-logout-btn"]').click();
        cy.url().should('include', 'index.html');
    });

    it('Scenario 2: Coach Journey (Signup -> Directory)', () => {
        // 1. Coach Signup
        cy.visit('/signup-coach.html');
        cy.get('[data-testid="signup-username-input"]').type(coachUsername);
        cy.get('[data-testid="signup-phone-input"]').type('0712223333');
        cy.get('[data-testid="signup-email-input"]').type(`coach_${uniqueId}@example.com`);
        cy.get('[data-testid="signup-password-input"]').type('Password123!');
        cy.get('[data-testid="signup-submit-btn"]').click();

        cy.get('#successModal', { timeout: 20000 }).should('be.visible').within(() => {
            cy.contains('Coach account created successfully!');
            cy.get('button').click();
        });

        cy.url().should('include', 'create-coach-profile.html');

        // 2. Coach Profile
        cy.get('#fullName').type(`Test Coach ${uniqueId}`);
        cy.get('#gender').select('Female');
        cy.get('#dob').type('1985-01-01');
        cy.get('#nationality').type('Sri Lankan');
        cy.get('#nic').type('851234567V');

        // Locations
        cy.get('#provinceSelect').select('Western');
        cy.get('#districtSelect').select('Colombo');
        cy.get('#citySelect').select('Colombo');

        // Sports
        cy.get('input[value="100m"]').click();
        cy.get('input[value="200m"]').click();

        cy.get('#coachingLevel').select('National');
        cy.get('#coachingRole').select('Head Coach');
        cy.get('#experience').type('10');
        cy.get('#organization').type('National Academy');
        cy.get('#highestQual').type('Master Coach License');
        cy.get('#issuingAuthority').type('IAAF');
        cy.get('#certId').type('CERT-999');

        // File upload for certificate
        cy.get('#certDoc').selectFile('dummy_id.pdf');

        cy.get('#termsConsent').click();
        cy.get('#dataConsent').click();
        cy.get('#authConsent').click();

        cy.get('#submitBtn').click();

        cy.contains('Your coach profile has been submitted for verification!', { timeout: 30000 }).should('be.visible');
        cy.get('button').contains('OK').click({ force: true });
        cy.url().should('include', 'coach-home.html');
    });

    it('Scenario 3: Federation Admin Journey (Approval & Events)', () => {
        // 1. Admin Login
        cy.visit('/');
        cy.get('[data-testid="nav-login-btn"]').click();
        cy.get('[data-testid="login-identifier-input"]').type(admin.email);
        cy.get('[data-testid="login-password-input"]').type(admin.password);
        cy.get('[data-testid="login-submit-btn"]').click();

        cy.url().should('include', 'federation-home.html');

        // 2. View User Directory
        cy.get('#tabAthletes', { timeout: 10000 }).should('be.visible').click();
        cy.get('#userSearch').type(athleteName);
        // Wait for search result (rendered dynamically)
        cy.contains(athleteName, { timeout: 10000 }).should('be.visible');

        // 3. Create Event
        cy.visit('/events.html');
        // Wait for admin controls to be revealed by events.js
        cy.get('#adminControls', { timeout: 10000 }).should('be.visible');
        cy.get('#createEventBtn').click();

        cy.get('#eventTitle').type(`National Junior Meet ${uniqueId}`);
        cy.get('#eventDescription').type('Major athletic event for upcoming stars.');
        cy.get('#eventDate').type('2025-12-01');
        cy.get('#eventVenue').type('Sugathadasa Stadium');
        cy.get('#eventCitySelect').select('Colombo');
        cy.get('#eventCategory').select('U20');

        cy.get('#eventForm').submit();

        // Verify event appears in list
        cy.contains(`National Junior Meet ${uniqueId}`, { timeout: 15000 }).should('be.visible');
    });
});
