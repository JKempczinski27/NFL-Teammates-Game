/**
 * Comprehensive User Tracking Route - CONSOLIDATED
 * Handles all tracking events for all three games and saves them to PostgreSQL database
 * - NFL Teammates Game
 * - Journeyman
 * - NFL Trivia Game
 */

const express = require('express');
const router = express.Router();
const pool = require('../config/database');

/**
 * Main tracking endpoint
 * Accepts various event types and saves them to appropriate tables
 */
router.post('/', async (req, res) => {
  const { eventType, eventData, sessionId, timestamp, gameType } = req.body;

  if (!eventType || !sessionId) {
    return res.status(400).json({ error: 'Missing required fields: eventType, sessionId' });
  }

  // Default to 'teammates' if gameType not specified for backward compatibility
  const game_type = gameType || 'teammates';

  const client = await pool.connect();

  try {
    // Always insert into main events table
    await client.query(
      'INSERT INTO events (session_id, game_type, event_type, event_data, timestamp) VALUES ($1, $2, $3, $4, $5)',
      [sessionId, game_type, eventType, eventData, timestamp || new Date()]
    );

    // Handle specific event types with specialized tables
    switch (eventType) {
      case 'session_start':
        await handleSessionStart(client, sessionId, eventData, game_type);
        break;

      case 'session_end':
        await handleSessionEnd(client, sessionId, eventData);
        break;

      case 'question_viewed':
        await handleQuestionViewed(client, sessionId, eventData);
        break;

      case 'answer_submitted':
        await handleAnswerSubmitted(client, sessionId, eventData, game_type);
        break;

      case 'shared':
        await handleShare(client, sessionId, eventData, game_type);
        break;

      case 'activity':
        await handleActivity(client, sessionId, eventData);
        break;

      case 'drop_off':
        await handleDropOff(client, sessionId, eventData);
        break;

      default:
        // Generic events are already stored in events table
        break;
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error tracking event:', error);
    res.status(500).json({ error: 'Failed to track event' });
  } finally {
    client.release();
  }
});

// Handler functions for specific event types
async function handleSessionStart(client, sessionId, eventData, gameType = 'teammates') {
  await client.query(
    `INSERT INTO user_sessions (session_id, game_type, started_at, last_activity_at)
     VALUES ($1, $2, NOW(), NOW())
     ON CONFLICT (session_id) DO UPDATE
     SET started_at = NOW(), last_activity_at = NOW()`,
    [sessionId, gameType]
  );
}

async function handleSessionEnd(client, sessionId, eventData) {
  const { completed, timeSpent } = eventData || {};

  await client.query(
    `UPDATE user_sessions
     SET ended_at = NOW(),
         completed = $2,
         total_time_spent = $3,
         last_activity_at = NOW()
     WHERE session_id = $1`,
    [sessionId, completed || false, timeSpent || 0]
  );
}

async function handleQuestionViewed(client, sessionId, eventData) {
  const { questionIndex } = eventData || {};

  await client.query(
    `INSERT INTO user_sessions (session_id, questions_viewed, last_activity_at)
     VALUES ($1, 1, NOW())
     ON CONFLICT (session_id) DO UPDATE
     SET questions_viewed = user_sessions.questions_viewed + 1,
         last_activity_at = NOW()`,
    [sessionId]
  );
}

async function handleAnswerSubmitted(client, sessionId, eventData, gameType = 'teammates') {
  const { questionIndex, userAnswer, isCorrect, attemptsLeft, timeToAnswer } = eventData || {};

  // Insert into question_analytics
  await client.query(
    `INSERT INTO question_analytics (session_id, game_type, question_index, is_correct, attempts_used, answer_given, time_to_answer)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [sessionId, gameType, questionIndex, isCorrect, 3 - (attemptsLeft || 0), userAnswer, timeToAnswer]
  );

  // Update session questions_answered count
  await client.query(
    `INSERT INTO user_sessions (session_id, questions_answered, last_activity_at)
     VALUES ($1, 1, NOW())
     ON CONFLICT (session_id) DO UPDATE
     SET questions_answered = user_sessions.questions_answered + 1,
         last_activity_at = NOW()`,
    [sessionId]
  );
}

async function handleShare(client, sessionId, eventData, gameType = 'teammates') {
  const { platform, questionIndex } = eventData || {};

  await client.query(
    'INSERT INTO share_analytics (session_id, game_type, platform, question_index) VALUES ($1, $2, $3, $4)',
    [sessionId, gameType, platform, questionIndex]
  );
}

async function handleActivity(client, sessionId, eventData) {
  await client.query(
    `INSERT INTO user_sessions (session_id, last_activity_at)
     VALUES ($1, NOW())
     ON CONFLICT (session_id) DO UPDATE
     SET last_activity_at = NOW()`,
    [sessionId]
  );
}

async function handleDropOff(client, sessionId, eventData) {
  const { questionIndex } = eventData || {};

  await client.query(
    `UPDATE user_sessions
     SET dropped_off_at_question = $2,
         last_activity_at = NOW()
     WHERE session_id = $1`,
    [sessionId, questionIndex]
  );
}

router.get('/', (req, res) => {
  res.json({
    status: 'operational',
    message: 'Comprehensive tracking endpoint is active for all games',
    supportedGames: ['teammates', 'journeyman', 'trivia'],
    supportedEvents: [
      'session_start',
      'session_end',
      'question_viewed',
      'answer_submitted',
      'shared',
      'activity',
      'drop_off'
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

    // Get session data
    const sessionQuery = 'SELECT * FROM user_sessions WHERE session_id = $1';
    const sessionData = await client.query(sessionQuery, [sessionId]);

    // Get question analytics
    const questionsQuery = `
      SELECT * FROM question_analytics
      WHERE session_id = $1
      ORDER BY timestamp DESC
    `;
    const questionsData = await client.query(questionsQuery, [sessionId]);

    // Get share data
    const sharesQuery = `
      SELECT * FROM share_analytics
      WHERE session_id = $1
      ORDER BY shared_at DESC
    `;
    const sharesData = await client.query(sharesQuery, [sessionId]);

    // Get all events
    const eventsQuery = `
      SELECT * FROM events
      WHERE session_id = $1
      ORDER BY timestamp DESC
      LIMIT 50
    `;
    const eventsData = await client.query(eventsQuery, [sessionId]);

    res.json({
      session: sessionData.rows[0] || null,
      questions: questionsData.rows,
      shares: sharesData.rows,
      events: eventsData.rows
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  } finally {
    client.release();
  }
});

module.exports = router;
