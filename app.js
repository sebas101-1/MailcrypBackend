// server.js
const express = require('express');
const Imap = require('node-imap');
const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.get('/', (req, res) => {
  res.send('Welcome to the IMAP server');
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
