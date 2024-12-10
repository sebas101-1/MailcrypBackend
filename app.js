const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

// Update with your SQL VM database credentials
const db = mysql.createConnection({
  user: "backend_root",       
  host: "localhost",  
  port: 3307,   
  password: "586731", // Replace with the new user password
  database: "mailserver_db"     // Ensure this matches your database name
});

const app = express();

// Middleware setup
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.json());
app.use(session({
  secret: 'super_freaking_secret',  // Replace with a strong secret key
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

// Passport Local Strategy for authentication
passport.use(new LocalStrategy(async (username, password, done) => {
  try {
    // Fetch the user based on the username
    const results = await query('SELECT id, email, password FROM users WHERE email = ?', [username+"@localhost"]);
    
    if (results.length === 0) {
      console.log("User not found");
      return done(null, false, { message: 'User not found' });
    }

    const user = results[0];
    // Compare hashed passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      return done(null, user);  // Success: pass user data to next step
    } else {
      console.log("invalid credentials")
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
    const results = await query('SELECT id, email FROM users WHERE id = ?', [id]);
    if (results.length === 0) {
      return done(new Error('User not found'));
    }
    return done(null, results[0]);
  } catch (error) {
    done(error);
  }
});

// POST route for user login
app.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Server error' });
    }
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    return res.status(200).json({ success: true, message: 'Login successful' });
  })(req, res, next);
});

// Check if user is authenticated
app.get('/loggedIn', (req, res) => {
  if (req.isAuthenticated()) {
    res.status(200).send('Login successful');
  } else {
    res.status(401).send('You are not authenticated');
  }
});

// POST route to create a new account
app.post('/create', async (req, res) => {
  const username = req.body.username;
  const plainPassword = req.body.password;

  try {
    // Hash the password
    const saltRounds = 10;
    // const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
    const hashedPassword = plainPassword;

    // Insert the new user into the database
    await query('INSERT INTO users (email, password, home, quota) VALUES (?, ?,?,102400)', [username+"@localhost", hashedPassword,("/var/mail/"+username)]);

    res.status(200).send('Account created successfully');
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).send('Server error');
  }
});

// Start the server
app.listen(3000, () => {
  console.log("Server running on port 3000");
});
