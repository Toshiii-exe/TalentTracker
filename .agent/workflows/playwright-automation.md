---
description: How to run QA automation with Playwright
---

This workflow explains how to run end-to-end tests using Playwright.

### 1. Setup
Install dependencies and browsers (if not done):
```bash
npm install
npx playwright install chromium --with-deps
```

### 2. Start the Application
Ensure the server is running on port 3000.
```bash
npm start
```

### 3. Run Tests
**Headless Mode (Fastest):**
```bash
npm run test:pw
```

**UI Mode (Interactive):**
```bash
npm run test:pw:ui
```

### 4. Run against Hosted Site (Railway)
You can point to your live URL by setting the `BASE_URL` environment variable:

**PowerShell:**
```powershell
$env:BASE_URL="https://your-app.up.railway.app"; npm run test:pw
```

**Command Prompt:**
```cmd
set BASE_URL=https://your-app.up.railway.app && npm run test:pw
```

### 5. Troubleshooting
- Check the `playwright-report` folder for detailed HTML reports if tests fail.
- Ensure the `data-testid` attributes are present in the HTML files.
