import { createTransport } from 'nodemailer';
import { hash } from 'bcrypt';
import mysql from 'mysql2';
// Create a transporter object using SMTP transport
const db = mysql.createConnection({
  user: "root",
  host: "localhost",
  password: "password",
  database: "mailcrypdb"
});
const testHashedPassword = await hash('1234', 10);
let transporter = createTransport({
  host: 'localhost',  // Your Postfix server (assumed to be running on localhost)
  port: 25,           // Standard SMTPport
  secure: false,      // If you are using TLS/SSL, set this to true and change the port to 465
  debug: true,  // Enable debug output
  logger: true,  // Log to console
  connectionTimeout: 10000, // increase timeout to 10 seconds
  auth: {
    user: 'jeff@localhost',
    pass: testHashedPassword
  }
});

// Set up the email options
let mailOptions = {
  from: '"Admin" <admin@localhost>',  // Sender address
  to: 'jeff@localhost',          // List of receivers (Sebastien's email)
  subject: 'Test Email',              // Subject line
  text: 'This is a test email sent using Node.js and Postfix!',  // Plain text body
  html: '<b>This is a test email sent using Node.js and Postfix!</b>'  // HTML body (optional)
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
  try {
    // Hash the password
    const hashedPassword = await hash(password, 10);

    // Insert the user into the database
    db.query('INSERT INTO users (username, password) VALUES (?, ?)', [email, hashedPassword], (err, result) => {
      if (err) {
        console.error('Error inserting user into database:', err);
        return;
      }
      console.log('User created successfully:', result);
    });
  } catch (error) {
    console.error('Error creating mail account:', error);
  }
};

// Example usage
// createMailAccount('jeff@localhost', '1234');
sendMail();
