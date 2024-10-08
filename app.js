const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const db = mysql.createConnection({
    user: "root",
    host: "localhost",
    password: "password",
    database: "MailCrypDb"
});



const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(cors());
// Test route to insert user into the database
const query = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (error, results) => {
      if (error) {
        return reject(error);
      }
      resolve(results);
    });
  });
};

app.post('/login', async (req, res) => {
  const username = req.body.username;
  const plainPassword = req.body.password;

  try {
    const results = await query('USE UserMailCryp SELECT password FROM user WHERE username = ?', [username]);

    if (results.length === 0) {
      return res.status(400).send('User not found');
    }

    const hashedPassword = results[0].password;
    const isMatch = await bcrypt.compare(plainPassword, hashedPassword);

    if (isMatch) {
      res.status(200).send('Login successful');
    } else {
      res.status(401).send('Invalid credentials');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

app.post('/create', async (req, res) => {
  const username = req.body.username;
  const plainPassword = req.body.password;
  console.log(plainPassword);

  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

    await query('USE UserMailCryp  INSERT INTO user (username, password) VALUES (?, ?)', [username, hashedPassword]);

    res.status(200).send('Account created successfully');
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).send('Server error');
  }
});



app.listen(3000, () => {
  console.log("running at port 3000");
});
