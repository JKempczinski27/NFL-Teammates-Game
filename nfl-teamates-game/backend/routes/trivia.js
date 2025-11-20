const express = require('express');
const router = express.Router();

// POST endpoint to save trivia game player
router.post('/players', async (req, res) => {
  const { name, email, team, score } = req.body;
  const pool = req.app.get('pool');

  if (!name || !email || !team) {
    return res.status(400).json({ error: 'Missing required fields: name, email, or team' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO trivia_players (name, email, team, score) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, email, team, score || 0]
    );
    res.status(201).json({
      message: 'Trivia player saved successfully',
      player: result.rows[0]
    });
  } catch (err) {
    console.error('Error saving trivia player:', err);
    if (err.code === '23505') {
      res.status(400).json({ error: 'Email already exists' });
    } else {
      res.status(500).json({ error: 'Database error saving trivia player' });
    }
  }
});

// GET endpoint to retrieve all trivia game players
router.get('/players', async (req, res) => {
  const pool = req.app.get('pool');

  try {
    const result = await pool.query(
      'SELECT * FROM trivia_players ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching trivia players:', err);
    res.status(500).json({ error: 'Database error fetching trivia players' });
  }
});

// GET endpoint to retrieve leaderboard
router.get('/leaderboard', async (req, res) => {
  const pool = req.app.get('pool');
  const limit = parseInt(req.query.limit) || 10;

  try {
    const result = await pool.query(
      'SELECT name, team, score, created_at FROM trivia_players ORDER BY score DESC, created_at ASC LIMIT $1',
      [limit]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching trivia leaderboard:', err);
    res.status(500).json({ error: 'Database error fetching leaderboard' });
  }
});

module.exports = router;
