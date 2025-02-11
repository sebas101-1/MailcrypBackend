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
  password: "&daWadj13z2",
  port: 3307,
  database: "mailserver_db"
});

const app = express();
const corsOptions = {
  origin: 'http://localhost:5173', // Match this with your frontend URL
  credentials: true, // Allows session cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allow necessary methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allow required headers
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
// Middleware setup
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: 'super_freaking_secret', // Make this stronger
  resave: false,
  saveUninitialized: false, // Change to false
  cookie: {
    secure: false, // Change to true if using HTTPS
    httpOnly: true, 
    sameSite: 'lax' 
  }
}));

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
    console.log()
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
    return done(null, results[0]); // ✅ This should return the user
  } catch (error) {
    done(error);
  }
});
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next(); // User is authenticated, proceed
  }
  res.status(401).json({ success: false, message: 'Unauthorized access' });
};
app.get('/home', isAuthenticated, (req, res) => {
  res.status(200).json({ success: true, message: 'Login successful' });
});

app.post('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Logout failed' });
    }
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Session destroy failed' });
      }
      res.clearCookie('connect.sid'); // Clear the session cookie
      return res.status(200).json({ success: true, message: 'Logged out' });
    });
  });
});


// POST route for user login
app.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return res.status(500).json({ success: false, message: 'Server error' });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    req.login(user, (err) => {
      if (err) return res.status(500).json({ success: false, message: 'Login failed' });

      // ✅ Manually save session
      req.session.save((err) => {
        if (err) return res.status(500).json({ success: false, message: 'Session save failed' });

        console.log("User logged in and session saved:", user);
        return res.status(200).json({ success: true, message: 'Login successful' });
      });
    });
  })(req, res, next);
});


// Check if user is authenticated
app.get('/loggedIn', (req, res) => {
  console.log("Session Data:", req.session);
  console.log("User:", req.user);

  if (req.isAuthenticated()) {
    res.status(200).json({ success: true, message: 'Login successful' });
  } else {
    res.status(401).json({ success: false, message: 'You are not authenticated' });
  }
});


// POST route to create a new account
app.post('/create', async (req, res) => {
  const username = req.body.username;
  const plainPassword = req.body.password;  

  try {
    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
    
    // Insert the new user into the database
    await query('INSERT INTO users (email, password, home, quota) VALUES (?, ?,?,102400)', [username+"@localhost", hashedPassword,("/var/mail/localhost/"+username+"@localhost")]);

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
