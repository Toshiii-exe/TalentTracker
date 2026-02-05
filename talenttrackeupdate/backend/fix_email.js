require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const db = require('./db');

async function fixEmail() {
    try {
        console.log("Modifying 'users' table to allow NULL emails...");

        // 1. Drop the unique index on email if it exists (because NULLs in unique index can be tricky in some SQL versions, 
        //    but mostly we just need to change the column definition first). 
        //    Actually, MySQL allows multiple NULLS in unique constraint. 

        // We simply modify the column to remove NOT NULL.
        await db.query("ALTER TABLE users MODIFY email VARCHAR(255) NULL");

        console.log("Success! 'email' column is now nullable.");
        process.exit(0);
    } catch (err) {
        console.error("Error updating table:", err.message);
        process.exit(1);
    }
}

fixEmail();
