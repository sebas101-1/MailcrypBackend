const imaps = require('imap-simple');

const config = {
  imap: {
    user: 'user',
    password: '1234',
    host: 'localhost',
    port: 993,
    tls: true,
    authTimeout: 10000, // Optional: adjust the authentication timeout
    tlsOptions: { rejectUnauthorized: false } // Optional: ignore self-signed certificate warnings
  }
};

imaps.connect(config).then((connection) => {
  return connection.openBox('INBOX').then(() => {
    const searchCriteria = ['UNSEEN'];
    const fetchOptions = { bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)'], struct: true };

    return connection.search(searchCriteria, fetchOptions);
  }).then((messages) => {
    messages.forEach((message) => {
      const parts = imaps.getParts(message.attributes.struct);
      parts.forEach((part) => {
        console.log(part.body);
      });
    });
    connection.end();
  });
}).catch((err) => {
  console.error('Error occurred:', err);
});
