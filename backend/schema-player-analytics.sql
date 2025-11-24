-- ============================================
-- COMPREHENSIVE PLAYER ANALYTICS SCHEMA
-- Advanced analytics based on the single 'players' table
-- ============================================
-- This schema provides deep insights into player behavior, engagement,
-- performance, and trends across all three NFL games

-- ============================================
-- CORE ANALYTICS VIEWS - PLAYER PERFORMANCE
-- ============================================

-- Overall player performance summary
CREATE OR REPLACE VIEW v_player_performance_summary AS
SELECT
  id,
  name,
  email,
  game_type,
  total_sessions,
  total_questions_answered,
  total_correct_answers,
  total_wrong_answers,
  ROUND(100.0 * total_correct_answers / NULLIF(total_questions_answered, 0), 2) as accuracy_rate,
  completion_rate,
  avg_questions_per_session,
  avg_session_duration,
  avg_time_per_question,
  best_streak,
  current_streak,
  total_shares,
  ROUND(total_shares::FLOAT / NULLIF(total_sessions, 0), 2) as shares_per_session,
  DATE_PART('day', CURRENT_TIMESTAMP - created_at) as days_since_signup,
  DATE_PART('day', CURRENT_TIMESTAMP - last_activity_at) as days_since_last_activity,
  array_length(games_played, 1) as unique_games_played,
  CASE
    WHEN last_activity_at >= CURRENT_TIMESTAMP - INTERVAL '7 days' THEN 'Active'
    WHEN last_activity_at >= CURRENT_TIMESTAMP - INTERVAL '30 days' THEN 'Recent'
    WHEN last_activity_at >= CURRENT_TIMESTAMP - INTERVAL '90 days' THEN 'Dormant'
    ELSE 'Inactive'
  END as player_status
FROM players
WHERE total_sessions > 0;

-- Player engagement scoring (0-100 scale)
CREATE OR REPLACE VIEW v_player_engagement_score AS
SELECT
  id,
  name,
  email,
  game_type,
  total_sessions,
  last_activity_at,
  LEAST(100, ROUND(
    -- Session frequency (30 points)
    (LEAST(total_sessions, 20) / 20.0 * 30) +
    -- Completion rate (20 points)
    (completion_rate / 100.0 * 20) +
    -- Questions answered (20 points)
    (LEAST(total_questions_answered, 100) / 100.0 * 20) +
    -- Sharing behavior (15 points)
    (LEAST(total_shares, 10) / 10.0 * 15) +
    -- Streak maintenance (15 points)
    (LEAST(best_streak, 10) / 10.0 * 15)
  , 2)) as engagement_score,
  CASE
    WHEN total_sessions >= 20 AND completion_rate >= 80 THEN 'Power User'
    WHEN total_sessions >= 10 AND completion_rate >= 60 THEN 'Engaged User'
    WHEN total_sessions >= 5 OR total_questions_answered >= 25 THEN 'Regular User'
    WHEN total_sessions >= 2 THEN 'Casual User'
    ELSE 'New User'
  END as engagement_tier
FROM players
WHERE total_sessions > 0;

-- ============================================
-- GAME-SPECIFIC ANALYTICS
-- ============================================

-- NFL Trivia Analytics
CREATE OR REPLACE VIEW v_trivia_analytics AS
SELECT
  id,
  name,
  email,
  favorite_team,
  trivia_games_played,
  trivia_score,
  trivia_best_score,
  ROUND(trivia_score::FLOAT / NULLIF(trivia_games_played, 0), 2) as avg_score_per_game,
  ROUND(trivia_best_score::FLOAT / NULLIF(trivia_score, 0) * 100, 2) as best_vs_avg_ratio,
  last_game_played_at,
  DATE_PART('day', CURRENT_TIMESTAMP - last_game_played_at) as days_since_last_game,
  total_sessions,
  ROUND(trivia_games_played::FLOAT / NULLIF(total_sessions, 0) * 100, 2) as trivia_session_ratio,
  CASE
    WHEN trivia_best_score >= 90 THEN 'Expert'
    WHEN trivia_best_score >= 70 THEN 'Advanced'
    WHEN trivia_best_score >= 50 THEN 'Intermediate'
    WHEN trivia_best_score >= 30 THEN 'Beginner'
    ELSE 'Novice'
  END as skill_level
