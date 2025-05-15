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