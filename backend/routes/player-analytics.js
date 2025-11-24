/**
 * Player Analytics API Routes
 * Comprehensive analytics endpoints based on the single players table
 * Provides insights into player behavior, engagement, performance, and trends
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
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
  });
}

// ============================================
// DASHBOARD & OVERVIEW
// ============================================

/**
 * GET /api/player-analytics/dashboard
 * Main analytics dashboard with key metrics
 */
router.get('/dashboard', async (req, res) => {
  try {
    const dashboard = await pool.query('SELECT * FROM mv_analytics_dashboard');
    const gameStats = await pool.query('SELECT * FROM mv_game_performance ORDER BY players DESC');
    const platformStats = await pool.query('SELECT * FROM v_platform_statistics');
    const segmentDist = await pool.query('SELECT * FROM get_player_segment_distribution()');

    res.json({
      success: true,
      dashboard: dashboard.rows[0] || {},
      games: gameStats.rows,
      platform: platformStats.rows[0] || {},
      segments: segmentDist.rows,
      last_updated: new Date()
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard',
      details: error.message
    });
  }
});

/**
 * GET /api/player-analytics/overview
 * Overall platform statistics
 */
router.get('/overview', async (req, res) => {
  try {
    const platformStats = await pool.query('SELECT * FROM v_platform_statistics');
    const gameStats = await pool.query('SELECT * FROM v_game_statistics');
    const recentTrends = await pool.query(`
      SELECT * FROM v_daily_player_trends
      ORDER BY activity_date DESC
      LIMIT 30
    `);

    res.json({
      success: true,
      platform: platformStats.rows[0],
      games: gameStats.rows,
      trends: recentTrends.rows
    });
  } catch (error) {
    console.error('Error fetching overview:', error);
    res.status(500).json({ error: 'Failed to fetch overview', details: error.message });
  }
});

// ============================================
// PLAYER PERFORMANCE & ENGAGEMENT
// ============================================

/**
 * GET /api/player-analytics/performance
 * Player performance summary with filtering
 */
router.get('/performance', async (req, res) => {
  const { gameType, limit = 100, minSessions = 1, sortBy = 'accuracy_rate' } = req.query;

  try {
    let query = `
      SELECT * FROM v_player_performance_summary
      WHERE total_sessions >= $1
    `;
    const params = [minSessions];

    if (gameType) {
      query += ` AND game_type = $${params.length + 1}`;
      params.push(gameType);
    }

    // Validate and sanitize sortBy
    const validSortFields = [
      'accuracy_rate', 'completion_rate', 'total_sessions',
      'total_questions_answered', 'avg_session_duration', 'best_streak'
    ];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'accuracy_rate';

    query += ` ORDER BY ${sortField} DESC NULLS LAST LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      count: result.rows.length,
      filters: { gameType, minSessions, sortBy: sortField },
      players: result.rows
    });
  } catch (error) {
    console.error('Error fetching performance:', error);
    res.status(500).json({ error: 'Failed to fetch performance data', details: error.message });
  }
});

/**
 * GET /api/player-analytics/engagement
 * Player engagement scores and tiers
 */
router.get('/engagement', async (req, res) => {
  const { tier, limit = 100 } = req.query;

  try {
    let query = 'SELECT * FROM v_player_engagement_score';
    const params = [];

    if (tier) {
      query += ' WHERE engagement_tier = $1';
      params.push(tier);
    }

    query += ` ORDER BY engagement_score DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await pool.query(query, params);

    // Get tier distribution
    const tierDist = await pool.query(`
      SELECT
        engagement_tier,
        COUNT(*) as count,
        ROUND(AVG(engagement_score), 2) as avg_score
      FROM v_player_engagement_score
      GROUP BY engagement_tier
      ORDER BY avg_score DESC
    `);

    res.json({
      success: true,
      count: result.rows.length,
      tier_filter: tier || 'all',
      tier_distribution: tierDist.rows,
      players: result.rows
    });
  } catch (error) {
    console.error('Error fetching engagement:', error);
    res.status(500).json({ error: 'Failed to fetch engagement data', details: error.message });
  }
});