FROM players
WHERE trivia_games_played > 0
ORDER BY trivia_best_score DESC, trivia_games_played DESC;

-- Journeyman Analytics
CREATE OR REPLACE VIEW v_journeyman_analytics AS
SELECT
  id,
  name,
  email,
  journeyman_games_played,
  journeyman_correct_count,
  journeyman_best_correct,
  journeyman_duration_seconds,
  journeyman_best_time,
  ROUND(journeyman_correct_count::FLOAT / NULLIF(journeyman_games_played, 0), 2) as avg_correct_per_game,
  ROUND(journeyman_duration_seconds::FLOAT / NULLIF(journeyman_games_played, 0), 2) as avg_time_per_game,
  CASE
    WHEN journeyman_best_time IS NOT NULL THEN
      ROUND(journeyman_best_correct::FLOAT / NULLIF(journeyman_best_time, 0) * 60, 2)
    ELSE NULL
  END as best_correct_per_minute,
  last_game_played_at,
  CASE
    WHEN journeyman_best_correct >= 10 THEN 'Master'
    WHEN journeyman_best_correct >= 7 THEN 'Expert'
    WHEN journeyman_best_correct >= 5 THEN 'Skilled'
    WHEN journeyman_best_correct >= 3 THEN 'Intermediate'
    ELSE 'Beginner'
  END as skill_level
FROM players
WHERE journeyman_games_played > 0
ORDER BY journeyman_best_correct DESC, journeyman_best_time ASC;

-- Teammates Analytics
CREATE OR REPLACE VIEW v_teammates_analytics AS
SELECT
  id,
  name,
  email,
  teammates_games_played,
  teammates_best_score,
  teammates_completion_count,
  ROUND(teammates_completion_count::FLOAT / NULLIF(teammates_games_played, 0) * 100, 2) as completion_rate,
  total_correct_answers,
  total_questions_answered,
  ROUND(100.0 * total_correct_answers / NULLIF(total_questions_answered, 0), 2) as accuracy_rate,
  avg_time_per_question,
  last_game_played_at,
  CASE
    WHEN teammates_best_score >= 90 THEN 'Expert'
    WHEN teammates_best_score >= 70 THEN 'Advanced'
    WHEN teammates_best_score >= 50 THEN 'Intermediate'
    ELSE 'Beginner'
  END as skill_level
FROM players
WHERE teammates_games_played > 0
ORDER BY teammates_best_score DESC, teammates_games_played DESC;

-- ============================================
-- COHORT & RETENTION ANALYSIS
-- ============================================

-- Weekly cohort analysis
CREATE OR REPLACE VIEW v_weekly_cohorts AS
SELECT
  DATE_TRUNC('week', created_at)::DATE as cohort_week,
  COUNT(*) as cohort_size,
  COUNT(*) FILTER (WHERE total_sessions > 1) as returned_users,
  COUNT(*) FILTER (WHERE total_sessions >= 5) as engaged_users,
  COUNT(*) FILTER (WHERE total_sessions >= 10) as power_users,
  ROUND(100.0 * COUNT(*) FILTER (WHERE total_sessions > 1) / COUNT(*), 2) as return_rate,
  ROUND(100.0 * COUNT(*) FILTER (WHERE total_sessions >= 5) / COUNT(*), 2) as engagement_rate,
  ROUND(AVG(total_sessions), 2) as avg_sessions_per_user,
  ROUND(AVG(total_questions_answered), 2) as avg_questions_per_user,
  ROUND(AVG(completion_rate), 2) as avg_completion_rate
FROM players
GROUP BY DATE_TRUNC('week', created_at)
ORDER BY cohort_week DESC;

