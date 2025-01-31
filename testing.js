import { createTransport } from 'nodemailer';
import { hash } from 'bcrypt';
import mysql from 'mysql2';
import bcrypt from 'bcrypt';
// Create a transporter object using SMTP transport
const db = mysql.createConnection({
  user: "backend_root",
  host: "localhost",
  password: "&daWadj13z2",
  port: 3307,
  database: "mailserver_db"
});
const query = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (error, results) => {
      if (error) {
        return reject(error);
      }
      resolve(results);
    });
  });
};
const saltRounds = 10;
const hashedPassword = await bcrypt.hash('1234', saltRounds);
let transporter = createTransport({
  host: 'localhost',  // Your Postfix server (assumed to be running on localhost)
  port: 25,           // Standard SMTPport
  secure: false,      // If you are using TLS/SSL, set this to true and change the port to 465
  debug: true,  // Enable debug output
  logger: true,  // Log to console
  connectionTimeout: 10,
  auth: {
    user: 'test@localhost',
    pass: '1234'
  },
  tls: {
    rejectUnauthorized: false, // Allow self-signed certificates
  },
  logger: true, // Enables logging to the console
  debug: true,  // Includes debug information
});

// Set up the email options
let mailOptions = {
  from: '"Sebastien " <test@localhost>',  // Sender address
  to: 'test@localhost',          // List of receivers (Sebastien's email)
  subject: 'Test Email',              // Subject line
  text: 'This is a test email sent using Node.js and Postfix!',  // Plain text body
  html: '<b>This is a test email sent using Node.js and Postfix!</b>' 
};

// Send the email
const sendMail = async () =>{
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log('Error ' + error.message);
    }
    console.log('Message sent: %s', info.messageId);
  });
}


// Function to create a new mail account
const createMailAccount = async (email, password) => {
  const username = email;
  const plainPassword = password;
  console.log("Creating Account")

  try {
    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
    
    // Insert the new user into the database
    await query('INSERT INTO users (email, password, home, quota) VALUES (?, ?,?,102400)', [username+"@localhost", hashedPassword,("/var/mail/vhost/localhost/"+username+"@localhost")]);

  } catch (error) {
    console.error('Error creating account:', error);
  }
  console.log('finished')
};
sendMail()