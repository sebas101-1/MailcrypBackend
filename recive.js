const Imap = require('imap');
const { simpleParser } = require('mailparser');
require('dotenv').config(); // For environment variables

const imapConfig = {
  user: process.env.EMAIL_USER,
  password: process.env.EMAIL_PASSWORD,
  host: process.env.IMAP_HOST,
  port: process.env.IMAP_PORT,
  tls: {
    rejectUnauthorized: false
  },
  tlsOptions: { servername: process.env.IMAP_HOST}
};

const imap = new Imap(imapConfig);

function openInbox(cb) {
  imap.openBox('INBOX', true, cb);
}

imap.once('ready', () => {
  openInbox((err, box) => {
    if (err) throw err;

    // Search for unseen emails in the last 24 hours
    const since = new Date();
    since.setDate(since.getDate() - 1);
    
    imap.search([
      ['UNSEEN'],
      ['SINCE', since.toISOString().split('T')[0]]
    ], (err, results) => {
      if (err) throw err;

      if (results.length === 0) {
        console.log('No new emails');
        return imap.end();
      }

      const fetch = imap.fetch(results, { 
        bodies: '',
        markSeen: false // Set to true to mark emails as read
      });

      fetch.on('message', (msg) => {
        let email = {};

        msg.on('body', (stream) => {
          simpleParser(stream, (err, parsed) => {
            if (err) throw err;

            email = {
              subject: parsed.subject,
              from: parsed.from.value[0].address,
              date: parsed.date,
              text: parsed.text,
              html: parsed.html
            };
          });
        });

        msg.once('end', () => {
          console.log('--------------------------------------------------');
          console.log('Subject:', email.subject);
          console.log('From:', email.from);
          console.log('Date:', email.date);
          console.log('Text:', email.text?.substring(0, 100) + '...');
        });
      });

      fetch.once('error', (err) => {
        console.log('Fetch error:', err);
      });

      fetch.once('end', () => {
        imap.end();
      });
    });
  });
});

imap.once('error', (err) => {
  console.log('IMAP error:', err);
});

imap.once('end', () => {
  console.log('Connection ended');
});

// Connect to IMAP server
imap.connect();