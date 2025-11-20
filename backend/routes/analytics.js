/**
 * Advanced Analytics Routes - CONSOLIDATED
 * Comprehensive analytics API for all three NFL games
 * Provides dashboards, metrics, trends, and insights
 */

const express = require('express');
const router = express.Router();

// Import pool from parent module
let pool;
try {
  pool = require('../index').pool;
} catch (err) {
  const { Pool } = require('pg');
  require('dotenv').config();
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
}

// ============================================
// DASHBOARD & OVERVIEW ENDPOINTS
// ============================================

/**
 * GET /api/analytics/dashboard
 * Main dashboard with key metrics across all games
 */
router.get('/dashboard', async (req, res) => {
  try {
    // Get materialized view data (fast!)
    const overview = await pool.query('SELECT * FROM mv_dashboard_stats ORDER BY game_type');

    // Get cross-game comparison
    const comparison = await pool.query('SELECT * FROM v_cross_game_comparison');

    // Get today's activity
    const today = await pool.query(`
      SELECT
        game_type,
        COUNT(*) as sessions_today,
        COUNT(*) FILTER (WHERE completed = true) as completions_today,
        ROUND(AVG(total_time_spent), 2) as avg_time_today
      FROM user_sessions
      WHERE DATE(started_at) = CURRENT_DATE
      GROUP BY game_type
    `);

    res.json({
      success: true,
      overview: overview.rows,
      comparison: comparison.rows,
      today: today.rows,
      last_updated: new Date()
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data', details: error.message });
  }
});

/**
 * GET /api/analytics/overview/:gameType
 * Detailed overview for a specific game
 */
router.get('/overview/:gameType', async (req, res) => {
  const { gameType } = req.params;

  try {
    const overview = await pool.query(
      'SELECT * FROM v_game_overview WHERE game_type = $1',
      [gameType]
    );

    if (overview.rows.length === 0) {
      return res.status(404).json({ error: 'Game type not found' });
    }

    res.json({
      success: true,
      gameType,
      overview: overview.rows[0]
    });
  } catch (error) {
    console.error('Error fetching game overview:', error);
    res.status(500).json({ error: 'Failed to fetch overview', details: error.message });
  }
});

// ============================================
// USER ENGAGEMENT & ACTIVITY
// ============================================

/**
 * GET /api/analytics/dau
 * Daily Active Users across all games
 */
router.get('/dau', async (req, res) => {
  const { gameType, days = 30 } = req.query;

  try {
    let query = 'SELECT * FROM v_daily_active_users WHERE date >= CURRENT_DATE - $1';
    const params = [days];

    if (gameType) {
      query += ' AND game_type = $2';
      params.push(gameType);
    }

    query += ' ORDER BY date DESC, game_type';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      period: `${days} days`,
      gameType: gameType || 'all',
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching DAU:', error);
    res.status(500).json({ error: 'Failed to fetch DAU data', details: error.message });
  }
});

/**
 * GET /api/analytics/wau
 * Weekly Active Users
 */
router.get('/wau', async (req, res) => {
  const { gameType } = req.query;

  try {
    let query = 'SELECT * FROM v_weekly_active_users';
    const params = [];

    if (gameType) {
      query += ' WHERE game_type = $1';
      params.push(gameType);
    }

    query += ' ORDER BY week DESC';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      gameType: gameType || 'all',
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching WAU:', error);
    res.status(500).json({ error: 'Failed to fetch WAU data', details: error.message });
  }
});

/**
 * GET /api/analytics/mau
 * Monthly Active Users
 */
router.get('/mau', async (req, res) => {
  const { gameType } = req.query;

  try {
    let query = 'SELECT * FROM v_monthly_active_users';
    const params = [];

    if (gameType) {
      query += ' WHERE game_type = $1';
      params.push(gameType);
    }

    query += ' ORDER BY month DESC';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      gameType: gameType || 'all',
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching MAU:', error);
    res.status(500).json({ error: 'Failed to fetch MAU data', details: error.message });
  }
});

/**
 * GET /api/analytics/engagement
 * User engagement levels breakdown
 */
router.get('/engagement', async (req, res) => {
  const { gameType } = req.query;

  try {
    let query = 'SELECT * FROM v_user_engagement';
    const params = [];

    if (gameType) {
      query += ' WHERE game_type = $1';
      params.push(gameType);
    }

    query += ' ORDER BY session_count DESC';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      gameType: gameType || 'all',
      engagement_levels: result.rows
    });
  } catch (error) {
    console.error('Error fetching engagement:', error);
    res.status(500).json({ error: 'Failed to fetch engagement data', details: error.message });
  }
});

