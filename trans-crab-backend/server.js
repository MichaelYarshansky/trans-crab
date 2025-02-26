require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const cookieSession = require('cookie-session');
const transcriptionsRouter = require('./routes/transcriptions');

const app = express();
const PORT = process.env.PORT || 5001;

// Connect to MongoDB with enhanced logging
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 20000, // 20 seconds timeout for testing
})
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

mongoose.connection.on('error', err => {
  console.error("❌ Mongoose connection error:", err);
});
mongoose.connection.once('open', () => {
  console.log("✅ Mongoose connection established successfully");
});

// Enable CORS for all origins (for development)
app.use(cors());

// Middleware for JSON bodies and cookie sessions
app.use(express.json());
app.use(cookieSession({
  name: 'trans-crab-session',
  keys: [process.env.SESSION_SECRET || 'secret-key'],
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
}));

app.use(passport.initialize());
app.use(passport.session());

// Passport serialization/deserialization
passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((user, done) => {
  done(null, user);
});

// Configure Google OAuth strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/auth/google/callback'
  },
  (accessToken, refreshToken, profile, done) => {
    console.debug("Google profile:", profile);
    // In production, store/retrieve the user from your DB here.
    return done(null, profile);
  }
));

// Google OAuth routes
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/dashboard');
  }
);

// Simple dashboard route to test authentication
app.get('/dashboard', (req, res) => {
  if (req.user) {
    res.send(`<h1>Dashboard</h1><p>Welcome, ${req.user.displayName}!</p>`);
  } else {
    res.redirect('/auth/google');
  }
});

// Health-check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Mount transcription routes
app.use('/api/transcriptions', transcriptionsRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