-- Monthly cohort analysis
CREATE OR REPLACE VIEW v_monthly_cohorts AS
SELECT
  DATE_TRUNC('month', created_at)::DATE as cohort_month,
  COUNT(*) as cohort_size,
  COUNT(*) FILTER (WHERE last_activity_at >= DATE_TRUNC('month', created_at) + INTERVAL '1 month') as retained_month_1,
  COUNT(*) FILTER (WHERE last_activity_at >= DATE_TRUNC('month', created_at) + INTERVAL '2 months') as retained_month_2,
  COUNT(*) FILTER (WHERE last_activity_at >= DATE_TRUNC('month', created_at) + INTERVAL '3 months') as retained_month_3,
  ROUND(100.0 * COUNT(*) FILTER (WHERE last_activity_at >= DATE_TRUNC('month', created_at) + INTERVAL '1 month') / COUNT(*), 2) as retention_month_1,
  ROUND(100.0 * COUNT(*) FILTER (WHERE last_activity_at >= DATE_TRUNC('month', created_at) + INTERVAL '2 months') / COUNT(*), 2) as retention_month_2,
  ROUND(100.0 * COUNT(*) FILTER (WHERE last_activity_at >= DATE_TRUNC('month', created_at) + INTERVAL '3 months') / COUNT(*), 2) as retention_month_3,
  ROUND(AVG(total_sessions), 2) as avg_sessions_per_user,
  ROUND(AVG(total_time_spent_seconds / 60.0), 2) as avg_minutes_per_user
FROM players
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY cohort_month DESC;

-- ============================================
-- RFM ANALYSIS (Recency, Frequency, Monetary*)
-- *Monetary replaced with engagement value
-- ============================================

CREATE OR REPLACE VIEW v_player_rfm_analysis AS
WITH rfm_data AS (
  SELECT
    id,
    name,
    email,
    game_type,
    -- Recency: Days since last activity (lower is better)
    COALESCE(DATE_PART('day', CURRENT_TIMESTAMP - last_activity_at), 999) as recency_days,
    -- Frequency: Total sessions
    total_sessions as frequency,
    -- Engagement Value: Combination of questions answered, completion, and shares
    (total_questions_answered + (total_shares * 5) + (completion_rate / 10)) as engagement_value
  FROM players
  WHERE total_sessions > 0
),
rfm_scores AS (
  SELECT
    id,
    name,
    email,
    game_type,
    recency_days,
    frequency,
    engagement_value,
    -- Score from 1-5 (5 is best)
    NTILE(5) OVER (ORDER BY recency_days DESC) as r_score,
    NTILE(5) OVER (ORDER BY frequency ASC) as f_score,
    NTILE(5) OVER (ORDER BY engagement_value ASC) as m_score
  FROM rfm_data
)
SELECT
  id,
  name,
  email,
  game_type,
  recency_days,
  frequency,
  ROUND(engagement_value, 2) as engagement_value,
  r_score,
  f_score,
  m_score,
  (r_score + f_score + m_score) as rfm_total,
  CASE
    WHEN r_score >= 4 AND f_score >= 4 AND m_score >= 4 THEN 'Champions'
    WHEN r_score >= 3 AND f_score >= 4 AND m_score >= 4 THEN 'Loyal Players'
    WHEN r_score >= 4 AND f_score >= 1 AND m_score >= 1 THEN 'Promising New'
    WHEN r_score >= 4 AND f_score <= 2 AND m_score <= 2 THEN 'Recent Users'
    WHEN r_score >= 3 AND f_score >= 3 AND m_score >= 3 THEN 'Potential Loyalists'
    WHEN r_score <= 2 AND f_score >= 4 AND m_score >= 4 THEN 'At Risk'
    WHEN r_score <= 2 AND f_score >= 2 AND m_score >= 2 THEN 'Hibernating'
    WHEN r_score <= 1 AND f_score <= 2 THEN 'Lost'
    ELSE 'Need Attention'
  END as player_segment
FROM rfm_scores
ORDER BY rfm_total DESC, recency_days ASC;

-- ============================================
-- CHURN PREDICTION & RISK ANALYSIS
-- ============================================

