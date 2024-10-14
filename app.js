const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const db = mysql.createConnection({
  user: "root",
  host: "localhost",
  password: "password",
  database: "mailcrypdb"
});

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.json());
// Session middleware for persistent login sessions
app.use(session({
  secret: 'some_secret',  // replace with a strong secret key
  resave: false,
  saveUninitialized: true
}));

// Initialize Passport and session
app.use(passport.initialize());
app.use(passport.session());

// Helper function for queries
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

// Passport Local Strategy
passport.use(new LocalStrategy(async (username, password, done) => {
  try {
    const results = await query('SELECT id, username, password FROM users WHERE username = ?', [username]);
    
    if (results.length === 0) {
      console.log("user Not Found");
      return done(null, false, { message: 'User not found' });
    }

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      return done(null, user);  // Success: pass user data to next step
    } else {
      return done(null, false, { message: 'Invalid credentials' });
    }
  } catch (error) {
    return done(error);
  }
}));

// Serialize user info into session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user info from session
passport.deserializeUser(async (id, done) => {
  try {
    const results = await query('SELECT id, username FROM users WHERE id = ?', [id]);
    if (results.length === 0) {
      return done(new Error('User not found'));
    }
    return done(null, results[0]);
  } catch (error) {
    done(error);
  }
});

// POST route for user login with Passport.js
app.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return res.status(500).json({success: false, message: 'Server error' });
    }
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });  // Authentication failed
    }
    
    // Successful authentication
    console.log("succsessful");
    return res.status(200).json({ success: true, message: 'Login successful' });  // Send success response;
  })(req, res, next);
});

// Route to check if user is authenticated
app.get('/loggedIn', (req, res) => {
  if (req.isAuthenticated()) {
    res.status(200).send('Login successful');
    console.log("logged in");
  } else {
    res.status(401).send('You are not authenticated');
    console.log("notlogged")
  }
});

app.post('/logout', function(req, res, next){
  req.logout(function(err) {
    if (err) { return next(err); }
    console.log('it worked');
    return("logged out");
  });
});

app.get('/home', (req, res) => {
  if (req.isAuthenticated()) {
    res.send('Welcome to your dashboard!');
    console.log("user is logged in!!")
  } else {
    res.redirect('/');
  }
});

// Route for failed login
app.get('/login-failed', (req, res) => {
  res.status(401).send('Login failed');
});

// POST route to create a new account
app.post('/create', async (req, res) => {
  const username = req.body.username;
  const plainPassword = req.body.password;

  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

    await query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);

    res.status(200).send('Account created successfully');
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).send('Server error');
  }
});

// Start the server
app.listen(3000, () => {
  console.log("running at port 3000");
});
