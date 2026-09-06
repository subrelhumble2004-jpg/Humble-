const mysql = require("mysql2/promise");
require("dotenv").config();

const poolConfig = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
  queueLimit: 0,

  // Return MySQL DATE/TIME values as strings.
  dateStrings: true,

  connectTimeout: 15000
};

// Aiven MySQL normally requires an encrypted connection.
// SSL is enabled only when DB_SSL=true, so local MySQL can still work
// without SSL.
if (process.env.DB_SSL === "true") {
  poolConfig.ssl = {
    rejectUnauthorized: true
  };
}

const pool = mysql.createPool(poolConfig);

async function testConnection() {
  let connection;

  try {
    connection = await pool.getConnection();

    await connection.query("SELECT 1");

    console.log(
      "✅ MySQL connected successfully:",
      process.env.DB_NAME
    );

    return true;
  } catch (error) {
    console.error(
      "❌ MySQL connection failed:",
      error.message
    );

    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

module.exports = {
  pool,
  testConnection
};
