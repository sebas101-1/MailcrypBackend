import { createTransport } from 'nodemailer';
import mysql from 'mysql2/promise';
import { execSync } from 'child_process';
import imapSimple from 'imap-simple';
import { simpleParser } from 'mailparser';

// Database configuration
const dbConfig = {
  host: "192.168.56.1", // Your Linux VM IP
  user: "backend_root",
  password: "&daWadj13z2",
  database: "mailserver_db",
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10
};

// IMAP configuration
// const imapConfig = {
//   imap: {
//     user: 'test@example.test',
//     password: '1234',
//     host: '192.168.56.1',
//     port: 993,  // Use SSL port
//     tls: true,   // Enable TLS
//     authTimeout: 500,
//     tlsOptions: { rejectUnauthorized: false }  // For self-signed cert
//   }
// };
const imapConfig = {
  imap: {
    user: 'test@example.test',
    password: '1234',
    host: '192.168.56.1',
    port: 993,
    tls: true,
    tlsOptions: {
      rejectUnauthorized: false
      // minVersion: "TLSv1.2"
    },
    authTimeout: 10000,
    connTimeout: 30000,
    debug: console.log
  }
};

// Create database connection pool
const pool = mysql.createPool(dbConfig);

// Generate Dovecot-compatible password hash
function generateDovecotPassword(password) {
  return execSync(`doveadm pw -s SHA512-CRYPT -p "${password}"`).toString().trim();
}

// Database test connection
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

// Send email function
async function sendMail() {
  const transporter = createTransport({
    host: '192.168.56.1',
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
      subject: 'Test Email',
      text: 'This is a test email from Node.js!'
    });
    console.log('Email sent:', info.messageId);
  } catch (err) {
    console.error('Email send failed:', err);
  }
}



async function checkEmails() {
  const connection = await imapSimple.connect({
    imap: {
      user: 'test@example.test',
      password: '1234',
      host: 'localhost',
      port: 143,
      tls: false,
      tlsOptions: { rejectUnauthorized: false },
      authTimeout: 10000,
      debug: console.log
    }
  });

  try {
    // Add timeout for mailbox opening
    const openPromise = connection.openBox('INBOX');
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout opening mailbox')), 50000)
    );

    await Promise.race([openPromise, timeoutPromise]);
    console.log('INBOX opened successfully');
    
    // Process emails here
    
  } finally {
    connection.end();
  }
}
// Main execution
(async () => {
  try {
    await testConnection();
    // await sendMail();
    await checkEmails();
  } catch (err) {
    console.error('Main execution error:', err);
  } finally {
    await pool.end();
  }
})();