const express = require('express');
const router = express.Router();

// Input validation helper
const validatePlayerData = (data) => {
  const errors = [];

  if (!data) {
    return { valid: false, error: 'Request body required' };
  }

  const name = data.name?.trim();
  const email = data.email?.trim();

  // Validate name
  if (!name || name.length === 0) {
    errors.push('Name is required');
  }
  if (name && name.length > 100) {
    errors.push('Name too long');
  }

  // Validate email
  if (!email || email.length === 0) {
    errors.push('Email is required');
  }
  if (email && (!email.includes('@') || !email.split('@')[1]?.includes('.'))) {
    errors.push('Invalid email format');
  }

  // Basic injection detection
  const dangerousPatterns = [
    '<script', 'javascript:', 'DROP TABLE', 'UNION SELECT', '--', '; SELECT',
    '<?php', '${', '$(', '`', 'eval(', 'exec('
  ];

  for (const pattern of dangerousPatterns) {
    if (name?.toLowerCase().includes(pattern.toLowerCase()) ||
        email?.toLowerCase().includes(pattern.toLowerCase())) {
      errors.push('Invalid input detected');
      break;
    }
  }

  // Validate numeric fields if present
  const correctCount = data.correctCount;
  if (correctCount !== undefined && correctCount !== null) {
    if (typeof correctCount !== 'number' || correctCount < 0 || correctCount > 100) {
      errors.push('Invalid score value');
    }
  }

  const duration = data.durationInSeconds;
  if (duration !== undefined && duration !== null) {
    if (typeof duration !== 'number' || duration <= 0 || duration > 3600) {
      errors.push('Invalid duration value');
    }
  }

  return errors.length > 0
    ? { valid: false, error: errors.join(', ') }
    : { valid: true, name, email };
};

// POST endpoint to save Journeyman player data
router.post('/save-player', async (req, res) => {
  const pool = req.app.get('pool');

  const validation = validatePlayerData(req.body);
  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      error: validation.error
    });
  }

  const { name, email } = validation;
  const { correctCount, durationInSeconds, gameData } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO journeyman_players
       (name, email, correct_count, duration_seconds, game_data)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        name,
        email,
        correctCount || 0,
        durationInSeconds || 0,
        gameData ? JSON.stringify(gameData) : null
      ]
    );

    res.status(200).json({
      success: true,
      message: 'Player data saved',
      player: {
        id: result.rows[0].id,
        name: result.rows[0].name,
        email: result.rows[0].email,
        correctCount: result.rows[0].correct_count,
        durationInSeconds: result.rows[0].duration_seconds
      }
    });
  } catch (err) {
    console.error('Error saving Journeyman player:', err);
    res.status(500).json({
      success: false,
      error: 'Database error saving player data'
    });
  }
});

// GET endpoint for Journeyman analytics
router.get('/analytics', async (req, res) => {
  const pool = req.app.get('pool');

  // Check for API key (basic security)
  const apiKey = req.headers['x-api-key'] || req.headers['authorization'];
  const expectedKey = process.env.ADMIN_TOKEN || process.env.API_KEY;

  if (!apiKey || apiKey.replace('Bearer ', '') !== expectedKey) {
    return res.status(401).json({
      success: false,
      error: 'API key required'
    });
  }

  try {
    const stats = await pool.query(`
      SELECT
        COUNT(*) as total_players,
        AVG(correct_count) as average_score,
        MAX(correct_count) as highest_score,
        AVG(duration_seconds) as average_duration
      FROM journeyman_players
    `);

    const recentPlayers = await pool.query(`
      SELECT name, correct_count, duration_seconds, created_at
      FROM journeyman_players
      ORDER BY created_at DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      analytics: {
        totalPlayers: parseInt(stats.rows[0].total_players),
        averageScore: parseFloat(stats.rows[0].average_score) || 0,
        highestScore: parseInt(stats.rows[0].highest_score) || 0,
        averageDuration: parseFloat(stats.rows[0].average_duration) || 0,
        recentPlayers: recentPlayers.rows
      }
    });
  } catch (err) {
    console.error('Error fetching Journeyman analytics:', err);
    res.status(500).json({
      success: false,
      error: 'Database error fetching analytics'
    });
  }
});

// GET endpoint for Journeyman leaderboard
router.get('/leaderboard', async (req, res) => {
  const pool = req.app.get('pool');
  const limit = parseInt(req.query.limit) || 10;

  try {
    const result = await pool.query(
      `SELECT name, correct_count, duration_seconds, created_at
       FROM journeyman_players
       ORDER BY correct_count DESC, duration_seconds ASC
       LIMIT $1`,
      [limit]
    );

    res.json({
      success: true,
      leaderboard: result.rows
    });
  } catch (err) {
    console.error('Error fetching Journeyman leaderboard:', err);
    res.status(500).json({
      success: false,
      error: 'Database error fetching leaderboard'
    });
  }
});

module.exports = router;