// ============================================
// QUESTION & GAME PERFORMANCE
// ============================================

/**
 * GET /api/analytics/question-performance
 * Question-by-question performance analysis
 */
router.get('/question-performance', async (req, res) => {
  const { gameType } = req.query;

  try {
    let query = 'SELECT * FROM v_question_performance';
    const params = [];

    if (gameType) {
      query += ' WHERE game_type = $1';
      params.push(gameType);
    }

    query += ' ORDER BY question_index';

    const result = await pool.query(query, params);

    // Calculate summary stats
    const summary = {
      total_questions: result.rows.length,
      avg_success_rate: result.rows.reduce((sum, q) => sum + parseFloat(q.success_rate), 0) / result.rows.length,
      easiest: result.rows.reduce((max, q) => parseFloat(q.success_rate) > parseFloat(max.success_rate) ? q : max, result.rows[0]),
      hardest: result.rows.reduce((min, q) => parseFloat(q.success_rate) < parseFloat(min.success_rate) ? q : min, result.rows[0])
    };

    res.json({
      success: true,
      gameType: gameType || 'all',
      questions: result.rows,
      summary
    });
  } catch (error) {
    console.error('Error fetching question performance:', error);
    res.status(500).json({ error: 'Failed to fetch question performance', details: error.message });
  }
});

/**
 * GET /api/analytics/question/:gameType/:questionIndex
 * Detailed analytics for a specific question
 */
router.get('/question/:gameType/:questionIndex', async (req, res) => {
  const { gameType, questionIndex } = req.params;

  try {
    const performance = await pool.query(
      'SELECT * FROM v_question_performance WHERE game_type = $1 AND question_index = $2',
      [gameType, questionIndex]
    );

    if (performance.rows.length === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Get answer distribution
    const answers = await pool.query(`
      SELECT
        answer_given,
        COUNT(*) as count,
        COUNT(*) FILTER (WHERE is_correct = true) as correct_count,
        ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as percentage
      FROM question_analytics
      WHERE game_type = $1 AND question_index = $2
      GROUP BY answer_given
      ORDER BY count DESC
    `, [gameType, questionIndex]);

    res.json({
      success: true,
      gameType,
      questionIndex: parseInt(questionIndex),
      performance: performance.rows[0],
      answer_distribution: answers.rows
    });
  } catch (error) {
    console.error('Error fetching question details:', error);
    res.status(500).json({ error: 'Failed to fetch question details', details: error.message });
  }
});

// ============================================
// SHARING & SOCIAL ANALYTICS
// ============================================

/**
 * GET /api/analytics/share-analytics
 * Share platform effectiveness and trends
 */
router.get('/share-analytics', async (req, res) => {
  const { gameType } = req.query;

  try {
    let query = 'SELECT * FROM v_share_effectiveness';
    const params = [];

    if (gameType) {
      query += ' WHERE game_type = $1';
      params.push(gameType);
    }

    query += ' ORDER BY total_shares DESC';

    const result = await pool.query(query, params);

    // Get recent share timeline
    const timeline = await pool.query(`
      SELECT
        DATE(shared_at) as date,
        game_type,
        platform,
        COUNT(*) as shares
      FROM share_analytics
      WHERE shared_at >= CURRENT_DATE - 30
      ${gameType ? 'AND game_type = $1' : ''}
      GROUP BY DATE(shared_at), game_type, platform
      ORDER BY date DESC
      LIMIT 100
    `, gameType ? [gameType] : []);

    res.json({
      success: true,
      gameType: gameType || 'all',
      platforms: result.rows,
      timeline: timeline.rows
    });
  } catch (error) {
    console.error('Error fetching share analytics:', error);
    res.status(500).json({ error: 'Failed to fetch share analytics', details: error.message });
  }
});

// ============================================
// TIME & PATTERN ANALYSIS
// ============================================

/**
 * GET /api/analytics/hourly-patterns
 * Activity patterns by hour of day
 */
router.get('/hourly-patterns', async (req, res) => {
  const { gameType } = req.query;

  try {
    let query = 'SELECT * FROM v_hourly_patterns';
    const params = [];

    if (gameType) {
      query += ' WHERE game_type = $1';
      params.push(gameType);
    }

    query += ' ORDER BY hour_of_day';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      gameType: gameType || 'all',
      patterns: result.rows
    });
  } catch (error) {
    console.error('Error fetching hourly patterns:', error);
    res.status(500).json({ error: 'Failed to fetch hourly patterns', details: error.message });
  }
});

