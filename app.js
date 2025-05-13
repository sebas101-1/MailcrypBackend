const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oidc');
import checkEmails from './recive.js';
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
const MySQLStore = require('express-mysql-session')(session);
const sessionStore = new MySQLStore({
  host: 'localhost',
  port: 3307,
  user: 'backend_root',
  password: '&daWadj13z2',
  database: 'mailserver_db'
});

app.use(session({
  secret: 'super_freaking_secret',
  store: sessionStore, // Add this line
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    sameSite: 'lax',
    domain: 'localhost' // Explicit domain
  }
}));
app.use((req, res, next) => {
  console.log('\n=== Session Debug ===');
  console.log('Session ID:', req.sessionID);
  console.log('Session data:', req.session);
  console.log('Authenticated user:', req.user);
  console.log('=====================\n');
  next();
});
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

passport.use(new LocalStrategy(async (username, password, done) => {
  try {
    // Fetch user from database (note await here)
    const results = await query('SELECT id, email, password FROM users WHERE email = ?', [username + "@localhost"]);
    
    if (results.length === 0) {
      console.log("User not found");
      return done(null, false, { message: 'Invalid credentials' }); // Generic message for security
    }

    const user = results[0];
    
    // Compare passwords (note await here)
    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      return done(null, user); // Successful login
    } else {
      console.log("Invalid password");
      return done(null, false, { message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error("Authentication error:", error);
    return done(error);
  }
}));
// Passport Local Strategy for authentication
// passport.use(new LocalStrategy(async (username, password, done) => {
//   try {
//     // Fetch the user based on the username
//     const results = await query('SELECT id, email, password FROM users WHERE email = ?', [username+"@localhost"]);
    
//     if (results.length === 0) {
//       console.log("User not found");
//       return done(null, false, { message: 'User not found' });
//     }

//     const user = results[0];
//     // Compare hashed passwords
//     const isMatch = await bcrypt.compare(password, user.password);
//     if (isMatch) {
//       return done(null, user);  // Success: pass user data to next step
//     } else {
//       console.log("invalid credentials")
//       return done(null, false, { message: 'Invalid credentials' });
//     }
//   } catch (error) {
//     return done(error);
//   }
// }));

// Serialize user info into session
// Serialization
passport.serializeUser((user, done) => {
  console.log('📩 Serializing user:', user.id);
  done(null, user.id);
});

// Deserialization
passport.deserializeUser(async (id, done) => {
  console.log('📥 Deserializing user ID:', id);
  try {
    const results = await query('SELECT id, email FROM users WHERE id = ?', [id]);
    if (!results.length) {
      console.error('🚫 User not found for ID:', id);
      return done(null, false);
    }
    console.log('✅ Found user:', results[0]);
    done(null, results[0]);
  } catch (error) {
    console.error('🔥 Deserialization error:', error);
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
      console.log(err);
      return res.status(500).json({ success: false, message: 'Logout failed' });
    }
    req.session.destroy((err) => {
      if (err) {
        console.log(err)
        return res.status(500).json({ success: false, message: 'Session destroy failed' });
      }
      res.clearCookie('connect.sid'); // Clear the session cookie
      console.log("Logged Out Worked \n ++++++++++++++++++++++++++")
      return res.status(200).json({ success: true, message: 'Logged out' });
    });
  });
});


app.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    req.login(user, async (err) => {
      if (err) return next(err);
      
      // Fetch fresh user data for session
      try {
        const [freshUser] = await query('SELECT id, email FROM users WHERE id = ?', [user.id]);
        console.log('🔐 Session payload:', freshUser);
        res.status(200).json({ 
          success: true, 
          user: { id: freshUser.id, email: freshUser.email }
        });
      } catch (error) {
        next(error);
      }
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
    // Check for existing user
    const existing = await query('SELECT id FROM users WHERE email = ?', [username + "@localhost"]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    
    // Create user
    await query(
      'INSERT INTO users (email, password, home, quota) VALUES (?, ?, ?, 102400)',
      [username + "@localhost", hashedPassword, `/var/mail/vhost/localhost/${username}@localhost`]
    );

    res.status(201).json({ success: true, message: 'Account created' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});
// Start the server
app.listen(3000, () => {
  console.log("Server running on port 3000");
  checkEmails(process.env.EMAIL_USER, process.env.EMAIL_PASSWORD)
    .then(() => console.log("Email check completed"))
    .catch(err => console.error("Error checking emails:", err));
});