/**
 * GET /api/player-analytics/player/:email
 * Detailed analytics for a specific player
 */
router.get('/player/:email', async (req, res) => {
  const { email } = req.params;

  try {
    const player = await pool.query('SELECT * FROM players WHERE email = $1', [email]);

    if (player.rows.length === 0) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const [insights, performance, engagement, rfm] = await Promise.all([
      pool.query('SELECT * FROM get_player_insights($1)', [email]),
      pool.query('SELECT * FROM v_player_performance_summary WHERE email = $1', [email]),
      pool.query('SELECT * FROM v_player_engagement_score WHERE email = $1', [email]),
      pool.query('SELECT * FROM v_player_rfm_analysis WHERE email = $1', [email])
    ]);

    res.json({
      success: true,
      player: player.rows[0],
      insights: insights.rows,
      performance: performance.rows[0],
      engagement: engagement.rows[0],
      rfm: rfm.rows[0]
    });
  } catch (error) {
    console.error('Error fetching player data:', error);
    res.status(500).json({ error: 'Failed to fetch player data', details: error.message });
  }
});

// ============================================
// GAME-SPECIFIC ANALYTICS
// ============================================

/**
 * GET /api/player-analytics/trivia
 * NFL Trivia game analytics
 */
router.get('/trivia', async (req, res) => {
  const { limit = 100, team, skillLevel } = req.query;

  try {
    let query = 'SELECT * FROM v_trivia_analytics WHERE trivia_games_played > 0';
    const params = [];

    if (team) {
      query += ` AND favorite_team = $${params.length + 1}`;
      params.push(team);
    }

    if (skillLevel) {
      query += ` AND skill_level = $${params.length + 1}`;
      params.push(skillLevel);
    }

    query += ` ORDER BY trivia_best_score DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await pool.query(query, params);
    const teamStats = await pool.query('SELECT * FROM v_team_loyalty_analysis LIMIT 32');

    res.json({
      success: true,
      count: result.rows.length,
      filters: { team, skillLevel },
      players: result.rows,
      team_stats: teamStats.rows
    });
  } catch (error) {
    console.error('Error fetching trivia analytics:', error);
    res.status(500).json({ error: 'Failed to fetch trivia analytics', details: error.message });
  }
});

/**
 * GET /api/player-analytics/journeyman
 * Journeyman game analytics
 */
router.get('/journeyman', async (req, res) => {
  const { limit = 100, skillLevel } = req.query;

  try {
    let query = 'SELECT * FROM v_journeyman_analytics WHERE journeyman_games_played > 0';
    const params = [];

    if (skillLevel) {
      query += ` AND skill_level = $${params.length + 1}`;
      params.push(skillLevel);
    }

    query += ` ORDER BY journeyman_best_correct DESC, journeyman_best_time ASC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await pool.query(query, params);

    // Get skill distribution
    const skillDist = await pool.query(`
      SELECT
        skill_level,
        COUNT(*) as count,
        ROUND(AVG(journeyman_best_correct), 2) as avg_correct
      FROM v_journeyman_analytics
      GROUP BY skill_level
      ORDER BY avg_correct DESC
    `);

    res.json({
      success: true,
      count: result.rows.length,
      skill_distribution: skillDist.rows,
      players: result.rows
    });
  } catch (error) {
    console.error('Error fetching journeyman analytics:', error);
    res.status(500).json({ error: 'Failed to fetch journeyman analytics', details: error.message });
  }
});

/**
 * GET /api/player-analytics/teammates
 * NFL Teammates game analytics
 */