CREATE OR REPLACE VIEW v_churn_risk_analysis AS
SELECT
  id,
  name,
  email,
  game_type,
  total_sessions,
  last_activity_at,
  DATE_PART('day', CURRENT_TIMESTAMP - last_activity_at) as days_inactive,
  completion_rate,
  current_streak,
  -- Churn risk score (0-100, higher is more at risk)
  LEAST(100, ROUND(
    -- Inactivity penalty (40 points max)
    (LEAST(DATE_PART('day', CURRENT_TIMESTAMP - last_activity_at), 30) / 30.0 * 40) +
    -- Low completion penalty (20 points max)
    ((100 - completion_rate) / 100.0 * 20) +
    -- Broken streak penalty (20 points max)
    (CASE WHEN current_streak = 0 THEN 20 ELSE 0 END) +
    -- Low session count penalty (20 points max)
    (CASE WHEN total_sessions < 3 THEN 20
          WHEN total_sessions < 5 THEN 10
          ELSE 0 END)
  , 2)) as churn_risk_score,
  CASE
    WHEN DATE_PART('day', CURRENT_TIMESTAMP - last_activity_at) >= 30 THEN 'Critical'
    WHEN DATE_PART('day', CURRENT_TIMESTAMP - last_activity_at) >= 14 THEN 'High'
    WHEN DATE_PART('day', CURRENT_TIMESTAMP - last_activity_at) >= 7 THEN 'Medium'
    WHEN completion_rate < 30 THEN 'Medium'
    ELSE 'Low'
  END as churn_risk_level,
  CASE
    WHEN DATE_PART('day', CURRENT_TIMESTAMP - last_activity_at) >= 30 THEN 'Re-engagement campaign'
    WHEN DATE_PART('day', CURRENT_TIMESTAMP - last_activity_at) >= 14 THEN 'Win-back email'
    WHEN completion_rate < 30 THEN 'Tutorial/help content'
    WHEN current_streak = 0 AND best_streak > 0 THEN 'Streak reminder'
    ELSE 'None'
  END as recommended_action
FROM players
WHERE total_sessions > 0
ORDER BY churn_risk_score DESC;

-- ============================================
-- TIME-BASED ANALYTICS
-- ============================================

-- Daily active players trend
CREATE OR REPLACE VIEW v_daily_player_trends AS
SELECT
  DATE(last_activity_at) as activity_date,
  COUNT(DISTINCT id) as active_players,
  COUNT(DISTINCT id) FILTER (WHERE total_sessions = 1) as new_players,
  COUNT(DISTINCT id) FILTER (WHERE total_sessions > 1) as returning_players,
  COUNT(DISTINCT game_type) as games_played,
  SUM(total_questions_answered) as total_questions,
  SUM(total_shares) as total_shares,
  ROUND(AVG(completion_rate), 2) as avg_completion_rate
FROM players
WHERE last_activity_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE(last_activity_at)
ORDER BY activity_date DESC;

-- Weekly trends
CREATE OR REPLACE VIEW v_weekly_player_trends AS
SELECT
  DATE_TRUNC('week', last_activity_at)::DATE as week_start,
  COUNT(DISTINCT id) as active_players,
  COUNT(DISTINCT id) FILTER (WHERE total_sessions = 1) as new_players,
  SUM(total_sessions) as total_sessions,
  SUM(total_questions_answered) as total_questions,
  ROUND(AVG(completion_rate), 2) as avg_completion_rate,
  ROUND(AVG(total_time_spent_seconds / 60.0), 2) as avg_minutes_per_player
FROM players
WHERE last_activity_at >= CURRENT_DATE - INTERVAL '180 days'
GROUP BY DATE_TRUNC('week', last_activity_at)
ORDER BY week_start DESC;

-- ============================================
-- COMPARATIVE ANALYTICS
-- ============================================

-- Game popularity and cross-play analysis
CREATE OR REPLACE VIEW v_game_cross_play_analysis AS
SELECT
  game_type as primary_game,
  COUNT(*) as player_count,
  COUNT(*) FILTER (WHERE array_length(games_played, 1) = 1) as exclusive_players,
  COUNT(*) FILTER (WHERE array_length(games_played, 1) > 1) as multi_game_players,
  ROUND(100.0 * COUNT(*) FILTER (WHERE array_length(games_played, 1) > 1) / COUNT(*), 2) as cross_play_rate,
  ROUND(AVG(total_sessions), 2) as avg_sessions,
  ROUND(AVG(completion_rate), 2) as avg_completion_rate,
  ROUND(AVG(total_time_spent_seconds / 60.0), 2) as avg_minutes_played
