// Separate app configuration from server startup for testing
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Import centralized database connection pool
const pool = require('./config/database');

app.use(cors());
app.use(express.json());

// Serve static files from public directory
app.use(express.static('public'));

// Health check route
app.get('/', (req, res) => {
  res.send('Backend is running');
});

// Dashboard route
app.get('/dashboard', (req, res) => {
  res.sendFile('dashboard.html', { root: './public' });
});

// Save player info
app.post('/api/player', async (req, res) => {
  const { name, email } = req.body;
  try {
    await pool.query('INSERT INTO players (name, email) VALUES ($1, $2)', [name, email]);
    res.status(200).json({ message: 'Player saved successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error saving player' });
  }
});

// Test DB connection route
app.get('/api/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ connected: true, time: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ connected: false, error: err.message });
  }
});

// Track route
const trackRouter = require('./routes/track');
app.use('/api/track', trackRouter);

// NFL Trivia Game routes
const triviaRouter = require('./routes/trivia');
app.use('/api/trivia', triviaRouter);

// Journeyman game routes
const journeymanRouter = require('./routes/journeyman');
app.use('/api/journeyman', journeymanRouter);

// Make pool available to routes
app.set('pool', pool);

module.exports = { app, pool };