router.get('/teammates', async (req, res) => {
  const { limit = 100, skillLevel } = req.query;

  try {
    let query = 'SELECT * FROM v_teammates_analytics WHERE teammates_games_played > 0';
    const params = [];

    if (skillLevel) {
      query += ` AND skill_level = $${params.length + 1}`;
      params.push(skillLevel);
    }

    query += ` ORDER BY teammates_best_score DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      count: result.rows.length,
      players: result.rows
    });
  } catch (error) {
    console.error('Error fetching teammates analytics:', error);
    res.status(500).json({ error: 'Failed to fetch teammates analytics', details: error.message });
  }
});

// ============================================
// COHORT & RETENTION ANALYSIS
// ============================================

/**
 * GET /api/player-analytics/cohorts/weekly
 * Weekly cohort analysis
 */
router.get('/cohorts/weekly', async (req, res) => {
  const { weeks = 12 } = req.query;

  try {
    const result = await pool.query(`
      SELECT * FROM v_weekly_cohorts
      ORDER BY cohort_week DESC
      LIMIT $1
    `, [weeks]);

    res.json({
      success: true,
      period: `${weeks} weeks`,
      cohorts: result.rows
    });
  } catch (error) {
    console.error('Error fetching weekly cohorts:', error);
    res.status(500).json({ error: 'Failed to fetch cohort data', details: error.message });
  }
});

/**
 * GET /api/player-analytics/cohorts/monthly
 * Monthly cohort analysis with retention rates
 */
router.get('/cohorts/monthly', async (req, res) => {
  const { months = 12 } = req.query;

  try {
    const result = await pool.query(`
      SELECT * FROM v_monthly_cohorts
      ORDER BY cohort_month DESC
      LIMIT $1
    `, [months]);

    res.json({
      success: true,
      period: `${months} months`,
      cohorts: result.rows
    });
  } catch (error) {
    console.error('Error fetching monthly cohorts:', error);
    res.status(500).json({ error: 'Failed to fetch cohort data', details: error.message });
  }
});

// ============================================
// RFM & SEGMENTATION
// ============================================

/**
 * GET /api/player-analytics/rfm
 * RFM (Recency, Frequency, Monetary) analysis
 */
router.get('/rfm', async (req, res) => {
  const { segment, limit = 500 } = req.query;

  try {
    let query = 'SELECT * FROM v_player_rfm_analysis';
    const params = [];

    if (segment) {
      query += ' WHERE player_segment = $1';
      params.push(segment);
    }

    query += ` ORDER BY rfm_total DESC, recency_days ASC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await pool.query(query, params);

    // Get segment distribution
    const segmentDist = await pool.query(`
      SELECT
        player_segment,
        COUNT(*) as player_count,
        ROUND(AVG(rfm_total), 2) as avg_rfm_score,
        ROUND(AVG(recency_days), 2) as avg_recency_days,
        ROUND(AVG(frequency), 2) as avg_frequency
      FROM v_player_rfm_analysis
      GROUP BY player_segment
      ORDER BY avg_rfm_score DESC
    `);

    res.json({
      success: true,
      segment_filter: segment || 'all',
      count: result.rows.length,
      segment_distribution: segmentDist.rows,
      players: result.rows
    });
  } catch (error) {
    console.error('Error fetching RFM analysis:', error);
    res.status(500).json({ error: 'Failed to fetch RFM data', details: error.message });
  }
});

/**
 * GET /api/player-analytics/segments
 * Player segment distribution
 */
router.get('/segments', async (req, res) => {
  try {
    const distribution = await pool.query('SELECT * FROM get_player_segment_distribution()');

    res.json({
      success: true,
      segments: distribution.rows
    });
  } catch (error) {
    console.error('Error fetching segments:', error);
    res.status(500).json({ error: 'Failed to fetch segment data', details: error.message });
  }
});

// ============================================
// CHURN & RETENTION
// ============================================

/**
 * GET /api/player-analytics/churn-risk
 * Churn risk analysis and predictions
 */