FROM players
WHERE game_type IS NOT NULL
GROUP BY game_type
ORDER BY player_count DESC;

-- Team loyalty analysis (for trivia)
CREATE OR REPLACE VIEW v_team_loyalty_analysis AS
SELECT
  favorite_team,
  COUNT(*) as fan_count,
  ROUND(AVG(trivia_games_played), 2) as avg_games_played,
  ROUND(AVG(trivia_best_score), 2) as avg_best_score,
  ROUND(AVG(total_sessions), 2) as avg_total_sessions,
  ROUND(AVG(completion_rate), 2) as avg_completion_rate,
  MAX(trivia_best_score) as top_score,
  MIN(trivia_best_score) FILTER (WHERE trivia_best_score > 0) as lowest_score
FROM players
WHERE favorite_team IS NOT NULL AND trivia_games_played > 0
GROUP BY favorite_team
ORDER BY fan_count DESC, avg_best_score DESC;

-- ============================================
-- PLAYER LIFETIME VALUE METRICS
-- ============================================

CREATE OR REPLACE VIEW v_player_lifetime_value AS
SELECT
  id,
  name,
  email,
  game_type,
  DATE_PART('day', CURRENT_TIMESTAMP - created_at) as lifetime_days,
  total_sessions,
  total_questions_answered,
  total_time_spent_seconds / 3600.0 as total_hours_played,
  total_shares,
  -- Engagement value score
  ROUND(
    (total_sessions * 10) +
    (total_questions_answered * 2) +
    (total_shares * 5) +
    (completion_rate * 0.5) +
    (CASE WHEN array_length(games_played, 1) > 1 THEN 50 ELSE 0 END)
  , 2) as lifetime_value_score,
  -- Predicted future sessions (simple linear projection)
  CASE
    WHEN DATE_PART('day', CURRENT_TIMESTAMP - created_at) > 0 THEN
      ROUND(total_sessions / (DATE_PART('day', CURRENT_TIMESTAMP - created_at) / 30.0) * 6, 2)
    ELSE 0
  END as projected_6month_sessions,
  CASE
    WHEN total_sessions >= 20 AND completion_rate >= 70 THEN 'VIP'
    WHEN total_sessions >= 10 AND completion_rate >= 50 THEN 'High Value'
    WHEN total_sessions >= 5 THEN 'Medium Value'
    ELSE 'Standard'
  END as value_tier
FROM players
WHERE total_sessions > 0
ORDER BY lifetime_value_score DESC;

-- ============================================
-- LEADERBOARDS
-- ============================================

-- Overall leaderboard (across all games)
CREATE OR REPLACE VIEW v_overall_leaderboard AS
SELECT
  id,
  name,
  email,
  total_sessions,
  total_questions_answered,
  total_correct_answers,
  ROUND(100.0 * total_correct_answers / NULLIF(total_questions_answered, 0), 2) as accuracy_rate,
  completion_rate,
  best_streak,
  total_shares,
  array_length(games_played, 1) as games_mastered,
  ROUND(
    (total_sessions * 5) +
    (total_correct_answers * 2) +
    (best_streak * 10) +
    (completion_rate * 0.5) +
    (total_shares * 3)
  , 2) as leaderboard_score,
  ROW_NUMBER() OVER (ORDER BY
    (total_sessions * 5) +
    (total_correct_answers * 2) +
    (best_streak * 10) +
    (completion_rate * 0.5) +
    (total_shares * 3) DESC
  ) as rank
FROM players
WHERE total_sessions > 0
ORDER BY rank
LIMIT 100;

-- ============================================
-- STATISTICAL AGGREGATES
-- ============================================

