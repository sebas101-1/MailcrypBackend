process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { parse } = require('dotenv');
const { simpleParser } = require('mailparser');
require('dotenv').config();
const ImapClient = require('emailjs-imap-client').default;
function getClient(email_user, email_password) {
  return new ImapClient(
    process.env.IMAP_HOST,
    parseInt(process.env.IMAP_PORT) || 993,
    {
      auth: {
        user: email_user,
        pass: email_password
      },
      logLevel: 'debug',
      useSecureTransport: true,
      ignoreTLS: false,
      requireTLS: true,
      tlsOptions: {
        rejectUnauthorized: false,
        servername: process.env.IMAP_HOST
      },
      connectionTimeout: 30000,
      socketTimeout: 60000
    }
  );
}
const client = new ImapClient(
  process.env.IMAP_HOST,
  parseInt(process.env.IMAP_PORT) || 993,
  {
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    logLevel: 'debug',
    useSecureTransport: true,
    ignoreTLS: false,
    requireTLS: true,
    tlsOptions: {
      rejectUnauthorized: false,
      servername: process.env.IMAP_HOST
    },
    connectionTimeout: 30000,
    socketTimeout: 60000
  }
);
async function checkEmails(email_user, email_password) {
  let parsedMessages = [];
  const client = getClient(email_user, email_password);
  try {
    console.log('Connecting to IMAP server...');
    console.log(`Host: ${process.env.IMAP_HOST}`);
    console.log(`Port: ${process.env.IMAP_PORT}`);
    
    await client.connect();
    console.log('Successfully connected to IMAP server');

    const mailbox = await client.selectMailbox('INBOX');
    console.log(`INBOX contains ${mailbox.exists} messages`);

    // Fixed search command with proper criteria
    const messages = await client.search('INBOX', {all: true}, {byUid: true})
    
    if (messages.length === 0) {
      console.log('No emails found');
      return;
    }

    console.log(`Found ${messages.length} emails`);

    const recentMessages = messages.slice(-5);
    const message = await client.listMessages('INBOX', '1:*', ['uid', 'flags', 'body[]']);
    for (let i =0; i < messages.length; i++) {
      try {
        // Fetch the full message data
        console.log("Fetching message with ID:", recentMessages[i]);
        
        console.log(`Fetched message with ID: ${recentMessages[i]}`);
        // Parse the message content
        const parsed = await simpleParser(message[i]['body[]']);

        // Display message details
        // console.log('\n----------------------------------------');
        // console.log(`From: ${parsed.from?.text}`);
        // console.log(`Subject: ${parsed.subject}`);
        // console.log(`Date: ${parsed.date}`);
        // console.log('Body:', parsed.text);
        // console.log('HTML Body:', parsed.textAsHtml);
        // console.log('\n----------------------------------------');
        // console.log(parsed);
        
        // If there are attachments, list them
        if (parsed.attachments.length > 0) {
          console.log('\nAttachments:');
          parsed.attachments.forEach(attachment => {
            console.log(`- ${attachment.filename} (${attachment.contentType})`);
          });
        }
        parsedMessages.push(parsed);
        // console.log('Parsed message:', parsedMessages);
      } catch (msgError) {
        console.error(`Error fetching message ${messageId}:`, msgError);
      }
    }
  } catch (error) {
    console.error('IMAP Error:', error);
    throw error;
  } finally {
    try {
      await client.close();
      console.log('Connection closed properly');
      return parsedMessages;
    } catch (closeError) {
      console.error('Error while closing connection:', closeError);
    }
  }
}
module.exports = checkEmails;
// checkEmails(process.env.EMAIL_USER, process.env.EMAIL_PASSWORD)
  // .then(() => {
  //   console.log('Email check completed successfully');
  // })
  // .catch((error) => {
  //   console.error('Error during email check:', error);
  // });