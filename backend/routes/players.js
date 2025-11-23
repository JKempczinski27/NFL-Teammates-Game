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
 * Add a new player or update existing player data
 * Body: { name, email, gameType (optional), sessionId (optional), favoriteTeam (optional), metadata (optional) }
 */
router.post('/', async (req, res) => {
  const { name, email, gameType, sessionId, favoriteTeam, metadata } = req.body;

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

  const game_type = gameType || 'teammates';

  try {
    // Use INSERT ... ON CONFLICT to update existing player or create new one
    const result = await pool.query(
      `INSERT INTO players (
        name, email, game_type, games_played, session_id,
        favorite_team, total_sessions, last_activity_at, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, 1, CURRENT_TIMESTAMP, $7)
      ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        game_type = EXCLUDED.game_type,
        games_played = CASE
          WHEN players.games_played @> ARRAY[$3] THEN players.games_played
          ELSE array_append(players.games_played, $3)
        END,
        session_id = COALESCE(EXCLUDED.session_id, players.session_id),
        favorite_team = COALESCE(EXCLUDED.favorite_team, players.favorite_team),
        total_sessions = players.total_sessions + 1,
        last_activity_at = CURRENT_TIMESTAMP,
        metadata = COALESCE(players.metadata, '{}'::jsonb) || COALESCE(EXCLUDED.metadata, '{}'::jsonb),
        updated_at = CURRENT_TIMESTAMP
      RETURNING *`,
      [
        name.trim(),
        email.trim().toLowerCase(),
        game_type,
        [game_type],
        sessionId || null,
        favoriteTeam || null,
        metadata ? JSON.stringify(metadata) : null
      ]
    );

    res.status(201).json({
      success: true,
      player: result.rows[0]
    });
  } catch (err) {
    console.error('Error saving player:', err);
    res.status(500).json({ error: 'Error saving player. Please try again.' });
  }
});

/**
 * GET /api/players
 * Get all players (for admin/analytics)
 * Query params: limit (default 100), gameType (filter by game)
 */
router.get('/', async (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  const gameType = req.query.gameType;

  try {
    let query = `
      SELECT
        id, name, email, game_type, games_played, favorite_team,
        total_sessions, total_questions_answered, completion_rate,
        last_activity_at, created_at
      FROM players
    `;
    const params = [];

    if (gameType) {
      query += ` WHERE $1 = ANY(games_played)`;
      params.push(gameType);
      query += ` ORDER BY last_activity_at DESC LIMIT $2`;
      params.push(limit);
    } else {
      query += ` ORDER BY last_activity_at DESC LIMIT $1`;
      params.push(limit);
    }

    const result = await pool.query(query, params);

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
 * Get player by email with full statistics
 */
router.get('/:email', async (req, res) => {
  const { email } = req.params;

  try {
    const result = await pool.query(
      `SELECT
        id, name, email, session_id, game_type, games_played,
        favorite_team, trivia_score, trivia_best_score, trivia_games_played,
        journeyman_correct_count, journeyman_best_correct, journeyman_games_played,
        teammates_games_played, teammates_best_score, teammates_completion_count,
        total_sessions, total_questions_viewed, total_questions_answered,
        total_correct_answers, total_wrong_answers, total_time_spent_seconds,
        total_shares, completion_rate, avg_questions_per_session,
        best_streak, current_streak, last_activity_at, last_game_played_at,
        created_at, metadata
      FROM players WHERE email = $1`,
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
 * Update player information and statistics
 * Body can include: name, favoriteTeam, gameType, score data, session data, etc.
 */
router.put('/:email', async (req, res) => {
  const { email } = req.params;
  const {
    name,
    favoriteTeam,
    gameType,
    triviaScore,
    journeymanCorrectCount,
    journeymanDurationSeconds,
    sessionData,
    metadata
  } = req.body;

  try {
    // Build dynamic update query based on provided fields
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (favoriteTeam !== undefined) {
      updates.push(`favorite_team = $${paramCount++}`);
      values.push(favoriteTeam);
    }
    if (gameType) {
      updates.push(`game_type = $${paramCount++}`);
      values.push(gameType);
    }
    if (triviaScore !== undefined) {
      updates.push(`trivia_score = $${paramCount++}`);
      updates.push(`trivia_best_score = GREATEST(trivia_best_score, $${paramCount - 1})`);
      updates.push(`trivia_games_played = trivia_games_played + 1`);
      values.push(triviaScore);
    }
    if (journeymanCorrectCount !== undefined) {
      updates.push(`journeyman_correct_count = $${paramCount++}`);
      updates.push(`journeyman_best_correct = GREATEST(journeyman_best_correct, $${paramCount - 1})`);
      values.push(journeymanCorrectCount);
    }
    if (journeymanDurationSeconds !== undefined) {
      updates.push(`journeyman_duration_seconds = $${paramCount++}`);
      updates.push(`journeyman_best_time = CASE WHEN journeyman_best_time IS NULL THEN $${paramCount - 1} ELSE LEAST(journeyman_best_time, $${paramCount - 1}) END`);
      updates.push(`journeyman_games_played = journeyman_games_played + 1`);
      values.push(journeymanDurationSeconds);
    }
    if (sessionData) {
      if (sessionData.questionsAnswered !== undefined) {
        updates.push(`total_questions_answered = total_questions_answered + $${paramCount++}`);
        values.push(sessionData.questionsAnswered);
      }
      if (sessionData.timeSpent !== undefined) {
        updates.push(`total_time_spent_seconds = total_time_spent_seconds + $${paramCount++}`);
        values.push(sessionData.timeSpent);
      }
    }
    if (metadata) {
      updates.push(`metadata = COALESCE(metadata, '{}'::jsonb) || $${paramCount++}::jsonb`);
      values.push(JSON.stringify(metadata));
    }

    // Always update timestamp and last activity
    updates.push('updated_at = CURRENT_TIMESTAMP');
    updates.push('last_activity_at = CURRENT_TIMESTAMP');
    updates.push('last_game_played_at = CURRENT_TIMESTAMP');

    if (updates.length === 3) {
      // Only timestamp updates, nothing else to update
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    values.push(email.toLowerCase());

    const query = `
      UPDATE players
      SET ${updates.join(', ')}
      WHERE email = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // Calculate player statistics after update
    await pool.query('SELECT calculate_player_stats($1)', [email.toLowerCase()]);

    res.json({
      success: true,
      player: result.rows[0]
    });
  } catch (err) {
    console.error('Error updating player:', err);
    res.status(500).json({ error: 'Error updating player' });
  }
});

/**
 * GET /api/players/leaderboard/:gameType
 * Get leaderboard for a specific game type
 */
router.get('/leaderboard/:gameType', async (req, res) => {
  const { gameType } = req.params;
  const limit = parseInt(req.query.limit) || 10;

  try {
    let query;
    if (gameType === 'trivia') {
      query = `SELECT * FROM v_trivia_leaderboard LIMIT $1`;
    } else if (gameType === 'journeyman') {
      query = `SELECT * FROM v_journeyman_leaderboard LIMIT $1`;
    } else {
      query = `SELECT * FROM v_most_engaged_players LIMIT $1`;
    }

    const result = await pool.query(query, [limit]);

    res.json({
      success: true,
      gameType,
      count: result.rows.length,
      leaderboard: result.rows
    });
  } catch (err) {
    console.error('Error fetching leaderboard:', err);
    res.status(500).json({ error: 'Error fetching leaderboard' });
  }
});

module.exports = router;
