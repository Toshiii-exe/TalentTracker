const mysql = require('mysql2');

const dbHost = process.env.DB_HOST || process.env.MYSQLHOST || 'localhost';
console.log(`Database Attempting Connection to Host: ${dbHost}`);

const pool = mysql.createPool({
    host: dbHost,
    user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
    password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
    database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'talent_tracker',
    port: process.env.DB_PORT || process.env.MYSQLPORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool.promise();
