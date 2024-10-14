const nodemailer = require('nodemailer');

// Create a transporter object using SMTP transport
let transporter = nodemailer.createTransport({
  host: 'localhost',  // Your Postfix server (assumed to be running on localhost)
  port: 25,           // Standard SMTPport
  secure: false,      // If you are using TLS/SSL, set this to true and change the port to 465
  debug: true,  // Enable debug output
  logger: true,  // Log to console
  auth: {
    user: 'sebastien',
    pass: 'SalmonBay'
  }
});

// Set up the email options
let mailOptions = {
  from: '"Admin" <admin@localhost>',  // Sender address
  to: 'sebastien@localhost',          // List of receivers (Sebastien's email)
  subject: 'Test Email',              // Subject line
  text: 'This is a test email sent using Node.js and Postfix!',  // Plain text body
  html: '<b>This is a test email sent using Node.js and Postfix!</b>'  // HTML body (optional)
};

// Send the email
transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    return console.log('Error ' + error.message);
  }
  console.log('Message sent: %s', info.messageId);
});
