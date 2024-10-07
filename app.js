const express = require('express');
const mysql = require('mysql2');

const db = mysql.createConnection({
    user: "root",
    host: "localhost",
    password: "password",
    database: "MailCrypDb"
});

const app = express();

// Test route to insert user into the database
app.get('/insert', (req, res) => {
  db.query(
    'INSERT INTO USERS (id, username, password) VALUES (?, ?, ?)', 
    [1,"sebastien", "1234"], // Use placeholders for SQL injection protection
    (err, result) => {
      if (err) {
        console.log(err);
        return res.send('Error occurred');
      }
      res.send('User inserted successfully');
  });
});

app.listen(3000, () => {
  console.log("running at port 3000");
});
