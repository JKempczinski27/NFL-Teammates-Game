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

app.get('/api/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()'); // Simple query to check the connection
    res.status(200).json({ success: true, time: result.rows[0].now });
  } catch (err) {
    console.error('Database connection error:', err);
    res.status(500).json({ success: false, error: 'Database connection failed' });
  }
});

const trackRouter = require('./routes/track');
app.use('/api/track', trackRouter);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});