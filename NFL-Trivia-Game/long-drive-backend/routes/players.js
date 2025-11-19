const express = require('express');
const router = express.Router();
const pool = require('../db');

console.log('Defining routes...');

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection error:', err);
  } else {
    console.log('✅ Database connected:', res.rows[0]);
  }
});

router.post('/', async (req, res) => {
  const { name, email, team } = req.body;
  console.log("📥 POST /api/players");
  console.log("➡️ Incoming data:", { name, email, team });
  console.log("Request body:", req.body);

  if (!name || !email || !team) {
    console.log("❌ Missing required fields");
    return res.status(400).json({ error: 'Missing name, email, or team' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO players (name, email, team) VALUES ($1, $2, $3) RETURNING *',
      [name, email, team]
    );
    console.log("✅ Inserted player:", result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('❌ Error saving player:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