/**
 * GET /api/analytics/weekly-patterns
 * Activity patterns by day of week
 */
router.get('/weekly-patterns', async (req, res) => {
  const { gameType } = req.query;

  try {
    let query = 'SELECT * FROM v_weekly_patterns';
    const params = [];

    if (gameType) {
      query += ' WHERE game_type = $1';
      params.push(gameType);
    }

    query += ' ORDER BY day_number';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      gameType: gameType || 'all',
      patterns: result.rows
    });
  } catch (error) {
    console.error('Error fetching weekly patterns:', error);
    res.status(500).json({ error: 'Failed to fetch weekly patterns', details: error.message });
  }
});

/**
 * GET /api/analytics/session-duration
 * Session duration distribution
 */
router.get('/session-duration', async (req, res) => {
  const { gameType } = req.query;

  try {
    let query = 'SELECT * FROM v_session_duration_distribution';
    const params = [];

    if (gameType) {
      query += ' WHERE game_type = $1';
      params.push(gameType);
    }

    const result = await pool.query(query, params);

    res.json({
      success: true,
      gameType: gameType || 'all',
      distribution: result.rows
    });
  } catch (error) {
    console.error('Error fetching session duration:', error);
    res.status(500).json({ error: 'Failed to fetch session duration', details: error.message });
  }
});

// ============================================
// DROPOUT & RETENTION ANALYSIS
// ============================================

/**
 * GET /api/analytics/dropout-analysis
 * Where and why users drop off
 */
router.get('/dropout-analysis', async (req, res) => {
  const { gameType } = req.query;

  try {
    let query = 'SELECT * FROM v_dropout_analysis';
    const params = [];

    if (gameType) {
      query += ' WHERE game_type = $1';
      params.push(gameType);
    }

    query += ' ORDER BY dropout_count DESC';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      gameType: gameType || 'all',
      dropout_points: result.rows
    });
  } catch (error) {
    console.error('Error fetching dropout analysis:', error);
    res.status(500).json({ error: 'Failed to fetch dropout analysis', details: error.message });
  }
});

/**
 * GET /api/analytics/retention
 * 7-day retention rates
 */
router.get('/retention', async (req, res) => {
  const { gameType, days = 30 } = req.query;

  try {
    let query = 'SELECT * FROM v_player_retention_7d WHERE cohort_date >= CURRENT_DATE - $1';
    const params = [days];

    if (gameType) {
      query += ' AND game_type = $2';
      params.push(gameType);
    }

    query += ' ORDER BY cohort_date DESC';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      period: `${days} days`,
      gameType: gameType || 'all',
      cohorts: result.rows
    });
  } catch (error) {
    console.error('Error fetching retention:', error);
    res.status(500).json({ error: 'Failed to fetch retention data', details: error.message });
  }
});

// ============================================
// LEADERBOARDS & RANKINGS
// ============================================

/**
 * GET /api/analytics/leaderboard/:gameType
 * Game-specific leaderboard
 */
