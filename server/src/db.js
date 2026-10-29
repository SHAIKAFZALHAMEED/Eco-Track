const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

// Ensure environment variables are loaded
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT, 10) || 3306,
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'ecotrack_campus',
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
  decimalNumbers: true, // Auto-parse DECIMAL columns to Javascript numbers
  timezone: '+00:00', // Use UTC or consistent timezone
  dateStrings: true // Return DATE and TIMESTAMP as strings (YYYY-MM-DD) to prevent timezone off-by-one shifts
});

// Test connection on startup
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT 1 + 1 AS result');
    connection.release();
    return { ok: true, message: 'Database connection established successfully.' };
  } catch (error) {
    return { ok: false, message: error.message, code: error.code };
  }
}

module.exports = {
  pool,
  testConnection
};

