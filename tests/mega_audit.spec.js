const { test, expect } = require('@playwright/test');
const path = require('path');

/**
 * TALENT TRACKER MEGA AUDIT
 * This script verifies every major user role and function in the system.
 * Roles: Athlete, Coach, Admin (Federation)
 */

const uniqueId = Date.now();
const athlete = {
    username: `athlete_${uniqueId}`,
    phone: '071' + String(uniqueId).slice(-7),
    email: `athlete_${uniqueId}@example.com`,
    password: 'Password123!',
    fullName: `Mega Athlete ${uniqueId}`
};

const coach = {
    username: `coach_${uniqueId}`,
    phone: '077' + String(uniqueId).slice(-7),
    email: `coach_${uniqueId}@example.com`,
    password: 'Password123!',
    fullName: `Mega Coach ${uniqueId}`
};

const admin = {
    email: 'federation@talenttracker.com',
    password: 'admin123'
};

test.describe('Talent Tracker Complete System Audit', () => {

    test.beforeEach(async ({ page }) => {
        // Log page alerts and console errors
        page.on('console', msg => {
            if (msg.type() === 'error' || msg.type() === 'log') {
                console.log(`[PAGE ${msg.type().toUpperCase()}] ${msg.text()}`);
            }
        });
    });

    test('End-to-End System Journey: Every Feature, Every Role', async ({ page }) => {
        test.setTimeout(300000); // 5 minutes for the full crawl

        const logout = async () => {
            console.log("[Audit] Attempting Logout...");
            const toggle = page.locator('#navUserBtn, #navLoginBtn').first();
            await toggle.click();
            await page.locator('#logoutBtn').click();
            await page.waitForTimeout(1000);
        };

        // ==========================================
        // 1. ATHLETE JOURNEY: Signup & Profile
        // ==========================================
        await test.step('Athlete Signup', async () => {
            console.log(`[Audit] Starting Athlete Signup for ${athlete.username}`);
            await page.goto('/signup-athlete.html');
            await page.fill('[data-testid="signup-username-input"]', athlete.username);
            await page.fill('[data-testid="signup-phone-input"]', athlete.phone);
            await page.fill('[data-testid="signup-email-input"]', athlete.email);
            await page.fill('[data-testid="signup-password-input"]', athlete.password);
            await page.click('[data-testid="signup-submit-btn"]');

            const okBtn = page.locator('#successModalBtn');
            await okBtn.waitFor({ state: 'visible', timeout: 30000 });
            await okBtn.click();
            await expect(page).toHaveURL(/createprofile.html/, { timeout: 30000 });
        });

        await test.step('Athlete Profile Completion', async () => {
            console.log(`[Audit] Completing Athlete Profile for ${athlete.fullName}`);
            await page.fill('#fullName', athlete.fullName);
            await page.fill('#dob', '2005-05-15');
            await page.selectOption('#gender', 'Male');
            await page.fill('#phone', athlete.phone);
            await page.fill('#email', athlete.email);
            await page.fill('#street', 'Athlete Street 1');
            await page.selectOption('#citySelect', { label: 'Colombo' });
            await page.fill('#height', '185');
            await page.fill('#weight', '80');

            // Files
            await page.setInputFiles('#idDoc', path.join(process.cwd(), 'dummy_id.pdf'));
            await page.setInputFiles('#profilePic', path.join(process.cwd(), 'dummy_id.pdf'));
            await page.setInputFiles('#clubIDDoc', path.join(process.cwd(), 'dummy_id.pdf'));

            await page.selectOption('#category', 'Open');

            // Add Event Experience
            const eventRow = page.locator('.event-row').first();
            await eventRow.locator('.event-select').selectOption('100m');
            await eventRow.locator('.event-time').fill('10.95');
            await eventRow.locator('.event-experience').selectOption({ label: 'Intermediate' });
            await eventRow.locator('.event-level').selectOption({ label: 'National Sports Festival' });

            await page.click('#submitBtn');

            const successModal = page.locator('#successModalBtn');
            await successModal.waitFor({ state: 'visible', timeout: 30000 });
            await successModal.click();

            await expect(page).toHaveURL(/dashboard.html/, { timeout: 60000 });
        });

        await test.step('Athlete Dashboard & Performance', async () => {
            console.log(`[Audit] Testing Athlete Dashboard - Performance Logging`);
            await expect(page.locator('#dashUserName')).toContainText(athlete.fullName, { timeout: 40000 });

            // Log a performance
            await page.selectOption('[data-testid="performance-event-select"]', '100m');
            await page.fill('[data-testid="performance-date-input"]', '2024-06-01');
            await page.fill('[data-testid="performance-result-input"]', '11.10');
            await page.click('[data-testid="performance-save-btn"]');

            await expect(page.locator('#messageBox')).toBeVisible({ timeout: 20000 });

            await logout();
        });

        // ==========================================
        // 2. COACH JOURNEY: Signup & Management
        // ==========================================
        await test.step('Coach Signup', async () => {
            console.log(`[Audit] Starting Coach Signup for ${coach.username}`);
            await page.goto('/signup-coach.html');
            await page.fill('[data-testid="signup-username-input"]', coach.username);
            await page.fill('[data-testid="signup-phone-input"]', coach.phone);
            await page.fill('[data-testid="signup-email-input"]', coach.email);
            await page.fill('[data-testid="signup-password-input"]', coach.password);
            await page.click('[data-testid="signup-submit-btn"]');

            const okBtn = page.locator('#successModalBtn');
            await okBtn.waitFor({ state: 'visible', timeout: 30000 });
            await okBtn.click();
            await expect(page).toHaveURL(/create-coach-profile.html/, { timeout: 30000 });
        });

        await test.step('Coach Profile Completion', async () => {
            console.log(`[Audit] Completing Coach Profile for ${coach.fullName}`);
            await page.fill('#fullName', coach.fullName);
            await page.selectOption('#gender', 'Male');
            await page.fill('#dob', '1985-01-01');
            await page.fill('#nationality', 'Sri Lankan');
            await page.fill('#nic', '850101123V');
            await page.fill('#street', 'Coach Avenue 5');

            // Locations
            await page.selectOption('#citySelect', { label: 'Colombo' });
            await page.selectOption('#districtSelect', { label: 'Colombo' });
            await page.selectOption('#provinceSelect', { label: 'Western' });

            // Coaching Details
            await page.check('input[value="100m"]');
            await page.selectOption('#coachingLevel', 'National');
            await page.selectOption('#coachingRole', 'Head Coach');
            await page.fill('#experience', '15');
            await page.fill('#organization', 'National Academy');

            // Qualifications
            await page.fill('#highestQual', 'Gold Medal License');
            await page.fill('#issuingAuthority', 'World Athletics');
            await page.fill('#certId', 'CERT-999');
            await page.setInputFiles('#certDoc', path.join(process.cwd(), 'dummy_id.pdf'));
            await page.setInputFiles('#coachPhoto', path.join(process.cwd(), 'dummy_id.pdf'));

            // Consents
            await page.check('#termsConsent');
            await page.check('#dataConsent');
            await page.check('#authConsent');

            await page.click('#submitBtn');

            // Success Modal
            const okBtn = page.locator('#successModalBtn');
            await okBtn.waitFor({ state: 'visible', timeout: 30000 });
            await okBtn.click();

            await expect(page).toHaveURL(/coach-home.html/, { timeout: 60000 });
        });

        await test.step('Coach Management: Squads', async () => {
            console.log(`[Audit] Testing Coach Management - Squad Creation`);
            await page.goto('/coach-squads.html');

            // Create a Squad
            await page.click('#createSquadBtn');
            await page.fill('#newSquadName', `Gold Squad ${uniqueId}`);
            await page.click('#confirmSquadBtn');

            await expect(page.locator('#squadsContainer')).toContainText(`Gold Squad ${uniqueId}`, { timeout: 30000 });

            // Verify athlete is in pool (Check for Full Name as it appears in UI)
            await expect(page.locator('#unassignedPool')).toContainText(athlete.fullName, { timeout: 30000 });

            await logout();
        });

        // ==========================================
        // 3. ADMIN JOURNEY: Verification & Events
        // ==========================================
        await test.step('Admin Login', async () => {
            console.log(`[Audit] Admin Login`);
            // FORCE CLEAR SESSION to prevent role contamination
            await page.evaluate(() => localStorage.clear());
            await page.context().clearCookies();

            await page.goto('/index.html');
            await page.waitForLoadState('networkidle');
            await page.click('#navLoginBtn');
            await page.fill('[data-testid="login-identifier-input"]', admin.email);
            await page.fill('[data-testid="login-password-input"]', admin.password);
            await page.click('[data-testid="login-submit-btn"]');
            await expect(page).toHaveURL(/federation-home.html/, { timeout: 30000 });
        });

        await test.step('Admin Verification: Approve Users', async () => {
            console.log(`[Audit] Verifying Users in Admin Panel`);
            // Verify Athlete
            await page.click('#tabAthletes');
            await page.fill('#userSearch', athlete.fullName);
            await expect(page.locator('#userTableBody')).toContainText(athlete.fullName, { timeout: 40000 });

            // Verify Coach
            await page.click('#tabCoaches');
            await page.fill('#userSearch', coach.fullName);
            await expect(page.locator('#userTableBody')).toContainText(coach.fullName, { timeout: 40000 });
        });

        await test.step('Admin Event Creation', async () => {
            console.log(`[Audit] Creating Global Event`);
            await page.goto('/events.html');
            await page.click('#createEventBtn');
            await page.fill('#eventTitle', `National Meet ${uniqueId}`);
            await page.fill('#eventDescription', 'Grand finale of the audit journey.');
            await page.fill('#eventDate', '2025-12-25');
            await page.fill('#eventVenue', 'National Stadium');
            await page.selectOption('#eventCitySelect', { label: 'Colombo' });
            await page.selectOption('#eventCategory', 'Open');
            await page.click('button[type="submit"]');

            await expect(page.locator('#eventsGrid')).toContainText(`National Meet ${uniqueId}`, { timeout: 30000 });
        });

        console.log("MEGA AUDIT SUCCESSFUL!");
    });
});
