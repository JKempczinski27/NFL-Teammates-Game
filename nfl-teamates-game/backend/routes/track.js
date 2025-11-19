/**
 * Comprehensive User Tracking Route
 * Handles all tracking events and saves them to PostgreSQL database
 */

const express = require('express');
const { Pool } = require('pg');
const router = express.Router();
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

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
  const { eventType, eventData, sessionId, timestamp } = req.body;

  if (!eventType || !sessionId) {
    return res.status(400).json({ error: 'Missing required fields: eventType, sessionId' });
  }

  const client = await pool.connect();

  try {
    // Always insert into main events table
    await client.query(
      'INSERT INTO events (session_id, event_type, event_data, timestamp) VALUES ($1, $2, $3, $4)',
      [sessionId, eventType, eventData, timestamp || new Date()]
    );

    // Handle specific event types with specialized tables
    switch (eventType) {
      case 'session_start':
        await handleSessionStart(client, sessionId, eventData);
        break;

      case 'session_end':
        await handleSessionEnd(client, sessionId, eventData);
        break;

      case 'question_viewed':
        await handleQuestionViewed(client, sessionId, eventData);
        break;

      case 'answer_submitted':
        await handleAnswerSubmitted(client, sessionId, eventData);
        break;

      case 'shared':
        await handleShare(client, sessionId, eventData);
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
async function handleSessionStart(client, sessionId, eventData) {
  await client.query(
    `INSERT INTO user_sessions (session_id, started_at, last_activity_at)
     VALUES ($1, NOW(), NOW())
     ON CONFLICT (session_id) DO UPDATE
     SET started_at = NOW(), last_activity_at = NOW()`,
    [sessionId]
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

async function handleAnswerSubmitted(client, sessionId, eventData) {
  const { questionIndex, userAnswer, isCorrect, attemptsLeft, timeToAnswer } = eventData || {};

  // Insert into question_analytics
  await client.query(
    `INSERT INTO question_analytics (session_id, question_index, is_correct, attempts_used, answer_given, time_to_answer)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [sessionId, questionIndex, isCorrect, 3 - (attemptsLeft || 0), userAnswer, timeToAnswer]
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

async function handleShare(client, sessionId, eventData) {
  const { platform, questionIndex } = eventData || {};

  await client.query(
    'INSERT INTO share_analytics (session_id, platform, question_index) VALUES ($1, $2, $3)',
    [sessionId, platform, questionIndex]
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
