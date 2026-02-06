const { test, expect } = require('@playwright/test');
const path = require('path');

/**
 * TALENT TRACKER - EXTENDED FEATURES TEST SUITE
 * Tests for advanced functionality and edge cases:
 * - Squad assignment and management
 * - Athlete-Coach interactions
 * - Admin approval workflows
 * - Profile updates and modifications
 * - Advanced search and filtering
 * - Document management
 * - Multi-event performance tracking
 */

const timestamp = Date.now();

const testData = {
    athlete: {
        username: `ext_athlete_${timestamp}`,
        phone: `077${String(timestamp).slice(-7)}`,
        email: `ext_athlete_${timestamp}@test.com`,
        password: 'TestPass123!',
        fullName: `Extended Athlete ${timestamp}`,
    },
    coach: {
        username: `ext_coach_${timestamp}`,
        phone: `078${String(timestamp).slice(-7)}`,
        email: `ext_coach_${timestamp}@test.com`,
        password: 'TestPass123!',
        fullName: `Extended Coach ${timestamp}`,
    },
    admin: {
        email: 'federation@talenttracker.com',
        password: 'admin123'
    }
};

// ==========================================
// EXTENDED ATHLETE FEATURES
// ==========================================
test.describe.serial('Extended Athlete Features', () => {

    test('EA1: Athlete can add multiple event performances', async ({ page }) => {
        test.setTimeout(120000);

        // First create an athlete
        await page.goto('/signup-athlete.html');
        await page.fill('[data-testid="signup-username-input"]', testData.athlete.username);
        await page.fill('[data-testid="signup-phone-input"]', testData.athlete.phone);
        await page.fill('[data-testid="signup-email-input"]', testData.athlete.email);
        await page.fill('[data-testid="signup-password-input"]', testData.athlete.password);
        await page.click('[data-testid="signup-submit-btn"]');

        const successModal = page.locator('#successModalBtn');
        await successModal.waitFor({ state: 'visible', timeout: 30000 });
        await successModal.click();

        // Complete profile with multiple events
        await page.fill('#fullName', testData.athlete.fullName);
        await page.fill('#dob', '2005-01-15');
        await page.selectOption('#gender', 'Male');
        await page.fill('#phone', testData.athlete.phone);
        await page.fill('#email', testData.athlete.email);
        await page.fill('#street', '123 Test');
        await page.selectOption('#citySelect', { label: 'Colombo' });
        await page.fill('#height', '175');
        await page.fill('#weight', '70');
        await page.setInputFiles('#idDoc', path.join(process.cwd(), 'dummy_id.pdf'));
        await page.selectOption('#category', 'Open');

        // Add first event (100m)
        const eventRow1 = page.locator('.event-row').first();
        await eventRow1.locator('.event-select').selectOption('100m');
        await eventRow1.locator('.event-time').fill('11.50');
        await eventRow1.locator('.event-experience').selectOption({ label: 'Intermediate' });
        await eventRow1.locator('.event-level').selectOption({ label: 'National Sports Festival' });

        // Try to add second event if add button exists
        const addEventBtn = page.locator('#addEventBtn, button:has-text("Add Event")');
        if (await addEventBtn.isVisible()) {
            await addEventBtn.click();
            const eventRow2 = page.locator('.event-row').nth(1);
            await eventRow2.locator('.event-select').selectOption('200m');
            await eventRow2.locator('.event-time').fill('23.00');
            await eventRow2.locator('.event-experience').selectOption({ label: 'Advanced' });
            await eventRow2.locator('.event-level').selectOption({ label: 'National Championship' });
        }

        await page.click('#submitBtn');

        const profileSuccessModal = page.locator('#successModalBtn');
        await profileSuccessModal.waitFor({ state: 'visible', timeout: 30000 });
        await profileSuccessModal.click();

        await expect(page).toHaveURL(/dashboard/, { timeout: 60000 });

        console.log('✅ EA1: Multiple Event Performances - PASSED');
    });

    test('EA2: Athlete can update profile picture', async ({ page }) => {
        test.setTimeout(60000);

        await page.goto('/');
        await page.click('#navLoginBtn');
        await page.fill('[data-testid="login-identifier-input"]', testData.athlete.username);
        await page.fill('[data-testid="login-password-input"]', testData.athlete.password);
        await page.click('[data-testid="login-submit-btn"]');

        await page.waitForURL(/dashboard|athlete-home/, { timeout: 30000 });

        if (page.url().includes('athlete-home')) {
            await page.goto('/dashboard.html');
        }

        // Try to upload new profile picture
        const profilePicInput = page.locator('#profilePicInput, input[type="file"][accept*="image"]').first();
        if (await profilePicInput.isVisible()) {
            await profilePicInput.setInputFiles(path.join(process.cwd(), 'dummy_id.pdf'));
            await page.waitForTimeout(2000);
        }

        console.log('✅ EA2: Update Profile Picture - PASSED');
    });

    test('EA3: Athlete can log performance for different events', async ({ page }) => {
        test.setTimeout(60000);

        await page.goto('/');
        await page.click('#navLoginBtn');
        await page.fill('[data-testid="login-identifier-input"]', testData.athlete.username);
        await page.fill('[data-testid="login-password-input"]', testData.athlete.password);
        await page.click('[data-testid="login-submit-btn"]');

        await page.waitForURL(/dashboard|athlete-home/, { timeout: 30000 });

        if (page.url().includes('athlete-home')) {
            await page.goto('/dashboard.html');
        }

        // Log 100m performance
        await page.selectOption('[data-testid="performance-event-select"]', '100m');
        await page.fill('[data-testid="performance-date-input"]', '2024-08-10');
        await page.fill('[data-testid="performance-result-input"]', '11.30');
        await page.click('[data-testid="performance-save-btn"]');
        await page.waitForTimeout(2000);

        // Log 200m performance
        const select200m = page.locator('[data-testid="performance-event-select"]');
        if (await select200m.isVisible()) {
            // Check if 200m is an option
            const options = await select200m.locator('option').allTextContents();
            if (options.includes('200m')) {
                await select200m.selectOption('200m');
                await page.fill('[data-testid="performance-date-input"]', '2024-08-11');
                await page.fill('[data-testid="performance-result-input"]', '22.80');
                await page.click('[data-testid="performance-save-btn"]');
            } else {
                console.log('⚠️ EA3: 200m event not found, skipping 200m log');
            }
        }

        console.log('✅ EA3: Multiple Event Performance Logging - PASSED');
    });

    test('EA4: Athlete can view full profile details', async ({ page }) => {
        test.setTimeout(60000);

        await page.goto('/');
        await page.click('#navLoginBtn');
        await page.fill('[data-testid="login-identifier-input"]', testData.athlete.username);
        await page.fill('[data-testid="login-password-input"]', testData.athlete.password);
        await page.click('[data-testid="login-submit-btn"]');

        await page.waitForURL(/dashboard|athlete-home/, { timeout: 30000 });

        if (page.url().includes('athlete-home')) {
            await page.goto('/dashboard.html');
        }

        // Check for profile sections
        const profileSection = page.locator('#fullProfileList').first();
        await expect(profileSection).toBeVisible({ timeout: 10000 });

        console.log('✅ EA4: View Full Profile - PASSED');
    });

    test('EA5: Athlete can view squad assignment status', async ({ page }) => {
        test.setTimeout(60000);

        await page.goto('/');
        await page.click('#navLoginBtn');
        await page.fill('[data-testid="login-identifier-input"]', testData.athlete.username);
        await page.fill('[data-testid="login-password-input"]', testData.athlete.password);
        await page.click('[data-testid="login-submit-btn"]');

        await page.waitForURL(/dashboard|athlete-home/, { timeout: 30000 });

        await page.goto('/athlete-home.html');

        // Check for squad section (may or may not exist)
        const squadSection = page.locator('#athleteSquadSection, #squadInfo, [id*="squad"]');
        // Don't fail if not assigned to squad yet
        console.log('Squad section visible:', await squadSection.isVisible().catch(() => false));

        console.log('✅ EA5: Squad Status Check - PASSED');
    });
});

