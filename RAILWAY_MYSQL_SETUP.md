# 🚀 RAILWAY MYSQL SETUP GUIDE

## STEP 1: Get Railway MySQL Connection Details

1. Go to Railway Dashboard
2. Click on your **MySQL database** (not your web service)
3. Click **"Variables"** tab
4. Copy these values:
   - `MYSQLHOST`
   - `MYSQLUSER`
   - `MYSQLPASSWORD`
   - `MYSQLDATABASE`
   - `MYSQLPORT`

---

## STEP 2: Update Your Local .env File

Open `backend/.env` and temporarily add Railway credentials:

```env
# Railway MySQL (TEMPORARY - for setup only)
DB_HOST=containers-us-west-xxx.railway.app
DB_USER=root
DB_PASSWORD=<paste-from-railway>
DB_NAME=railway
DB_PORT=<paste-from-railway>
```

---

## STEP 3: Run Database Initialization

Open terminal in your project folder and run:

```bash
cd talenttrackeupdate/backend
npm run init-db
```

This will:
- ✅ Connect to Railway MySQL
- ✅ Create all tables (users, athletes, coaches, events, etc.)
- ✅ Create default admin account (username: `admin`, password: `admin123`)

---

## STEP 4: Verify Tables Were Created

You should see output like:
```
Connecting to MySQL at containers-us-west-xxx.railway.app...
Connected directly to database: railway
Reading schema.sql...
Executing schema...
Database schema updated.
Creating default federation admin...
Admin account created: admin / admin123
Database initialized successfully!
```

---

## STEP 5: Remove Local Railway Credentials

**IMPORTANT**: After setup, remove Railway credentials from your local `.env` file!

Your local `.env` should go back to:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=talent_tracker
DB_PORT=3306
```

Railway will use the environment variables you set in the Railway dashboard.

---

## STEP 6: Verify Your Website

1. Go to Railway Dashboard → Your Web Service
2. Click on the deployment
3. Find your public URL (e.g., `https://your-app.up.railway.app`)
4. Open it in browser
5. Try logging in with:
   - Username: `admin`
   - Password: `admin123`
   - Role: Federation

---

## ✅ CHECKLIST

- [ ] Got Railway MySQL connection details
- [ ] Updated local .env with Railway credentials
- [ ] Ran `npm run init-db` successfully
- [ ] Removed Railway credentials from local .env
- [ ] Verified website is live
- [ ] Tested login with admin account

---

## 🆘 TROUBLESHOOTING

**Error: "Access denied"**
- Double-check you copied the password correctly from Railway
- Make sure you're using `DB_HOST`, not `localhost`

**Error: "Connection timeout"**
- Railway MySQL might not be publicly accessible
- Try Method 2 (Railway CLI) instead

**Tables not created**
- Check the terminal output for SQL errors
- Make sure `schema.sql` file exists in `backend/` folder
