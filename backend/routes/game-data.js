/**
 * Game Data Route - Consolidated
 * Handles game submissions for Journeyman and other games
 */

const express = require('express');
const router = express.Router();
const pool = require('../config/database');

/**
 * POST /api/game-data
 * Submit game completion data
 * Used primarily by Journeyman game
 * Body: { name, email, gameType, correctCount, durationInSeconds, score }
 */
router.post('/', async (req, res) => {
  const { name, email, gameType, correctCount, durationInSeconds, score, sessionId } = req.body;

  // Input validation
  if (!name || !email || !gameType) {
    return res.status(400).json({
      error: 'Missing required fields: name, email, gameType'
    });
  }

  // Validate game type
  const validGameTypes = ['teammates', 'journeyman', 'trivia'];
  if (!validGameTypes.includes(gameType)) {
    return res.status(400).json({
      error: 'Invalid gameType. Must be one of: teammates, journeyman, trivia'
    });
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Insert or update player
    await client.query(
      `INSERT INTO players (name, email)
       VALUES ($1, $2)
       ON CONFLICT (email) DO UPDATE
       SET name = EXCLUDED.name, updated_at = CURRENT_TIMESTAMP`,
      [name.trim(), email.trim().toLowerCase()]
    );

    // Insert game submission
    const result = await client.query(
      `INSERT INTO game_submissions
       (session_id, player_name, player_email, game_type, correct_count, duration_seconds, score)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        sessionId || `session_${Date.now()}`,
        name.trim(),
        email.trim().toLowerCase(),
        gameType,
        correctCount || 0,
        durationInSeconds || 0,
        score || 0
      ]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Game data received',
      submission: result.rows[0],
      sessionId: result.rows[0].session_id
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error saving game data:', err);
    res.status(500).json({ error: 'Error saving game data' });
  } finally {
    client.release();
  }
});

/**
 * GET /api/game-data/leaderboard/:gameType
 * Get leaderboard for a specific game
 */
router.get('/leaderboard/:gameType', async (req, res) => {
  const { gameType } = req.params;
  const limit = parseInt(req.query.limit) || 10;

  try {
    const result = await pool.query(
      `SELECT
        player_name,
        player_email,
        game_type,
        MAX(score) as best_score,
        MAX(correct_count) as best_correct_count,
        MIN(duration_seconds) as fastest_time,
        COUNT(*) as total_games
       FROM game_submissions
       WHERE game_type = $1
       GROUP BY player_name, player_email, game_type
       ORDER BY best_score DESC, fastest_time ASC
       LIMIT $2`,
      [gameType, limit]
    );

    res.json({
      success: true,
      gameType,
      leaderboard: result.rows
    });
  } catch (err) {
    console.error('Error fetching leaderboard:', err);
    res.status(500).json({ error: 'Error fetching leaderboard' });
  }
});

/**
 * GET /api/game-data/stats/:gameType
 * Get statistics for a specific game
 */
router.get('/stats/:gameType', async (req, res) => {
  const { gameType } = req.params;

  try {
    const result = await pool.query(
      `SELECT
        COUNT(*) as total_submissions,
        COUNT(DISTINCT player_email) as unique_players,
        AVG(score) as avg_score,
        MAX(score) as max_score,
        AVG(duration_seconds) as avg_duration,
        AVG(correct_count) as avg_correct_count
       FROM game_submissions
       WHERE game_type = $1`,
      [gameType]
    );

    res.json({
      success: true,
      gameType,
      stats: result.rows[0]
    });
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: 'Error fetching stats' });
  }
});

module.exports = router;
