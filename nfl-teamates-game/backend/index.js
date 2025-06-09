const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 8080;

// DB connection using Railway's connection string
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

app.use(cors());
app.use(express.json());

// 🟢 TEST route
app.get('/', (req, res) => {
  res.send('Backend is running');
});

// 🟡 Save player info
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

// Example: Insert a tracking event into player_updated
await pool.query(
  'INSERT INTO player_updated (session_id, event_type, event_data, created_at) VALUES ($1, $2, $3, NOW())',
  [sessionId, eventType, eventData]
);

// Test DB connection route
app.get('/api/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()'); // Simple query to check the connection
    res.json({ connected: true, time: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ connected: false, error: err.message });
  }
});

const trackRouter = require('./routes/track');
app.use('/api/track', trackRouter);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});