router.get('/leaderboard/:gameType', async (req, res) => {
  const { gameType } = req.params;
  const { limit = 100 } = req.query;

  try {
    const result = await pool.query(
      'SELECT * FROM v_leaderboard WHERE game_type = $1 LIMIT $2',
      [gameType, limit]
    );

    res.json({
      success: true,
      gameType,
      leaderboard: result.rows
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard', details: error.message });
  }
});

// ============================================
// EVENT TRACKING & TRENDS
// ============================================

/**
 * GET /api/analytics/events
 * Event type distribution and trends
 */
router.get('/events', async (req, res) => {
  const { gameType, days = 30 } = req.query;

  try {
    let query = 'SELECT * FROM v_event_distribution';
    const params = [];

    if (gameType) {
      query += ' WHERE game_type = $1';
      params.push(gameType);
    }

    const result = await pool.query(query, params);

    res.json({
      success: true,
      period: `${days} days`,
      gameType: gameType || 'all',
      events: result.rows
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch event data', details: error.message });
  }
});

// ============================================
// SESSION DETAILS
// ============================================

/**
 * GET /api/analytics/session/:sessionId
 * Detailed analytics for a specific session
 */
router.get('/session/:sessionId', async (req, res) => {
  const { sessionId } = req.params;

  try {
    const session = await pool.query(
      'SELECT * FROM user_sessions WHERE session_id = $1',
      [sessionId]
    );

    if (session.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const [events, questions, shares] = await Promise.all([
      pool.query('SELECT * FROM events WHERE session_id = $1 ORDER BY timestamp', [sessionId]),
      pool.query('SELECT * FROM question_analytics WHERE session_id = $1 ORDER BY timestamp', [sessionId]),
      pool.query('SELECT * FROM share_analytics WHERE session_id = $1 ORDER BY shared_at', [sessionId])
    ]);

    res.json({
      success: true,
      session: session.rows[0],
      events: events.rows,
      questions: questions.rows,
      shares: shares.rows
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ error: 'Failed to fetch session data', details: error.message });
  }
});

// ============================================
// ADMIN & MAINTENANCE
// ============================================

/**
 * POST /api/analytics/refresh
 * Manually refresh materialized views (admin only)
 */
router.post('/refresh', async (req, res) => {
  // TODO: Add admin authentication middleware

  try {
    await pool.query('SELECT refresh_analytics_views()');

    res.json({
      success: true,
      message: 'Analytics views refreshed successfully',
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error refreshing views:', error);
    res.status(500).json({ error: 'Failed to refresh views', details: error.message });
  }
});

/**
 * POST /api/analytics/calculate-daily/:date
 * Calculate daily metrics for a specific date (admin only)
 */
router.post('/calculate-daily/:date', async (req, res) => {
  const { date } = req.params;
  const { gameType } = req.query;

  try {
    if (gameType) {
      await pool.query('SELECT calculate_daily_metrics($1, $2)', [date, gameType]);
    } else {
      // Calculate for all game types
      const games = await pool.query('SELECT DISTINCT game_type FROM user_sessions');
      for (const game of games.rows) {
        await pool.query('SELECT calculate_daily_metrics($1, $2)', [date, game.game_type]);
      }
    }

    res.json({
      success: true,
      message: 'Daily metrics calculated successfully',
      date,
      gameType: gameType || 'all'
    });
  } catch (error) {
    console.error('Error calculating daily metrics:', error);
    res.status(500).json({ error: 'Failed to calculate metrics', details: error.message });
  }
});

// ============================================
// EXPORT ENDPOINTS
// ============================================

/**
 * GET /api/analytics/export/:gameType
 * Export analytics data as CSV
 */
router.get('/export/:gameType', async (req, res) => {
  const { gameType } = req.params;
  const { type = 'sessions' } = req.query;

  try {
    let query;
    let filename;

    switch (type) {
      case 'sessions':
        query = 'SELECT * FROM user_sessions WHERE game_type = $1 ORDER BY started_at DESC';
        filename = `${gameType}_sessions.csv`;
        break;
      case 'questions':
        query = 'SELECT * FROM question_analytics WHERE game_type = $1 ORDER BY timestamp DESC';
        filename = `${gameType}_questions.csv`;
        break;
      case 'shares':
        query = 'SELECT * FROM share_analytics WHERE game_type = $1 ORDER BY shared_at DESC';
        filename = `${gameType}_shares.csv`;
        break;
      default:
        return res.status(400).json({ error: 'Invalid export type' });
    }

    const result = await pool.query(query, [gameType]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No data to export' });
    }

    // Convert to CSV
    const headers = Object.keys(result.rows[0]).join(',');
    const rows = result.rows.map(row => Object.values(row).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({ error: 'Failed to export data', details: error.message });
  }
});

module.exports = router;
