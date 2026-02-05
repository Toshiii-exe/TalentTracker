require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const db = require('./db');

async function checkTable() {
    try {
        console.log("Checking 'users' table columns...");
        const [rows] = await db.query("SHOW COLUMNS FROM users");
        console.log(rows.map(r => r.Field));
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

checkTable();
