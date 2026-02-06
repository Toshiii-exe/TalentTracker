---
description: How to run QA automation with Cypress
---

This workflow explains how to set up and run end-to-end tests for the Talent Tracker application using Cypress.

### 1. Install Dependencies
Ensure you have all the necessary packages installed, including Cypress.
```bash
npm install
```

### 2. Start the Application
The application must be running for Cypress to test it.
```bash
npm start
```

### 3. Open Cypress (Interactive Mode)
Use this to see the tests running in a browser and debug them.
```bash
npm run cypress:open
```

### 4. Run Cypress Tests (Headless Mode)
Use this to run all tests in the background and see the results in the terminal.
```bash
npm run cypress:run
```
*Individual test files:*
- `TTrun.cy.js`: Basic athlete flow.
- `signup.cy.js`: Athlete signup.
- `full_system_audit.cy.js`: **NEW** - Comprehensive test covering Athlete, Coach, and Admin roles.

### 5. Run against Hosted Site (Railway)
If you want to run your tests against your live Railway site instead of localhost, use this command:
```bash
npx cypress run --config baseUrl=https://your-app-name.up.railway.app
```
*Replace `https://your-app-name.up.railway.app` with your actual live URL.*

### 6. Troubleshooting
- **Port Conflict**: If the server fails to start, ensure port 3000 is free or update `PORT` in `.env`.
- **Database Error**: Ensure your MySQL database is running and credentials in `talenttrackeupdate/backend/.env` are correct.
- **Cypress Not Found**: If the cypress command is not found, run `npx cypress open`.
