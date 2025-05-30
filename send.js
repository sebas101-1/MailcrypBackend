const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// SMTP Configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.IMAP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: 'true', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    tls: {
      // Do not fail on invalid certs (for self-signed certificates)
      rejectUnauthorized: false
    }
  });
};

// Email sending endpoint
async function sendEmail(sender, to, subject, text, html, attachments) {
  try {
    if (!to || !subject || (!text && !html)) {
      console.log('Missing required fields: to, subject, text or html');
    }

    const transporter = createTransporter();
    
    const mailOptions = {
      from:sender,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      text,
      html,
      attachments: attachments || []
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('Email sent:', mailOptions.subject);    
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};
module.exports = sendEmail;
// sendEmail(process.env.EMAIL_USER,process.env.EMAIL_USER, 'Test Subject', 'This is a test email', '<b>This is a test email</b>', [])