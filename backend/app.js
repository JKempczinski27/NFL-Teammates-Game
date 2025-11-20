// Separate app configuration from server startup for testing
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();

// DB connection using Railway's connection string
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

app.use(cors());
app.use(express.json());

// Health check route
app.get('/', (req, res) => {
  res.send('Backend is running');
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

module.exports = { app, pool };
