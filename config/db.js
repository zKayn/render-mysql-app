const mysql = require('mysql2/promise');
require('dotenv').config();

// Tạo pool kết nối đến MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Kiểm tra kết nối 
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log("Đã kết nối với MySQL");
    connection.release();
    return true;
  } catch (err) {
    console.error("Kết nối cơ sở dữ liệu không thành công:", err.message);
    return false;
  }
};

module.exports = { pool, testConnection };