-- Overall platform statistics
CREATE OR REPLACE VIEW v_platform_statistics AS
SELECT
  COUNT(*) as total_players,
  COUNT(*) FILTER (WHERE total_sessions > 0) as active_players,
  COUNT(*) FILTER (WHERE last_activity_at >= CURRENT_DATE - 1) as players_last_24h,
  COUNT(*) FILTER (WHERE last_activity_at >= CURRENT_DATE - 7) as players_last_7d,
  COUNT(*) FILTER (WHERE last_activity_at >= CURRENT_DATE - 30) as players_last_30d,
  ROUND(AVG(total_sessions) FILTER (WHERE total_sessions > 0), 2) as avg_sessions_per_player,
  ROUND(AVG(total_questions_answered) FILTER (WHERE total_sessions > 0), 2) as avg_questions_per_player,
  ROUND(AVG(completion_rate) FILTER (WHERE total_sessions > 0), 2) as avg_completion_rate,
  ROUND(AVG(total_time_spent_seconds / 3600.0) FILTER (WHERE total_sessions > 0), 2) as avg_hours_per_player,
  SUM(total_sessions) as total_sessions_platform,
  SUM(total_questions_answered) as total_questions_platform,
  SUM(total_shares) as total_shares_platform,
  COUNT(DISTINCT favorite_team) FILTER (WHERE favorite_team IS NOT NULL) as unique_teams
FROM players;

-- Game-specific statistics
CREATE OR REPLACE VIEW v_game_statistics AS
SELECT
  game_type,
  COUNT(*) as player_count,
  COUNT(*) FILTER (WHERE last_activity_at >= CURRENT_DATE - 7) as active_last_7d,
  ROUND(AVG(total_sessions), 2) as avg_sessions,
  ROUND(AVG(completion_rate), 2) as avg_completion_rate,
  ROUND(AVG(total_questions_answered), 2) as avg_questions_answered,
  SUM(trivia_games_played) as total_trivia_games,
  ROUND(AVG(trivia_best_score) FILTER (WHERE trivia_games_played > 0), 2) as avg_trivia_score,
  SUM(journeyman_games_played) as total_journeyman_games,
  ROUND(AVG(journeyman_best_correct) FILTER (WHERE journeyman_games_played > 0), 2) as avg_journeyman_correct,
  SUM(teammates_games_played) as total_teammates_games,
  ROUND(AVG(teammates_best_score) FILTER (WHERE teammates_games_played > 0), 2) as avg_teammates_score
FROM players
WHERE game_type IS NOT NULL
GROUP BY game_type
ORDER BY player_count DESC;

-- ============================================
-- MATERIALIZED VIEWS FOR PERFORMANCE
-- ============================================

-- Main dashboard materialized view (refresh hourly)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_analytics_dashboard AS
SELECT
  (SELECT COUNT(*) FROM players) as total_players,
  (SELECT COUNT(*) FROM players WHERE total_sessions > 0) as active_players,
  (SELECT COUNT(*) FROM players WHERE last_activity_at >= CURRENT_DATE - 1) as dau,
  (SELECT COUNT(*) FROM players WHERE last_activity_at >= CURRENT_DATE - 7) as wau,
  (SELECT COUNT(*) FROM players WHERE last_activity_at >= CURRENT_DATE - 30) as mau,
  (SELECT ROUND(AVG(total_sessions), 2) FROM players WHERE total_sessions > 0) as avg_sessions,
  (SELECT ROUND(AVG(completion_rate), 2) FROM players WHERE total_sessions > 0) as avg_completion_rate,
  (SELECT SUM(total_questions_answered) FROM players) as total_questions_answered,
  (SELECT SUM(total_shares) FROM players) as total_shares,
  (SELECT COUNT(*) FROM players WHERE created_at >= CURRENT_DATE - 7) as new_players_7d,
  (SELECT COUNT(*) FROM players WHERE created_at >= CURRENT_DATE - 30) as new_players_30d,
  CURRENT_TIMESTAMP as last_updated;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_analytics_dashboard ON mv_analytics_dashboard(last_updated);

-- Game performance materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_game_performance AS
SELECT
  game_type,
  COUNT(*) as players,
  ROUND(AVG(total_sessions), 2) as avg_sessions,
  ROUND(AVG(completion_rate), 2) as avg_completion,
  ROUND(AVG(total_questions_answered), 2) as avg_questions,
  MAX(last_activity_at) as last_activity,
  CURRENT_TIMESTAMP as last_updated
FROM players
WHERE game_type IS NOT NULL
GROUP BY game_type;

CREATE INDEX IF NOT EXISTS idx_mv_game_performance_game_type ON mv_game_performance(game_type);

