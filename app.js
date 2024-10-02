const express = require('express');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const crypto = require('crypto');
const mysql = require('mysql')
const db = mysql.createConnection({
    user: "root",
    host: "localhost",
    password: "password",
    database: "UserMailCryp"
});

const app = express();

app.get('/insert', (req,res) => {
  db.query(
    'INSERT INTO USERS (username password) VALUES ("sebastien",1234)', 
    (err,result) => {
    if(err){
      console.log(err);
      res.send('error')
    }
    res.send(result)
  })
});
app.listen(3000, () => {
  console.log("running at port 3000");
})