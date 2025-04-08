import { createTransport } from 'nodemailer';
import mysql from 'mysql2/promise';
import { execSync } from 'child_process';

const dbConfig = {
  host: "localhost", // Use your Linux VM's IP
  user: "backend_root",
  password: "&daWadj13z2",
  database: "mailserver_db",
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  ssl: {
    rejectUnauthorized: false
  }
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
async function testConnection() {
  let conn;
  try {
    conn = await pool.getConnection();
    console.log('Connected to database!');
    const [rows] = await conn.query('SELECT 1 + 1 AS solution');
    console.log('Database test result:', rows[0].solution);
  } catch (err) {
    console.error('Database connection failed:', err);
  } finally {
    if (conn) conn.release();
  }
}

// Modified sendMail function
async function sendMail() {
  await testConnection(); // Test DB first
  
  const transporter = createTransport({
    host: '192.168.56.1', // Your Linux VM's IP
    port: 25,
    secure: false,
    auth: {
      user: 'test@example.test',
      pass: '1234'
    },
    tls: { rejectUnauthorized: false }
  });

  try {
    const info = await transporter.sendMail({
      from: '"Test" <test@example.test>',
      to: 'test@example.test',
      subject: 'Test',
      text: 'Test email'
    });
    console.log('Email sent:', info.messageId);
  } catch (err) {
    console.error('Email send failed:', err);
  }
}

// Run the script
console.log('Starting...');
sendMail()
  .finally(() => pool.end());