-- ============================================
-- ANALYTICS FUNCTIONS
-- ============================================

-- Function to refresh all materialized views
CREATE OR REPLACE FUNCTION refresh_player_analytics_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_analytics_dashboard;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_game_performance;
END;
$$ LANGUAGE plpgsql;

-- Function to get player insights
CREATE OR REPLACE FUNCTION get_player_insights(player_email VARCHAR)
RETURNS TABLE(
  insight_type VARCHAR,
  insight_value TEXT,
  metric_value NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH player_data AS (
    SELECT * FROM players WHERE email = player_email
  )
  SELECT
    'engagement_score'::VARCHAR,
    CASE
      WHEN p.total_sessions >= 10 THEN 'Highly Engaged'
      WHEN p.total_sessions >= 5 THEN 'Moderately Engaged'
      ELSE 'New Player'
    END::TEXT,
    p.total_sessions::NUMERIC
  FROM player_data p
  UNION ALL
  SELECT
    'performance_tier'::VARCHAR,
    CASE
      WHEN p.completion_rate >= 80 THEN 'Top Performer'
      WHEN p.completion_rate >= 50 THEN 'Average Performer'
      ELSE 'Needs Improvement'
    END::TEXT,
    p.completion_rate::NUMERIC
  FROM player_data p
  UNION ALL
  SELECT
    'activity_status'::VARCHAR,
    CASE
      WHEN p.last_activity_at >= CURRENT_TIMESTAMP - INTERVAL '7 days' THEN 'Active'
      WHEN p.last_activity_at >= CURRENT_TIMESTAMP - INTERVAL '30 days' THEN 'At Risk'
      ELSE 'Churned'
    END::TEXT,
    DATE_PART('day', CURRENT_TIMESTAMP - p.last_activity_at)::NUMERIC
  FROM player_data p;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate player segment distribution
CREATE OR REPLACE FUNCTION get_player_segment_distribution()
RETURNS TABLE(
  segment VARCHAR,
  count BIGINT,
  percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH segments AS (
    SELECT
      CASE
        WHEN total_sessions >= 20 AND completion_rate >= 80 THEN 'Champions'
        WHEN total_sessions >= 10 AND completion_rate >= 60 THEN 'Loyalists'
        WHEN total_sessions >= 5 THEN 'Regular Users'
        WHEN total_sessions >= 2 THEN 'Casual Users'
        WHEN total_sessions = 1 THEN 'One-timers'
        ELSE 'Inactive'
      END as segment_name
    FROM players
  )
  SELECT
    segment_name::VARCHAR,
    COUNT(*)::BIGINT,
    ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2)::NUMERIC
  FROM segments
  GROUP BY segment_name
  ORDER BY COUNT(*) DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PERFORMANCE INDEXES
-- ============================================

-- Ensure all necessary indexes exist
CREATE INDEX IF NOT EXISTS idx_players_last_activity_at ON players(last_activity_at);
CREATE INDEX IF NOT EXISTS idx_players_created_at ON players(created_at);
CREATE INDEX IF NOT EXISTS idx_players_total_sessions ON players(total_sessions);
CREATE INDEX IF NOT EXISTS idx_players_completion_rate ON players(completion_rate);
CREATE INDEX IF NOT EXISTS idx_players_game_type_activity ON players(game_type, last_activity_at);

-- ============================================
-- USAGE EXAMPLES
-- ============================================
-- Get main dashboard stats:
-- SELECT * FROM mv_analytics_dashboard;
--
-- Get player performance summary:
-- SELECT * FROM v_player_performance_summary LIMIT 10;
--
-- Get churn risk players:
-- SELECT * FROM v_churn_risk_analysis WHERE churn_risk_level IN ('High', 'Critical');
--
-- Get RFM segments:
-- SELECT player_segment, COUNT(*) FROM v_player_rfm_analysis GROUP BY player_segment;
--
-- Get player insights:
-- SELECT * FROM get_player_insights('player@example.com');
--
-- Get segment distribution:
-- SELECT * FROM get_player_segment_distribution();
--
-- Refresh analytics:
-- SELECT refresh_player_analytics_views();
