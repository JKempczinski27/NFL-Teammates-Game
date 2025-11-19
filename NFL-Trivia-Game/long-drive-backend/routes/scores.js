const express = require('express');
const router = express.Router();
const pool = require('../db');

// Add a new player
router.post('/', async (req, res) => {
  const { name, email, team } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO players (name, email, team) VALUES ($1, $2, $3) RETURNING *',
      [name, email, team]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      res.status(400).json({ error: 'Email already exists.' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// Get all players
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM players ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