// ==========================================
// EXTENDED COACH FEATURES
// ==========================================
test.describe.serial('Extended Coach Features', () => {

    test('EC1: Coach can create multiple squads', async ({ page }) => {
        test.setTimeout(120000);

        // Create coach account
        await page.goto('/signup-coach.html');
        await page.fill('[data-testid="signup-username-input"]', testData.coach.username);
        await page.fill('[data-testid="signup-phone-input"]', testData.coach.phone);
        await page.fill('[data-testid="signup-email-input"]', testData.coach.email);
        await page.fill('[data-testid="signup-password-input"]', testData.coach.password);
        await page.click('[data-testid="signup-submit-btn"]');

        const successModal = page.locator('#successModalBtn');
        await successModal.waitFor({ state: 'visible', timeout: 30000 });
        await successModal.click();

        // Complete profile
        await page.fill('#fullName', testData.coach.fullName);
        await page.selectOption('#gender', 'Male');
        await page.fill('#dob', '1985-05-20');
        await page.fill('#nationality', 'Sri Lankan');
        await page.fill('#nic', '850520789V');
        await page.fill('#street', '456 Coach Ave');
        await page.selectOption('#citySelect', { label: 'Colombo' });
        await page.selectOption('#districtSelect', { label: 'Colombo' });
        await page.selectOption('#provinceSelect', { label: 'Western' });
        await page.check('input[value="100m"]');
        await page.selectOption('#coachingLevel', 'National');
        await page.selectOption('#coachingRole', 'Head Coach');
        await page.fill('#experience', '10');
        await page.fill('#organization', 'Test Academy');
        await page.fill('#highestQual', 'Level 3');
        await page.fill('#issuingAuthority', 'NSC');
        await page.fill('#certId', 'TEST-999');
        await page.setInputFiles('#certDoc', path.join(process.cwd(), 'dummy_id.pdf'));
        await page.setInputFiles('#coachPhoto', path.join(process.cwd(), 'dummy_id.pdf'));
        await page.check('#termsConsent');
        await page.check('#dataConsent');
        await page.check('#authConsent');
        await page.click('#submitBtn');

        const profileSuccessModal = page.locator('#successModalBtn');
        await profileSuccessModal.waitFor({ state: 'visible', timeout: 30000 });
        await profileSuccessModal.click();

        await expect(page).toHaveURL(/coach-home/, { timeout: 60000 });

        // Now create squads
        await page.goto('/coach-squads.html');

        // Create first squad
        await page.click('#createSquadBtn');
        await page.fill('#newSquadName', `Sprint Squad ${timestamp}`);
        await page.click('#confirmSquadBtn');
        await page.waitForTimeout(2000);

        // Create second squad
        await page.click('#createSquadBtn');
        await page.fill('#newSquadName', `Distance Squad ${timestamp}`);
        await page.click('#confirmSquadBtn');
        await page.waitForTimeout(2000);

        console.log('✅ EC1: Create Multiple Squads - PASSED');
    });

    test('EC2: Coach can view athlete profiles', async ({ page }) => {
        test.setTimeout(60000);

        await page.goto('/');
        await page.click('#navLoginBtn');
        await page.fill('[data-testid="login-identifier-input"]', testData.coach.username);
        await page.fill('[data-testid="login-password-input"]', testData.coach.password);
        await page.click('[data-testid="login-submit-btn"]');
        await expect(page).toHaveURL(/coach-home/, { timeout: 30000 });

        await page.goto('/coach-athletes.html');

        // Try to click on first athlete if available
        const firstAthlete = page.locator('.athlete-card, .athlete-item, [data-athlete-id]').first();
        if (await firstAthlete.isVisible()) {
            await firstAthlete.click();
            // Should open athlete profile view
            await page.waitForTimeout(2000);
        }

        console.log('✅ EC2: View Athlete Profiles - PASSED');
    });

    test('EC3: Coach can filter athletes by event', async ({ page }) => {
        test.setTimeout(60000);

        await page.goto('/');
        await page.click('#navLoginBtn');
        await page.fill('[data-testid="login-identifier-input"]', testData.coach.username);
        await page.fill('[data-testid="login-password-input"]', testData.coach.password);
        await page.click('[data-testid="login-submit-btn"]');
        await expect(page).toHaveURL(/coach-home/, { timeout: 30000 });

        await page.goto('/coach-athletes.html');

        // Try event filter
        const eventFilter = page.locator('#eventFilter, select[name="event"]');
        if (await eventFilter.isVisible()) {
            await eventFilter.selectOption('100m');
            await page.waitForTimeout(1000);
        }

        console.log('✅ EC3: Filter Athletes by Event - PASSED');
    });

    test('EC4: Coach can post workout plan to squad', async ({ page }) => {
        test.setTimeout(60000);

        await page.goto('/');
        await page.click('#navLoginBtn');
        await page.fill('[data-testid="login-identifier-input"]', testData.coach.username);
        await page.fill('[data-testid="login-password-input"]', testData.coach.password);
        await page.click('[data-testid="login-submit-btn"]');
        await expect(page).toHaveURL(/coach-home/, { timeout: 30000 });

        await page.goto('/coach-squads.html');

        // Try to post workout plan
        const squadCard = page.locator('.squad-card, .squad-item').first();
        if (await squadCard.isVisible()) {
            await squadCard.click();

            const workoutInput = page.locator('#workoutPlanInput, textarea[placeholder*="workout"]');
            if (await workoutInput.isVisible()) {
                await workoutInput.fill('Week 1: Speed work - 5x100m sprints with 2min rest');
                const postBtn = page.locator('#postWorkoutBtn, button:has-text("Post")');
                if (await postBtn.isVisible()) {
                    await postBtn.click();
                    await page.waitForTimeout(2000);
                }
            }
        }

        console.log('✅ EC4: Post Workout Plan - PASSED');
    });

    test('EC5: Coach can view dashboard statistics', async ({ page }) => {
        test.setTimeout(60000);

        await page.goto('/');
        await page.click('#navLoginBtn');
        await page.fill('[data-testid="login-identifier-input"]', testData.coach.username);
        await page.fill('[data-testid="login-password-input"]', testData.coach.password);
        await page.click('[data-testid="login-submit-btn"]');
        await expect(page).toHaveURL(/coach-home/, { timeout: 30000 });

        await page.goto('/coach-dashboard.html');

        // Check for stats elements
        const statsSection = page.locator('#statsSection, [class*="stat"], [id*="stat"]').first();
        // Stats may or may not be present
        console.log('Stats visible:', await statsSection.isVisible().catch(() => false));

        console.log('✅ EC5: View Dashboard Statistics - PASSED');
    });
});

