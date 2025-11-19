// Routes for Journeyman Game
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

// Save player data for journeyman game
router.post('/save-player', async (req, res) => {
  const {
    name,
    email,
    sessionId,
    gameType,
    score,
    guesses,
    timeElapsed,
    clientTimestamp,
    browserInfo,
    sessionInfo
  } = req.body;

  // Input validation
  if (!name || !email) {
    return res.status(400).json({
      success: false,
      error: 'Name and email are required'
    });
  }

  if (typeof name !== 'string' || typeof email !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Invalid input format'
    });
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid email format'
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO journeyman_players
       (name, email, session_id, game_type, score, guesses, time_elapsed,
        client_timestamp, browser_info, session_info, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
       RETURNING id`,
      [
        name.trim(),
        email.trim().toLowerCase(),
        sessionId || null,
        gameType || 'journeyman',
        score || 0,
        guesses || 0,
        timeElapsed || 0,
        clientTimestamp || new Date().toISOString(),
        JSON.stringify(browserInfo || {}),
        JSON.stringify(sessionInfo || {})
      ]
    );

    res.status(200).json({
      success: true,
      message: 'Player saved successfully',
      playerId: result.rows[0].id
    });
  } catch (err) {
    console.error('Error saving journeyman player:', err);
    res.status(500).json({
      success: false,
      error: 'Error saving player. Please try again.'
    });
  }
});

// Batch upload for multiple sessions
router.post('/batch-upload', async (req, res) => {
  const { sessions, batchSize, batchTimestamp } = req.body;

  if (!Array.isArray(sessions) || sessions.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Sessions must be a non-empty array'
    });
  }

  let successful = 0;
  let failed = 0;
  const errors = [];

  for (const session of sessions) {
    try {
      await pool.query(
        `INSERT INTO journeyman_players
         (name, email, session_id, game_type, score, guesses, time_elapsed,
          client_timestamp, browser_info, session_info, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
        [
          session.name?.trim(),
          session.email?.trim().toLowerCase(),
          session.sessionId || null,
          session.gameType || 'journeyman',
          session.score || 0,
          session.guesses || 0,
          session.timeElapsed || 0,
          session.clientTimestamp || new Date().toISOString(),
          JSON.stringify(session.browserInfo || {}),
          JSON.stringify(session.sessionInfo || {})
        ]
      );
      successful++;
    } catch (err) {
      console.error('Error in batch upload item:', err);
      failed++;
      errors.push(err.message);
    }
  }

  res.json({
    success: true,
    processed: sessions.length,
    successful,
    failed,
    errors: errors.length > 0 ? errors : undefined
  });
});

// Export analytics
router.post('/export-analytics', async (req, res) => {
  const { startDate, endDate, gameType } = req.body;

  try {
    const query = `
      SELECT * FROM journeyman_players
      WHERE created_at >= $1 AND created_at <= $2
      ${gameType ? 'AND game_type = $3' : ''}
      ORDER BY created_at DESC
    `;

    const params = gameType
      ? [startDate, endDate, gameType]
      : [startDate, endDate];

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
      startDate,
      endDate,
      gameType
    });
  } catch (err) {
    console.error('Error exporting analytics:', err);
    res.status(500).json({
      success: false,
      error: 'Error exporting analytics'
    });
  }
});

// Get leaderboard
router.get('/leaderboard', async (req, res) => {
  const { limit = 10, gameType } = req.query;

  try {
    const query = `
      SELECT name, score, guesses, time_elapsed, created_at
      FROM journeyman_players
      ${gameType ? 'WHERE game_type = $2' : ''}
      ORDER BY score DESC, time_elapsed ASC
      LIMIT $1
    `;

    const params = gameType
      ? [parseInt(limit), gameType]
      : [parseInt(limit)];

    const result = await pool.query(query, params);

    res.json({
      success: true,
      leaderboard: result.rows
    });
  } catch (err) {
    console.error('Error fetching leaderboard:', err);
    res.status(500).json({
      success: false,
      error: 'Error fetching leaderboard'
    });
  }
});

module.exports = router;
