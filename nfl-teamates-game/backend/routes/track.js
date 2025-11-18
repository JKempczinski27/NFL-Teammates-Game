/**
 * Comprehensive User Tracking Route
 * Handles all tracking events and saves them to PostgreSQL database
 */

const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

// Database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

/**
 * Main tracking endpoint
 * Accepts various event types and saves them to appropriate tables
 */
router.post('/', async (req, res) => {
  const client = await pool.connect();

  try {
    const { sessionId, eventType, eventData, timestamp, userAgent } = req.body;

    if (!sessionId || !eventType) {
      return res.status(400).json({ error: 'sessionId and eventType are required' });
    }

    // Ensure user session exists
    await ensureUserSession(client, sessionId, userAgent);

    // Route to appropriate handler based on event type
    switch (eventType) {
      case 'game_started':
        await handleGameStarted(client, sessionId, eventData, timestamp);
        break;

      case 'game_ended':
        await handleGameEnded(client, sessionId, eventData, timestamp);
        break;

      case 'question_started':
        await handleQuestionStarted(client, sessionId, eventData, timestamp);
        break;

      case 'answer_submitted':
        await handleAnswerSubmitted(client, sessionId, eventData, timestamp);
        break;

      case 'shared':
        await handleShared(client, sessionId, eventData, timestamp);
        break;

      case 'session_ping':
        await handleSessionPing(client, sessionId, timestamp);
        break;

      default:
        // Log unknown event types to engagement events
        await logEngagementEvent(client, sessionId, eventType, eventData, timestamp);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error tracking event:', error);
    res.status(500).json({ error: 'Failed to track event' });
  } finally {
    client.release();
  }
});

/**
 * Ensure user session exists in database
 */
async function ensureUserSession(client, sessionId, userAgent = null) {
  const query = `
    INSERT INTO user_sessions (session_id, user_agent, first_seen, last_seen)
    VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT (session_id)
    DO UPDATE SET
      last_seen = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP,
      total_sessions = user_sessions.total_sessions + 1
  `;
  await client.query(query, [sessionId, userAgent]);
}

/**
 * Handle game_started event
 */
async function handleGameStarted(client, sessionId, eventData, timestamp) {
  const { gameId, gameName } = eventData;

  const query = `
    INSERT INTO game_sessions (session_id, game_id, game_name, started_at)
    VALUES ($1, $2, $3, $4)
    RETURNING id
  `;

  const result = await client.query(query, [
    sessionId,
    gameId || 'common_player',
    gameName || 'Common Player Game',
    timestamp || new Date().toISOString(),
  ]);

  // Update user_sessions total games
  await client.query(
    'UPDATE user_sessions SET total_games_played = total_games_played + 1 WHERE session_id = $1',
    [sessionId]
  );

  return result.rows[0].id;
}

/**
 * Handle game_ended event
 */
async function handleGameEnded(client, sessionId, eventData, timestamp) {
  const { gameSessionId, gameId, durationSeconds, questionsAttempted, questionsCorrect } = eventData;

  const endTime = timestamp || new Date().toISOString();

  // Find the most recent game session if gameSessionId not provided
  let sessionIdToUpdate = gameSessionId;

  if (!sessionIdToUpdate) {
    const findQuery = `
      SELECT id FROM game_sessions
      WHERE session_id = $1 AND game_id = $2 AND ended_at IS NULL
      ORDER BY started_at DESC
      LIMIT 1
    `;
    const result = await client.query(findQuery, [sessionId, gameId || 'common_player']);

    if (result.rows.length > 0) {
      sessionIdToUpdate = result.rows[0].id;
    }
  }

  if (sessionIdToUpdate) {
    const updateQuery = `
      UPDATE game_sessions
      SET
        ended_at = $1,
        duration_seconds = $2,
        questions_attempted = $3,
        questions_correct = $4
      WHERE id = $5
    `;

    await client.query(updateQuery, [
      endTime,
      durationSeconds,
      questionsAttempted || 0,
      questionsCorrect || 0,
      sessionIdToUpdate,
    ]);

    // Update daily activity summary
    await updateDailyActivity(client, sessionId, gameId, durationSeconds, questionsAttempted, questionsCorrect);
  }
}

/**
 * Handle question_started event
 */
async function handleQuestionStarted(client, sessionId, eventData, timestamp) {
  // Store in engagement events for reference
  await logEngagementEvent(client, sessionId, 'question_started', eventData, timestamp);
}

/**
 * Handle answer_submitted event
 */
async function handleAnswerSubmitted(client, sessionId, eventData, timestamp) {
  const {
    gameId,
    gameSessionId,
    questionIndex,
    userAnswer,
    correctAnswer,
    isCorrect,
    attemptNumber,
    attemptsLeft,
    timeSpentSeconds,
  } = eventData;

  const query = `
    INSERT INTO question_attempts (
      session_id,
      game_session_id,
      game_id,
      question_index,
      user_answer,
      correct_answer,
      is_correct,
      attempt_number,
      attempts_remaining,
      time_spent_seconds,
      answered_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
  `;

  await client.query(query, [
    sessionId,
    gameSessionId || null,
    gameId || 'common_player',
    questionIndex,
    userAnswer,
    correctAnswer || null,
    isCorrect,
    attemptNumber || 1,
    attemptsLeft,
    timeSpentSeconds || null,
    timestamp || new Date().toISOString(),
  ]);

  // Update user_sessions stats
  await client.query(
    `UPDATE user_sessions SET
      total_questions_answered = total_questions_answered + 1,
      total_correct_answers = total_correct_answers + CASE WHEN $2 THEN 1 ELSE 0 END
     WHERE session_id = $1`,
    [sessionId, isCorrect]
  );
}

/**
 * Handle shared event
 */
async function handleShared(client, sessionId, eventData, timestamp) {
  await logEngagementEvent(client, sessionId, 'shared', eventData, timestamp);
}

/**
 * Handle session ping (periodic heartbeat)
 */
async function handleSessionPing(client, sessionId, timestamp) {
  await client.query(
    'UPDATE user_sessions SET last_seen = $1 WHERE session_id = $2',
    [timestamp || new Date().toISOString(), sessionId]
  );
}

/**
 * Log generic engagement event
 */
async function logEngagementEvent(client, sessionId, eventType, eventData, timestamp) {
  const query = `
    INSERT INTO user_engagement_events (session_id, event_type, event_data, event_timestamp)
    VALUES ($1, $2, $3, $4)
  `;

  await client.query(query, [
    sessionId,
    eventType,
    JSON.stringify(eventData),
    timestamp || new Date().toISOString(),
  ]);
}

/**
 * Update daily activity summary
 */
async function updateDailyActivity(client, sessionId, gameId, durationSeconds, questionsAnswered, correctAnswers) {
  const query = `
    INSERT INTO daily_activity_summary (
      session_id,
      activity_date,
      games_played,
      questions_answered,
      correct_answers,
      total_time_seconds,
      unique_games_played
    )
    VALUES ($1, CURRENT_DATE, 1, $2, $3, $4, ARRAY[$5]::TEXT[])
    ON CONFLICT (session_id, activity_date)
    DO UPDATE SET
      games_played = daily_activity_summary.games_played + 1,
      questions_answered = daily_activity_summary.questions_answered + $2,
      correct_answers = daily_activity_summary.correct_answers + $3,
      total_time_seconds = daily_activity_summary.total_time_seconds + $4,
      unique_games_played = array_append(
        CASE
          WHEN $5 = ANY(daily_activity_summary.unique_games_played)
          THEN daily_activity_summary.unique_games_played
          ELSE array_append(daily_activity_summary.unique_games_played, $5)
        END,
        NULL
      )
  `;

  await client.query(query, [
    sessionId,
    questionsAnswered || 0,
    correctAnswers || 0,
    durationSeconds || 0,
    gameId || 'common_player',
  ]);
}

/**
 * GET endpoint to check if tracking is working
 */
router.get('/', (req, res) => {
  res.json({
    status: 'operational',
    message: 'Comprehensive tracking endpoint is active',
    supportedEvents: [
      'game_started',
      'game_ended',
      'question_started',
      'answer_submitted',
      'shared',
      'session_ping',
    ],
  });
});

/**
 * GET endpoint for analytics (optional - for debugging)
 */
router.get('/analytics/:sessionId', async (req, res) => {
  const client = await pool.connect();

  try {
    const { sessionId } = req.params;

    // Get user summary
    const userQuery = 'SELECT * FROM user_engagement_summary WHERE session_id = $1';
    const userData = await client.query(userQuery, [sessionId]);

    // Get session diversity
    const diversityQuery = 'SELECT * FROM session_game_diversity WHERE session_id = $1';
    const diversityData = await client.query(diversityQuery, [sessionId]);

    // Get recent attempts
    const attemptsQuery = `
      SELECT * FROM question_attempts
      WHERE session_id = $1
      ORDER BY answered_at DESC
      LIMIT 20
    `;
    const attemptsData = await client.query(attemptsQuery, [sessionId]);

    res.json({
      user: userData.rows[0] || null,
      sessionDiversity: diversityData.rows,
      recentAttempts: attemptsData.rows,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  } finally {
    client.release();
  }
});

module.exports = router;