router.get('/churn-risk', async (req, res) => {
  const { riskLevel, limit = 100 } = req.query;

  try {
    let query = 'SELECT * FROM v_churn_risk_analysis';
    const params = [];

    if (riskLevel) {
      query += ' WHERE churn_risk_level = $1';
      params.push(riskLevel);
    }

    query += ` ORDER BY churn_risk_score DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await pool.query(query, params);

    // Get risk level distribution
    const riskDist = await pool.query(`
      SELECT
        churn_risk_level,
        COUNT(*) as player_count,
        ROUND(AVG(churn_risk_score), 2) as avg_risk_score,
        ROUND(AVG(days_inactive), 2) as avg_days_inactive
      FROM v_churn_risk_analysis
      GROUP BY churn_risk_level
      ORDER BY avg_risk_score DESC
    `);

    res.json({
      success: true,
      risk_level_filter: riskLevel || 'all',
      count: result.rows.length,
      risk_distribution: riskDist.rows,
      at_risk_players: result.rows
    });
  } catch (error) {
    console.error('Error fetching churn risk:', error);
    res.status(500).json({ error: 'Failed to fetch churn risk data', details: error.message });
  }
});

// ============================================
// TRENDS & TIME-BASED ANALYTICS
// ============================================

/**
 * GET /api/player-analytics/trends/daily
 * Daily player activity trends
 */
router.get('/trends/daily', async (req, res) => {
  const { days = 30 } = req.query;

  try {
    const result = await pool.query(`
      SELECT * FROM v_daily_player_trends
      WHERE activity_date >= CURRENT_DATE - $1
      ORDER BY activity_date DESC
    `, [days]);

    res.json({
      success: true,
      period: `${days} days`,
      trends: result.rows
    });
  } catch (error) {
    console.error('Error fetching daily trends:', error);
    res.status(500).json({ error: 'Failed to fetch trend data', details: error.message });
  }
});

/**
 * GET /api/player-analytics/trends/weekly
 * Weekly player activity trends
 */
router.get('/trends/weekly', async (req, res) => {
  const { weeks = 12 } = req.query;

  try {
    const result = await pool.query(`
      SELECT * FROM v_weekly_player_trends
      ORDER BY week_start DESC
      LIMIT $1
    `, [weeks]);

    res.json({
      success: true,
      period: `${weeks} weeks`,
      trends: result.rows
    });
  } catch (error) {
    console.error('Error fetching weekly trends:', error);
    res.status(500).json({ error: 'Failed to fetch trend data', details: error.message });
  }
});

// ============================================
// CROSS-GAME ANALYTICS
// ============================================

/**
 * GET /api/player-analytics/cross-play
 * Cross-game play analysis
 */
router.get('/cross-play', async (req, res) => {
  try {
    const gameAnalysis = await pool.query('SELECT * FROM v_game_cross_play_analysis');

    // Get players who play multiple games
    const multiGamePlayers = await pool.query(`
      SELECT
        id, name, email, games_played,
        array_length(games_played, 1) as game_count,
        total_sessions,
        completion_rate
      FROM players
      WHERE array_length(games_played, 1) > 1
      ORDER BY array_length(games_played, 1) DESC, total_sessions DESC
      LIMIT 100
    `);

    res.json({
      success: true,
      game_analysis: gameAnalysis.rows,
      multi_game_players: multiGamePlayers.rows
    });
  } catch (error) {
    console.error('Error fetching cross-play data:', error);
    res.status(500).json({ error: 'Failed to fetch cross-play data', details: error.message });
  }
});

// ============================================
// LEADERBOARDS
// ============================================

/**
 * GET /api/player-analytics/leaderboard
 * Overall leaderboard across all games
 */
router.get('/leaderboard', async (req, res) => {
  const { limit = 100 } = req.query;

  try {
    const result = await pool.query(`
      SELECT * FROM v_overall_leaderboard
      LIMIT $1
    `, [limit]);

    res.json({
      success: true,
      count: result.rows.length,
      leaderboard: result.rows
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard', details: error.message });
  }
});

/**
 * GET /api/player-analytics/leaderboard/trivia
 * Trivia-specific leaderboard
 */
router.get('/leaderboard/trivia', async (req, res) => {
  const { limit = 100 } = req.query;

  try {
    const result = await pool.query(`
      SELECT * FROM v_trivia_leaderboard
      LIMIT $1
    `, [limit]);

    res.json({
      success: true,
      game: 'trivia',
      count: result.rows.length,
      leaderboard: result.rows
    });
  } catch (error) {
    console.error('Error fetching trivia leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard', details: error.message });
  }
});

/**
 * GET /api/player-analytics/leaderboard/journeyman
 * Journeyman-specific leaderboard
 */
router.get('/leaderboard/journeyman', async (req, res) => {
  const { limit = 100 } = req.query;

  try {
    const result = await pool.query(`
      SELECT * FROM v_journeyman_leaderboard
      LIMIT $1
    `, [limit]);

    res.json({
      success: true,
      game: 'journeyman',
      count: result.rows.length,
      leaderboard: result.rows
    });
  } catch (error) {
    console.error('Error fetching journeyman leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard', details: error.message });
  }
});

// ============================================
// LIFETIME VALUE
// ============================================

/**
 * GET /api/player-analytics/lifetime-value
 * Player lifetime value analysis
 */
router.get('/lifetime-value', async (req, res) => {
  const { tier, limit = 100 } = req.query;

  try {
    let query = 'SELECT * FROM v_player_lifetime_value';
    const params = [];

    if (tier) {
      query += ' WHERE value_tier = $1';
      params.push(tier);
    }

    query += ` ORDER BY lifetime_value_score DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await pool.query(query, params);

    // Get tier distribution
    const tierDist = await pool.query(`
      SELECT
        value_tier,
        COUNT(*) as player_count,
        ROUND(AVG(lifetime_value_score), 2) as avg_ltv_score,
        ROUND(AVG(total_sessions), 2) as avg_sessions
      FROM v_player_lifetime_value
      GROUP BY value_tier
      ORDER BY avg_ltv_score DESC
    `);

    res.json({
      success: true,
      tier_filter: tier || 'all',
      count: result.rows.length,
      tier_distribution: tierDist.rows,
      players: result.rows
    });
  } catch (error) {
    console.error('Error fetching lifetime value:', error);
    res.status(500).json({ error: 'Failed to fetch LTV data', details: error.message });
  }
});

