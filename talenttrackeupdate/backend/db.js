const mysql = require('mysql2');

const dbHost = process.env.DB_HOST || process.env.MYSQLHOST;
const dbUser = process.env.DB_USER || process.env.MYSQLUSER;
const dbPass = process.env.DB_PASSWORD || process.env.MYSQLPASSWORD;
const dbName = process.env.DB_NAME || process.env.MYSQLDATABASE;
const dbPort = process.env.DB_PORT || process.env.MYSQLPORT;

console.log(`Database Connection Debug:`);
console.log(`- Host: ${dbHost}`);
console.log(`- Port: ${dbPort}`);
console.log(`- User: ${dbUser}`);
console.log(`- DB: ${dbName}`);

const pool = mysql.createPool({
    host: dbHost,
    user: dbUser,
    password: dbPass,
    database: dbName,
    port: dbPort,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool.promise();
