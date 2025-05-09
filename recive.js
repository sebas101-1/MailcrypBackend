process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { simpleParser } = require('mailparser');
require('dotenv').config();
const ImapClient = require('emailjs-imap-client').default;

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
      servername: process.env.IMAP_HOST // Use the actual hostname instead of hardcoding 'localhost'
    },
    connectionTimeout: 30000, // 30 seconds timeout
    socketTimeout: 60000     // 60 seconds timeout
  }
);

async function checkEmails() {
  try {
    console.log('Connecting to IMAP server...');
    console.log(`Host: ${process.env.IMAP_HOST}`);
    console.log(`Port: ${process.env.IMAP_PORT}`);
    
    await client.connect();
    console.log('Successfully connected to IMAP server');

    const mailbox = await client.selectMailbox('INBOX');
    console.log(`INBOX contains ${mailbox.exists} messages`);

    // Modified search command - removed useUid option
    const messages = await client.search(['ALL']);const messages = await client.search(['ALL']);
    
    if (messages.length === 0) {
      console.log('No emails found');.log('No emails found');
      return; return;
    }    }

    console.log(`Found ${messages.length} emails`);    console.log(`Found ${messages.length} emails`);

    const recentMessages = messages.slice(-5);
    
    for (const uid of recentMessages) {
      try {
        // Modified fetch command
        const msgData = await client.fetchMessage(uid.toString(), { }, '[RFC822]');g(), { }, '[RFC822]');
        const parsed = await simpleParser(msgData['RFC822']);const parsed = await simpleParser(msgData['RFC822']);
        
        console.log('\n----------------------------------------');-------------');
        console.log(`From: ${parsed.from?.text}`);
        console.log(`Date: ${parsed.date}`);
      } catch (msgError) {
        console.error(`Error processing message ${uid}:`, msgError);
      }
    }
  } catch (error) {
    console.error('IMAP Error:', error);
    throw error; // Re-throw to handle in the finally block
  } finally {
    try {
      await client.close();
      console.log('Connection closed properly');
    } catch (closeError) {
      console.error('Error while closing connection:', closeError);
    }
  }
}

// Run the email check with better error handling
checkEmails().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});