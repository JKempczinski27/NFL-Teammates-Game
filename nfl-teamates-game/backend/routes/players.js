/**
 * Players Route - Consolidated
 * Handles player management for all three games
 * - NFL Teammates Game
 * - Journeyman
 * - NFL Trivia Game
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../index');

/**
 * POST /api/players
 * Add a new player (all games)
 * Body: { name, email, team (optional) }
 */
router.post('/', async (req, res) => {
  const { name, email, team } = req.body;

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
    const result = await pool.query(
      'INSERT INTO players (name, email, team) VALUES ($1, $2, $3) RETURNING *',
      [name.trim(), email.trim().toLowerCase(), team || null]
    );

    res.status(201).json({
      success: true,
      player: result.rows[0]
    });
  } catch (err) {
    console.error('Error saving player:', err);

    // Handle duplicate email
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email already exists' });
    }

    res.status(500).json({ error: 'Error saving player. Please try again.' });
  }
});

/**
 * GET /api/players
 * Get all players (for admin/analytics)
 */
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, team, created_at FROM players ORDER BY created_at DESC LIMIT 100'
    );

    res.json({
      success: true,
      count: result.rows.length,
      players: result.rows
    });
  } catch (err) {
    console.error('Error fetching players:', err);
    res.status(500).json({ error: 'Error fetching players' });
  }
});

/**
 * GET /api/players/:email
 * Get player by email
 */
router.get('/:email', async (req, res) => {
  const { email } = req.params;

  try {
    const result = await pool.query(
      'SELECT id, name, email, team, created_at FROM players WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Player not found' });
    }

    res.json({
      success: true,
      player: result.rows[0]
    });
  } catch (err) {
    console.error('Error fetching player:', err);
    res.status(500).json({ error: 'Error fetching player' });
  }
});

/**
 * PUT /api/players/:email
 * Update player information
 */
router.put('/:email', async (req, res) => {
  const { email } = req.params;
  const { name, team } = req.body;

  try {
    const result = await pool.query(
      'UPDATE players SET name = COALESCE($1, name), team = COALESCE($2, team), updated_at = CURRENT_TIMESTAMP WHERE email = $3 RETURNING *',
      [name, team, email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Player not found' });
    }

    res.json({
      success: true,
      player: result.rows[0]
    });
  } catch (err) {
    console.error('Error updating player:', err);
    res.status(500).json({ error: 'Error updating player' });
  }
});

module.exports = router;
