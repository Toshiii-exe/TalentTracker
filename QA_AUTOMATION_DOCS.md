# QA Automation - Tools Used and Key Scripts

## 1. Tools & Frameworks
*   **Playwright (Node.js):** The primary testing framework used for end-to-end automation. Chosen for its speed, reliability (auto-wait), and ability to handle modern web features like shadow DOM and multiple tabs.
*   **Node.js:** The runtime environment for executing the test scripts.
*   **Chromium:** The browser engine used for running the tests (simulating Google Chrome).
*   **VS Code:** (Implied) The IDE used for code editing and terminal management.

## 2. Key Scripts
These commands are defined in your `package.json` or can be run directly via `npx`.

| Command | Description |
| :--- | :--- |
| `npx playwright test` | Runs all tests in the `tests/` directory. |
| `npx playwright test tests/happy_path.spec.js` | Runs only the "Happy Path" core user journey tests. |
| `npx playwright test tests/mega_audit.spec.js` | Runs the "Mega Audit" end-to-end system integration test. |
| `npx playwright show-report` | Opens the graphical HTML report of the last test run in your browser. |
| `npx playwright test --debug` | Runs tests in debug mode (opens a separate inspector window). |

## 3. Test Structure Highlights
*   **`tests/happy_path.spec.js`:** Segregated test cases for individual user roles (Athlete/Coach/Admin). Uses `test.describe` to group related tests.
*   **`tests/mega_audit.spec.js`:** A single, long-running scenario that passes state between steps (e.g., creating a user in step 1 and approving them in step 3).
*   **`playwright.config.js`:** Global configuration file handling base URLs, timeouts, retries, and reporting options (HTML/List).

## 4. Key Automation Implementations
*   **Modal Handling:** Implemented logic to detect and close generic "Success" modals that appear after form submissions (`#successModalBtn`).
*   **Dynamic Data:** Used `Date.now()` timestamps to generate unique usernames/emails for every test run, preventing "User already exists" errors.
*   **Role-Based Auth:** Tests automate the login process for different roles (Athlete, Coach, Federation) to verify permissions.

---

# Appendix: Completed Test Documentation

## A. Happy Path Suite (Core Functionality)
| ID | Test Scenario | Status |
| :--- | :--- | :--- |
| **H1** | Athlete Registration & Profile Creation | ✅ PASSED |
| **H2** | Athlete Performance Logging | ✅ PASSED |
| **H3** | Athlete Event Viewing | ✅ PASSED |
| **H4** | Coach Registration & Profile Creation | ✅ PASSED |
| **H5** | Coach Squad Creation | ✅ PASSED |
| **H6** | Coach Athlete Directory Access | ✅ PASSED |
| **H7** | Admin Login & Dashboard | ✅ PASSED |
| **H8** | Admin Athlete Management (View/Search) | ✅ PASSED |
| **H9** | Admin Coach Management (View/Search) | ✅ PASSED |
| **H10** | Admin Event Creation | ✅ PASSED |
| **H11** | System Logout | ✅ PASSED |

## B. Mega Audit Suite (Integration)
| ID | Test Scenario | Status |
| :--- | :--- | :--- |
| **M1** | **Full System Loop:** Athlete Register -> Coach Register -> Squad Assign -> Admin Approve -> Event Create | ✅ PASSED |

## C. Extended Features Suite (Advanced)
| ID | Test Scenario | Status |
| :--- | :--- | :--- |
| **EA1-5** | Athlete: Multiple Events, Picture Update, View Status | ✅ PASSING |
| **EC1-5** | Coach: Multiple Squads, Filtering, Stats | ✅ PASSING |
| **EF1-5** | Admin: Bulk Approvals, Multiple Events, Filtering | ✅ PASSING |
