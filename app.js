const express = require('express');
const nodemailer = require('nodemailer');
const imaps = require('imap-simple');

// Set up the express app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Email sending configuration (Nodemailer)
const smtpTransport = nodemailer.createTransport({
    service: 'gmail',  // For example, Gmail (you can use any SMTP service)
    auth: {
        user: 'your_email@gmail.com',
        pass: 'your_email_password',
    },
});

// Route to send email
app.post('/send-email', (req, res) => {
    const { to, subject, text } = req.body;
    console.log('sending');
    const mailOptions = {
        from: 'your_email@gmail.com',
        to: to,
        subject: subject,
        text: text,
    };

    smtpTransport.sendMail(mailOptions, (error, info) => {
        if (error) {
            return res.status(500).send({ error: error.toString() });
        }
        res.status(200).send({ message: 'Email sent successfully', info });
    });
});

// IMAP configuration for receiving emails
const imapConfig = {
    imap: {
        user: 'your_email@gmail.com',
        password: 'your_email_password',
        host: 'imap.gmail.com',
        port: 993,
        tls: true,
        authTimeout: 3000,
    },
};

// Route to receive emails
app.get('/receive-emails', (req, res) => {
    imaps.connect(imapConfig).then((connection) => {
        return connection.openBox('INBOX').then(() => {
            const searchCriteria = ['UNSEEN']; // Fetch unread emails
            const fetchOptions = {
                bodies: ['HEADER', 'TEXT'],
                markSeen: true, // Mark messages as read after fetching
            };

            return connection.search(searchCriteria, fetchOptions).then((messages) => {
                const emailData = messages.map((message) => {
                    const all = message.parts.filter((part) => part.which === 'HEADER')[0].body;
                    const subject = all.subject[0];
                    const from = all.from[0];
                    const body = message.parts.filter((part) => part.which === 'TEXT')[0].body;

                    return { from, subject, body };
                });
                res.status(200).send(emailData);
            });
        });
    }).catch((err) => {
        res.status(500).send({ error: err.toString() });
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
console.log("hello");
console.log(fetch("http://localhost:3000/send-email/testingimapjs@gmail.com/testing/hello")+" fetch")
