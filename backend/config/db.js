const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

  dateStrings: true,
  connectTimeout: 10000
});

async function testConnection() {
  let connection;

  try {
    connection = await pool.getConnection();

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
