const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oidc');
const checkEmails = require('./recive.js');
const bcrypt = require('bcrypt');
const sendEmail = require('./send.js');
let UsersUsername;
let UsersPassword;
// Update with your SQL VM database credentials
const db = mysql.createConnection({
  user: "backend_root",
  host: "localhost",
  password: "&daWadj13z2",
  port: 3306,
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
function generateDovecotHash(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.createHash('sha512')
    .update(password + salt)
    .digest('hex');
  return `{SHA512-CRYPT}$6$${salt}$${hash}`;
}

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
const MySQLStore = require('express-mysql-session')(session);
const sessionStore = new MySQLStore({
  host: 'localhost',
  port: 3306,
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
  // console.log('\n=== Session Debug ===');
  // console.log('Session ID:', req.sessionID);
  // console.log('Session data:', req.session);
  // console.log('Authenticated user:', req.user);
  // console.log('=====================\n');
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
    
    const results = await query('SELECT id, email, password FROM virtual_users WHERE email = ?', [username + "@example.test"]);
    if (results.length === 0) {
      console.log("User not found");
      return done(null, false, { message: 'Invalid credentials' }); // Generic message for security
    }

    const user = results[0];



    // Compare passwords (note await here)

    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      UsersUsername = user.email;
      UsersPassword = password;
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
passport.serializeUser((user, done) => {
  console.log('📩 Serializing user:', user.id);
  done(null, user.id);
});

// Deserialization
passport.deserializeUser(async (id, done) => {
  console.log('📥 Deserializing user ID:', id);
  try {
    const results = await query('SELECT id, email FROM virtual_users WHERE id = ?', [id]);
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
      UsersUsername = null;
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
        const [freshUser] = await query('SELECT id, email FROM virtual_users WHERE id = ?', [user.id]);
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

app.get('/getEmails', isAuthenticated, async (req, res) => {
  const email_user = UsersUsername;
  const email_password = UsersPassword;

  try {
    console.log('Checking emails for:', email_user);
    const emails = await checkEmails(email_user, email_password);
    res.status(200).json({ 
      success: true, 
      message: 'Email check completed',
      emails: emails
    });
  } catch (error) {
    console.error('Error during email check:', error);
    res.status(500).json({ success: false, message: 'Error checking emails' });
  }
});

app.post('/sendEmail', isAuthenticated, async (req, res) => {
  try {
    // Extract the email object from request body
    const email = req.body.email;
    console.log("Received Email Object:", email);
    // Validate required fields
    if (!email?.to || !email?.subject) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: to or subject' 
      });
    }

    console.log("Sending Email to:", email.to);
    
    // Send email (using environment variables for credentials)
    const status = await sendEmail(
      UsersUsername,
      email.to,
      email.subject,
      email.textashtml,
      email.textashtml,  // Default to false if not provided
      email.attachments || []     // Default to empty array
    );
    if (!status) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to send email' 
      });
    }
    // Proper success response
    res.status(200).json({ 
      success: true, 
      message: 'Email sent successfully' 
    });
    
  } catch (error) {
    console.error('Email sending error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message // Optional: include error details
    });
  }
});
// POST route to create a new account
app.post('/create', async (req, res) => {
  const username = req.body.username;
  const plainPassword = req.body.password;

  try {
    // Check for existing user
    const existing = await query('SELECT id FROM virtual_users WHERE email = ?', [username + "@example.test"]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash password

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
    
    // Create user
    await query(
      'INSERT INTO virtual_users (email, password, domain_id) VALUES (?, ?,1)',
      [username + "@example.test", hashedPassword, `/var/mail/vhost/localhost/${username}@example.test`]
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
});