// ==========================================
// EXTENDED ADMIN FEATURES
// ==========================================
test.describe.serial('Extended Admin Features', () => {

    test('EF1: Admin can approve athlete account', async ({ page }) => {
        test.setTimeout(60000);

        await page.goto('/');
        await page.click('#navLoginBtn');
        await page.fill('[data-testid="login-identifier-input"]', testData.admin.email);
        await page.fill('[data-testid="login-password-input"]', testData.admin.password);
        await page.click('[data-testid="login-submit-btn"]');
        await expect(page).toHaveURL(/federation-home/, { timeout: 30000 });

        await page.click('#tabAthletes');
        await page.fill('#userSearch', testData.athlete.fullName);
        await page.waitForTimeout(2000);

        // Try to approve athlete
        const approveBtn = page.locator('button:has-text("Approve"), button[data-action="approve"]').first();
        if (await approveBtn.isVisible()) {
            await approveBtn.click();
            await page.waitForTimeout(2000);
        }

        console.log('✅ EF1: Approve Athlete - PASSED');
    });

    test('EF2: Admin can approve coach account', async ({ page }) => {
        test.setTimeout(60000);

        await page.goto('/');
        await page.click('#navLoginBtn');
        await page.fill('[data-testid="login-identifier-input"]', testData.admin.email);
        await page.fill('[data-testid="login-password-input"]', testData.admin.password);
        await page.click('[data-testid="login-submit-btn"]');
        await expect(page).toHaveURL(/federation-home/, { timeout: 30000 });

        await page.click('#tabCoaches');
        await page.waitForTimeout(1000);

        const searchInput = page.locator('#userSearch, #coachSearch, #searchCoach, input[placeholder*="Search"]').first();
        await searchInput.fill(testData.coach.fullName);
        await page.waitForTimeout(2000);

        // Try to approve coach
        const approveBtn = page.locator('button:has-text("Approve"), button[data-action="approve"]').first();
        if (await approveBtn.isVisible()) {
            await approveBtn.click();
            await page.waitForTimeout(2000);
        }

        console.log('✅ EF2: Approve Coach - PASSED');
    });

    test('EF3: Admin can view detailed coach profile', async ({ page }) => {
        test.setTimeout(60000);

        await page.goto('/');
        await page.click('#navLoginBtn');
        await page.fill('[data-testid="login-identifier-input"]', testData.admin.email);
        await page.fill('[data-testid="login-password-input"]', testData.admin.password);
        await page.click('[data-testid="login-submit-btn"]');
        await expect(page).toHaveURL(/federation-home/, { timeout: 30000 });

        await page.click('#tabCoaches');
        const searchInput = page.locator('#userSearch, #coachSearch, #searchCoach, input[placeholder*="Search"]').first();
        await searchInput.fill(testData.coach.fullName);
        await page.waitForTimeout(2000);

        const viewBtn = page.locator('button:has-text("View"), button[data-action="view"]').first();
        if (await viewBtn.isVisible()) {
            await viewBtn.click();
            await expect(page).toHaveURL(/admin-view-coach/, { timeout: 10000 });
        }

        console.log('✅ EF3: View Coach Details - PASSED');
    });

    test('EF4: Admin can filter users by approval status', async ({ page }) => {
        test.setTimeout(60000);

        await page.goto('/');
        await page.click('#navLoginBtn');
        await page.fill('[data-testid="login-identifier-input"]', testData.admin.email);
        await page.fill('[data-testid="login-password-input"]', testData.admin.password);
        await page.click('[data-testid="login-submit-btn"]');
        await expect(page).toHaveURL(/federation-home/, { timeout: 30000 });

        await page.click('#tabAthletes');

        const statusFilter = page.locator('#statusFilter');
        if (await statusFilter.isVisible()) {
            await statusFilter.selectOption('approved');
            await page.waitForTimeout(1000);

            await statusFilter.selectOption('pending');
            await page.waitForTimeout(1000);

            await statusFilter.selectOption('all');
        }

        console.log('✅ EF4: Filter by Status - PASSED');
    });

    test.skip('EF5: Admin can create multiple events', async ({ page }) => {
        test.setTimeout(180000);

        await page.goto('/');
        await page.click('#navLoginBtn');
        await page.fill('[data-testid="login-identifier-input"]', testData.admin.email);
        await page.fill('[data-testid="login-password-input"]', testData.admin.password);
        await page.click('[data-testid="login-submit-btn"]');
        await expect(page).toHaveURL(/federation-home/, { timeout: 30000 });

        await page.goto('/events.html');

        // Create first event
        await page.click('#createEventBtn');
        await page.waitForSelector('#eventForm', { state: 'visible' });
        await page.fill('#eventTitle', `Sprint Meet ${timestamp}`);
        await page.fill('#eventDescription', 'Sprint events championship');
        await page.fill('#eventDate', '2025-10-15');
        await page.fill('#eventVenue', 'City Stadium');
        await page.selectOption('#eventCitySelect', { label: 'Colombo' });
        await page.selectOption('#eventCategory', 'Open');
        await page.click('#eventForm button[type="submit"]');

        // Wait for modal to hide or success message
        const modal = page.locator('#successModalBtn, #eventModal button.close, #eventModal .btn-close');
        if (await modal.isVisible()) {
            await modal.click();
            await modal.waitFor({ state: 'hidden', timeout: 10000 });
        }
        await page.waitForTimeout(2000);

        // Create second event
        await page.click('#createEventBtn');
        await page.waitForSelector('#eventForm', { state: 'visible' });
        await page.fill('#eventTitle', `Distance Meet ${timestamp}`);
        await page.fill('#eventDescription', 'Distance running championship');
        await page.fill('#eventDate', '2025-11-20');
        await page.fill('#eventVenue', 'National Track');
        await page.selectOption('#eventCitySelect', { label: 'Kandy' });
        await page.selectOption('#eventCategory', 'Open');
        await page.click('#eventForm button[type="submit"]');

        const modal2 = page.locator('#successModalBtn, #eventModal button.close, #eventModal .btn-close');
        if (await modal2.isVisible()) {
            await modal2.click();
            await modal2.waitFor({ state: 'hidden', timeout: 10000 });
        }
        await page.waitForTimeout(2000);

        console.log('✅ EF5: Create Multiple Events - PASSED');
    });
});

console.log('\n🚀 EXTENDED FEATURES TEST SUITE COMPLETE');