// ============================================
// ADMIN & MAINTENANCE
// ============================================

/**
 * POST /api/player-analytics/refresh
 * Refresh materialized views
 */
router.post('/refresh', async (req, res) => {
  try {
    await pool.query('SELECT refresh_player_analytics_views()');

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
 * GET /api/player-analytics/stats
 * Quick stats summary
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM players) as total_players,
        (SELECT COUNT(*) FROM players WHERE total_sessions > 0) as active_players,
        (SELECT COUNT(*) FROM players WHERE last_activity_at >= CURRENT_DATE - 1) as active_24h,
        (SELECT COUNT(*) FROM players WHERE last_activity_at >= CURRENT_DATE - 7) as active_7d,
        (SELECT SUM(total_sessions) FROM players) as total_sessions,
        (SELECT SUM(total_questions_answered) FROM players) as total_questions,
        (SELECT SUM(total_shares) FROM players) as total_shares,
        (SELECT ROUND(AVG(completion_rate), 2) FROM players WHERE total_sessions > 0) as avg_completion_rate
    `);

    res.json({
      success: true,
      stats: stats.rows[0]
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats', details: error.message });
  }
});

/**
 * GET /api/player-analytics/export
 * Export analytics data as CSV
 */
router.get('/export', async (req, res) => {
  const { type = 'performance', limit = 1000 } = req.query;

  try {
    let query;
    let filename;

    switch (type) {
      case 'performance':
        query = `SELECT * FROM v_player_performance_summary ORDER BY accuracy_rate DESC LIMIT ${limit}`;
        filename = 'player_performance.csv';
        break;
      case 'engagement':
        query = `SELECT * FROM v_player_engagement_score ORDER BY engagement_score DESC LIMIT ${limit}`;
        filename = 'player_engagement.csv';
        break;
      case 'churn_risk':
        query = `SELECT * FROM v_churn_risk_analysis ORDER BY churn_risk_score DESC LIMIT ${limit}`;
        filename = 'churn_risk.csv';
        break;
      case 'rfm':
        query = `SELECT * FROM v_player_rfm_analysis ORDER BY rfm_total DESC LIMIT ${limit}`;
        filename = 'rfm_analysis.csv';
        break;
      default:
        return res.status(400).json({ error: 'Invalid export type' });
    }

    const result = await pool.query(query);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No data to export' });
    }

    // Convert to CSV
    const headers = Object.keys(result.rows[0]).join(',');
    const rows = result.rows.map(row =>
      Object.values(row).map(val =>
        typeof val === 'string' && val.includes(',') ? `"${val}"` : val
      ).join(',')
    ).join('\n');
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
