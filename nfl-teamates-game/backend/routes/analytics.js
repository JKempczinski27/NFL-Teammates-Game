const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Get question difficulty vs success rate
router.get('/question-difficulty', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        question_index,
        COUNT(*) as total_attempts,
        SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct_answers,
        ROUND(
          (SUM(CASE WHEN is_correct THEN 1 ELSE 0 END)::DECIMAL / COUNT(*)) * 100,
          2
        ) as success_rate_percentage,
        ROUND(AVG(attempts_used), 2) as avg_attempts_needed,
        ROUND(AVG(time_to_answer), 2) as avg_time_seconds
      FROM question_analytics
      GROUP BY question_index
      ORDER BY question_index
    `);

    res.json({
      success: true,
      data: result.rows,
      summary: {
        total_questions: result.rows.length,
        easiest_question: result.rows.reduce((prev, current) =>
          (prev.success_rate_percentage > current.success_rate_percentage) ? prev : current
        ),
        hardest_question: result.rows.reduce((prev, current) =>
          (prev.success_rate_percentage < current.success_rate_percentage) ? prev : current
        )
      }
    });
  } catch (error) {
    console.error('Error fetching question difficulty:', error);
    res.status(500).json({ error: 'Failed to fetch question difficulty data' });
  }
});

// Get user engagement metrics
router.get('/engagement', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) as total_sessions,
        COUNT(CASE WHEN completed THEN 1 END) as completed_sessions,
        ROUND(
          (COUNT(CASE WHEN completed THEN 1 END)::DECIMAL / COUNT(*)) * 100,
          2
        ) as completion_rate_percentage,
        ROUND(AVG(total_time_spent), 2) as avg_time_spent_seconds,
        ROUND(AVG(questions_viewed), 2) as avg_questions_viewed,
        ROUND(AVG(questions_answered), 2) as avg_questions_answered,
        MODE() WITHIN GROUP (ORDER BY dropped_off_at_question) as most_common_drop_off_question
      FROM user_sessions
      WHERE started_at IS NOT NULL
    `);

    const dropOffByQuestion = await pool.query(`
      SELECT
        dropped_off_at_question as question_index,
        COUNT(*) as drop_off_count
      FROM user_sessions
      WHERE dropped_off_at_question IS NOT NULL
      GROUP BY dropped_off_at_question
      ORDER BY drop_off_count DESC
    `);

    const timeDistribution = await pool.query(`
      SELECT
        CASE
          WHEN total_time_spent < 60 THEN '0-1 min'
          WHEN total_time_spent < 180 THEN '1-3 min'
          WHEN total_time_spent < 300 THEN '3-5 min'
          WHEN total_time_spent < 600 THEN '5-10 min'
          ELSE '10+ min'
        END as time_range,
        COUNT(*) as session_count
      FROM user_sessions
      WHERE total_time_spent > 0
      GROUP BY time_range
      ORDER BY
        CASE time_range
          WHEN '0-1 min' THEN 1
          WHEN '1-3 min' THEN 2
          WHEN '3-5 min' THEN 3
          WHEN '5-10 min' THEN 4
          WHEN '10+ min' THEN 5
        END
    `);

    res.json({
      success: true,
      overview: result.rows[0],
      drop_off_points: dropOffByQuestion.rows,
      time_distribution: timeDistribution.rows
    });
  } catch (error) {
    console.error('Error fetching engagement metrics:', error);
    res.status(500).json({ error: 'Failed to fetch engagement metrics' });
  }
});

// Get popular share methods
router.get('/share-analytics', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        platform,
        COUNT(*) as share_count,
        ROUND(
          (COUNT(*)::DECIMAL / (SELECT COUNT(*) FROM share_analytics)) * 100,
          2
        ) as percentage
      FROM share_analytics
      GROUP BY platform
      ORDER BY share_count DESC
    `);

    const sharesByQuestion = await pool.query(`
      SELECT
        question_index,
        platform,
        COUNT(*) as share_count
      FROM share_analytics
      WHERE question_index IS NOT NULL
      GROUP BY question_index, platform
      ORDER BY question_index, share_count DESC
    `);

    const shareTimeline = await pool.query(`
      SELECT
        DATE(shared_at) as date,
        platform,
        COUNT(*) as shares
      FROM share_analytics
      WHERE shared_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(shared_at), platform
      ORDER BY date DESC, shares DESC
      LIMIT 100
    `);

    res.json({
      success: true,
      platform_totals: result.rows,
      shares_by_question: sharesByQuestion.rows,
      recent_timeline: shareTimeline.rows,
      summary: {
        total_shares: result.rows.reduce((sum, row) => sum + parseInt(row.share_count), 0),
        most_popular_platform: result.rows[0]?.platform || 'N/A',
        platforms_used: result.rows.length
      }
    });
  } catch (error) {
    console.error('Error fetching share analytics:', error);
    res.status(500).json({ error: 'Failed to fetch share analytics' });
  }
});

// Get all events for a specific session
router.get('/session/:sessionId', async (req, res) => {
  const { sessionId } = req.params;

  try {
    const events = await pool.query(
      `SELECT * FROM events WHERE session_id = $1 ORDER BY timestamp`,
      [sessionId]
    );

    const sessionInfo = await pool.query(
      `SELECT * FROM user_sessions WHERE session_id = $1`,
      [sessionId]
    );

    const questionData = await pool.query(
      `SELECT * FROM question_analytics WHERE session_id = $1 ORDER BY timestamp`,
      [sessionId]
    );

    const shareData = await pool.query(
      `SELECT * FROM share_analytics WHERE session_id = $1 ORDER BY shared_at`,
      [sessionId]
    );

    res.json({
      success: true,
      session: sessionInfo.rows[0] || null,
      events: events.rows,
      questions: questionData.rows,
      shares: shareData.rows
    });
  } catch (error) {
    console.error('Error fetching session data:', error);
    res.status(500).json({ error: 'Failed to fetch session data' });
  }
});

// Get overall statistics dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM events) as total_events,
        (SELECT COUNT(DISTINCT session_id) FROM events) as unique_sessions,
        (SELECT COUNT(*) FROM question_analytics) as total_answers,
        (SELECT COUNT(*) FROM share_analytics) as total_shares,
        (SELECT COUNT(*) FROM user_sessions WHERE completed = true) as completed_sessions,
        (SELECT ROUND(AVG(total_time_spent), 2) FROM user_sessions WHERE total_time_spent > 0) as avg_session_duration
    `);

    const recentActivity = await pool.query(`
      SELECT
        event_type,
        COUNT(*) as count,
        MAX(timestamp) as last_occurrence
      FROM events
      WHERE timestamp >= NOW() - INTERVAL '24 hours'
      GROUP BY event_type
      ORDER BY count DESC
    `);

    res.json({
      success: true,
      overview: stats.rows[0],
      recent_activity: recentActivity.rows
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

module.exports = router;
