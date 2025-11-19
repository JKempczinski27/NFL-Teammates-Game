// Routes for NFL Trivia Game
const express = require('express');
const router = express.Router();

// Import pool from parent module
let pool;

// Initialize pool reference
router.use((req, res, next) => {
  if (!pool) {
    pool = require('../index').pool;
  }
  next();
});

// Save player info for trivia game
router.post('/players', async (req, res) => {
  const { name, email, team, score } = req.body;

  // Input validation
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  if (typeof name !== 'string' || typeof email !== 'string') {
    return res.status(400).json({ error: 'Invalid input format' });
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  try {
    await pool.query(
      'INSERT INTO trivia_players (name, email, team, score, created_at) VALUES ($1, $2, $3, $4, NOW())',
      [name.trim(), email.trim().toLowerCase(), team || null, score || 0]
    );
    res.status(200).json({ message: 'Player saved successfully' });
  } catch (err) {
    console.error('Error saving trivia player:', err);
    res.status(500).json({ error: 'Error saving player. Please try again.' });
  }
});

// Get leaderboard for trivia game
router.get('/leaderboard', async (req, res) => {
  const { limit = 10 } = req.query;

  try {
    const result = await pool.query(
      'SELECT name, team, score, created_at FROM trivia_players ORDER BY score DESC LIMIT $1',
      [parseInt(limit)]
    );
    res.json({ leaderboard: result.rows });
  } catch (err) {
    console.error('Error fetching leaderboard:', err);
    res.status(500).json({ error: 'Error fetching leaderboard' });
  }
});

module.exports = router;
