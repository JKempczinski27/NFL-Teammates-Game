-- ============================================
-- ADVANCED ANALYTICS SCHEMA
-- Comprehensive analytics tables and views for all three NFL games
-- ============================================

-- ============================================
-- AGGREGATED METRICS TABLES
-- ============================================

-- Daily aggregated metrics by game
CREATE TABLE IF NOT EXISTS daily_metrics (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  game_type VARCHAR(50) NOT NULL,
  total_sessions INTEGER DEFAULT 0,
  unique_users INTEGER DEFAULT 0,
  completed_sessions INTEGER DEFAULT 0,
  dropped_sessions INTEGER DEFAULT 0,
  avg_session_duration FLOAT DEFAULT 0,
  avg_questions_viewed FLOAT DEFAULT 0,
  avg_questions_answered FLOAT DEFAULT 0,
  total_shares INTEGER DEFAULT 0,
  completion_rate FLOAT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(date, game_type)
);

-- Hourly metrics for real-time analytics
CREATE TABLE IF NOT EXISTS hourly_metrics (
  id SERIAL PRIMARY KEY,
  hour TIMESTAMP WITH TIME ZONE NOT NULL,
  game_type VARCHAR(50) NOT NULL,
  total_sessions INTEGER DEFAULT 0,
  active_sessions INTEGER DEFAULT 0,
  completed_sessions INTEGER DEFAULT 0,
  avg_session_duration FLOAT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(hour, game_type)
);

-- Question difficulty metrics
CREATE TABLE IF NOT EXISTS question_difficulty_metrics (
  id SERIAL PRIMARY KEY,
  game_type VARCHAR(50) NOT NULL,
  question_index INTEGER NOT NULL,
  total_attempts INTEGER DEFAULT 0,
  correct_attempts INTEGER DEFAULT 0,
  wrong_attempts INTEGER DEFAULT 0,
  success_rate FLOAT DEFAULT 0,
  avg_attempts FLOAT DEFAULT 0,
  avg_time_seconds FLOAT DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(game_type, question_index)
);

-- User cohorts for retention analysis
CREATE TABLE IF NOT EXISTS user_cohorts (
  id SERIAL PRIMARY KEY,
  cohort_month DATE NOT NULL,
  game_type VARCHAR(50) NOT NULL,
  total_users INTEGER DEFAULT 0,
  retained_month_1 INTEGER DEFAULT 0,
  retained_month_2 INTEGER DEFAULT 0,
  retained_month_3 INTEGER DEFAULT 0,
  retention_rate_m1 FLOAT DEFAULT 0,
  retention_rate_m2 FLOAT DEFAULT 0,
  retention_rate_m3 FLOAT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(cohort_month, game_type)
);

-- Funnel analytics
CREATE TABLE IF NOT EXISTS funnel_metrics (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  game_type VARCHAR(50) NOT NULL,
  stage VARCHAR(50) NOT NULL,
  users_entered INTEGER DEFAULT 0,
  users_completed INTEGER DEFAULT 0,
  conversion_rate FLOAT DEFAULT 0,
  avg_time_in_stage FLOAT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- PERFORMANCE METRICS
-- ============================================

-- API performance tracking
CREATE TABLE IF NOT EXISTS api_performance (
  id SERIAL PRIMARY KEY,
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  response_time_ms INTEGER NOT NULL,
  status_code INTEGER NOT NULL,
  game_type VARCHAR(50),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Database query performance
CREATE TABLE IF NOT EXISTS query_performance (
  id SERIAL PRIMARY KEY,
  query_name VARCHAR(255) NOT NULL,
  execution_time_ms INTEGER NOT NULL,
  rows_affected INTEGER,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ADVANCED ANALYTICS VIEWS
-- ============================================

-- Overall game statistics
CREATE OR REPLACE VIEW v_game_overview AS
SELECT
  game_type,
  COUNT(DISTINCT session_id) as total_sessions,
  COUNT(DISTINCT session_id) FILTER (WHERE completed = true) as completed_sessions,
  ROUND(100.0 * COUNT(DISTINCT session_id) FILTER (WHERE completed = true) / NULLIF(COUNT(DISTINCT session_id), 0), 2) as completion_rate,
  ROUND(AVG(total_time_spent), 2) as avg_session_time_seconds,
  ROUND(AVG(questions_viewed), 2) as avg_questions_viewed,
  ROUND(AVG(questions_answered), 2) as avg_questions_answered,
  ROUND(AVG(dropped_off_at_question), 2) as avg_dropout_point,
  MIN(started_at) as first_session,
  MAX(started_at) as last_session
FROM user_sessions
GROUP BY game_type;

-- Daily active users (DAU)
CREATE OR REPLACE VIEW v_daily_active_users AS
SELECT
  DATE(started_at) as date,
  game_type,
  COUNT(DISTINCT session_id) as dau,
  COUNT(DISTINCT session_id) FILTER (WHERE completed = true) as completed_dau,
  ROUND(AVG(total_time_spent), 2) as avg_time_spent,
  COUNT(*) FILTER (WHERE questions_answered > 0) as engaged_users
FROM user_sessions
WHERE started_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE(started_at), game_type
ORDER BY date DESC, game_type;

-- Weekly active users (WAU)
CREATE OR REPLACE VIEW v_weekly_active_users AS
SELECT
  DATE_TRUNC('week', started_at) as week,
  game_type,
  COUNT(DISTINCT session_id) as wau,
  COUNT(DISTINCT DATE(started_at)) as active_days,
  ROUND(AVG(total_time_spent), 2) as avg_time_spent
FROM user_sessions
WHERE started_at >= CURRENT_DATE - INTERVAL '180 days'
GROUP BY DATE_TRUNC('week', started_at), game_type
ORDER BY week DESC, game_type;

-- Monthly active users (MAU)
CREATE OR REPLACE VIEW v_monthly_active_users AS
SELECT
  DATE_TRUNC('month', started_at) as month,
  game_type,
  COUNT(DISTINCT session_id) as mau,
  COUNT(DISTINCT DATE(started_at)) as active_days,
  ROUND(AVG(total_time_spent), 2) as avg_time_spent,
  COUNT(*) as total_sessions
FROM user_sessions
WHERE started_at >= CURRENT_DATE - INTERVAL '365 days'
GROUP BY DATE_TRUNC('month', started_at), game_type
ORDER BY month DESC, game_type;

-- User engagement levels
CREATE OR REPLACE VIEW v_user_engagement AS
SELECT
  game_type,
  CASE
    WHEN questions_answered = 0 THEN 'Bounced'
    WHEN questions_answered < 3 THEN 'Low Engagement'
    WHEN questions_answered < 7 THEN 'Medium Engagement'
    WHEN questions_answered >= 7 AND completed = false THEN 'High Engagement (Incomplete)'
    WHEN completed = true THEN 'Completed'
  END as engagement_level,
  COUNT(*) as session_count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (PARTITION BY game_type), 2) as percentage,
  ROUND(AVG(total_time_spent), 2) as avg_time_spent
FROM user_sessions
WHERE started_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY game_type, engagement_level
ORDER BY game_type, session_count DESC;

-- Question performance analysis
CREATE OR REPLACE VIEW v_question_performance AS
SELECT
  game_type,
  question_index,
  COUNT(*) as total_attempts,
  COUNT(*) FILTER (WHERE is_correct = true) as correct_attempts,
  COUNT(*) FILTER (WHERE is_correct = false) as wrong_attempts,
  ROUND(100.0 * COUNT(*) FILTER (WHERE is_correct = true) / COUNT(*), 2) as success_rate,
  ROUND(AVG(attempts_used), 2) as avg_attempts,
  ROUND(AVG(time_to_answer), 2) as avg_time_seconds,
  MIN(time_to_answer) as fastest_time,
  MAX(time_to_answer) as slowest_time,
  CASE
    WHEN ROUND(100.0 * COUNT(*) FILTER (WHERE is_correct = true) / COUNT(*), 2) >= 80 THEN 'Easy'
    WHEN ROUND(100.0 * COUNT(*) FILTER (WHERE is_correct = true) / COUNT(*), 2) >= 50 THEN 'Medium'
    ELSE 'Hard'
  END as difficulty_level
FROM question_analytics
GROUP BY game_type, question_index
ORDER BY game_type, question_index;

-- Share platform effectiveness
CREATE OR REPLACE VIEW v_share_effectiveness AS
SELECT
  game_type,
  platform,
  COUNT(*) as total_shares,
  COUNT(DISTINCT session_id) as unique_sharers,
  COUNT(DISTINCT question_index) as questions_shared,
  ROUND(AVG(question_index), 2) as avg_question_at_share,
  DATE(MIN(shared_at)) as first_share,
  DATE(MAX(shared_at)) as last_share
FROM share_analytics
GROUP BY game_type, platform
ORDER BY game_type, total_shares DESC;

-- Hourly activity patterns
CREATE OR REPLACE VIEW v_hourly_patterns AS
SELECT
  game_type,
  EXTRACT(HOUR FROM started_at) as hour_of_day,
  COUNT(*) as session_count,
  ROUND(AVG(total_time_spent), 2) as avg_time_spent,
  COUNT(*) FILTER (WHERE completed = true) as completed_sessions,
  ROUND(100.0 * COUNT(*) FILTER (WHERE completed = true) / COUNT(*), 2) as completion_rate
FROM user_sessions
WHERE started_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY game_type, EXTRACT(HOUR FROM started_at)
ORDER BY game_type, hour_of_day;

-- Day of week patterns
CREATE OR REPLACE VIEW v_weekly_patterns AS
SELECT
  game_type,
  TO_CHAR(started_at, 'Day') as day_of_week,
  EXTRACT(DOW FROM started_at) as day_number,
  COUNT(*) as session_count,
  ROUND(AVG(total_time_spent), 2) as avg_time_spent,
  COUNT(*) FILTER (WHERE completed = true) as completed_sessions,
  ROUND(100.0 * COUNT(*) FILTER (WHERE completed = true) / COUNT(*), 2) as completion_rate
FROM user_sessions
WHERE started_at >= CURRENT_DATE - INTERVAL '60 days'
GROUP BY game_type, TO_CHAR(started_at, 'Day'), EXTRACT(DOW FROM started_at)
ORDER BY game_type, day_number;

-- Session duration distribution
CREATE OR REPLACE VIEW v_session_duration_distribution AS
SELECT
  game_type,
  CASE
    WHEN total_time_spent < 60 THEN '< 1 min'
    WHEN total_time_spent < 180 THEN '1-3 min'
    WHEN total_time_spent < 300 THEN '3-5 min'
    WHEN total_time_spent < 600 THEN '5-10 min'
    WHEN total_time_spent < 900 THEN '10-15 min'
    ELSE '> 15 min'
  END as duration_bucket,
  COUNT(*) as session_count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (PARTITION BY game_type), 2) as percentage
FROM user_sessions
WHERE started_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY game_type, duration_bucket
ORDER BY game_type, session_count DESC;

-- Dropout analysis by question
CREATE OR REPLACE VIEW v_dropout_analysis AS
SELECT
  game_type,
  dropped_off_at_question,
  COUNT(*) as dropout_count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (PARTITION BY game_type), 2) as dropout_percentage,
  ROUND(AVG(total_time_spent), 2) as avg_time_before_dropout,
  ROUND(AVG(questions_answered), 2) as avg_questions_answered
FROM user_sessions
WHERE dropped_off_at_question IS NOT NULL
  AND started_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY game_type, dropped_off_at_question
ORDER BY game_type, dropout_count DESC;

-- Cross-game analysis
CREATE OR REPLACE VIEW v_cross_game_comparison AS
SELECT
  game_type,
  COUNT(DISTINCT session_id) as total_sessions,
  ROUND(100.0 * COUNT(*) FILTER (WHERE completed = true) / COUNT(*), 2) as completion_rate,
  ROUND(AVG(total_time_spent), 2) as avg_session_duration,
  ROUND(AVG(questions_answered), 2) as avg_questions_answered,
  (SELECT COUNT(*) FROM share_analytics sa WHERE sa.game_type = us.game_type) as total_shares,
  ROUND((SELECT COUNT(*) FROM share_analytics sa WHERE sa.game_type = us.game_type)::FLOAT / COUNT(*) * 100, 2) as share_rate
FROM user_sessions us
WHERE started_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY game_type
ORDER BY total_sessions DESC;

-- Player retention (7-day)
CREATE OR REPLACE VIEW v_player_retention_7d AS
SELECT
  game_type,
  DATE(started_at) as cohort_date,
  COUNT(DISTINCT session_id) as initial_users,
  COUNT(DISTINCT CASE
    WHEN EXISTS (
      SELECT 1 FROM user_sessions us2
      WHERE us2.session_id = user_sessions.session_id
      AND DATE(us2.started_at) BETWEEN DATE(user_sessions.started_at) + 1 AND DATE(user_sessions.started_at) + 7
    ) THEN session_id
  END) as retained_7d,
  ROUND(100.0 * COUNT(DISTINCT CASE
    WHEN EXISTS (
      SELECT 1 FROM user_sessions us2
      WHERE us2.session_id = user_sessions.session_id
      AND DATE(us2.started_at) BETWEEN DATE(user_sessions.started_at) + 1 AND DATE(user_sessions.started_at) + 7
    ) THEN session_id
  END) / NULLIF(COUNT(DISTINCT session_id), 0), 2) as retention_rate_7d
FROM user_sessions
WHERE started_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY game_type, DATE(started_at)
ORDER BY cohort_date DESC, game_type;

-- Event type distribution
CREATE OR REPLACE VIEW v_event_distribution AS
SELECT
  game_type,
  event_type,
  COUNT(*) as event_count,
  COUNT(DISTINCT session_id) as unique_sessions,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (PARTITION BY game_type), 2) as percentage,
  MIN(timestamp) as first_occurrence,
  MAX(timestamp) as last_occurrence
FROM events
WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY game_type, event_type
ORDER BY game_type, event_count DESC;

-- Game-specific leaderboard
CREATE OR REPLACE VIEW v_leaderboard AS
SELECT
  game_type,
  player_name,
  player_email,
  MAX(score) as best_score,
  MAX(correct_count) as best_correct_count,
  MIN(duration_seconds) as fastest_completion,
  COUNT(*) as total_games_played,
  ROUND(AVG(score), 2) as avg_score,
  ROW_NUMBER() OVER (PARTITION BY game_type ORDER BY MAX(score) DESC, MIN(duration_seconds) ASC) as rank
FROM game_submissions
GROUP BY game_type, player_name, player_email
ORDER BY game_type, rank;

-- ============================================
-- MATERIALIZED VIEWS (For Performance)
-- ============================================

-- Materialized view for dashboard (refresh hourly)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_dashboard_stats AS
SELECT
  game_type,
  COUNT(DISTINCT session_id) as total_sessions,
  COUNT(DISTINCT DATE(started_at)) as active_days,
  COUNT(*) FILTER (WHERE started_at >= CURRENT_DATE) as today_sessions,
  COUNT(*) FILTER (WHERE started_at >= CURRENT_DATE - 1 AND started_at < CURRENT_DATE) as yesterday_sessions,
  COUNT(*) FILTER (WHERE started_at >= CURRENT_DATE - 7) as week_sessions,
  COUNT(*) FILTER (WHERE started_at >= DATE_TRUNC('month', CURRENT_DATE)) as month_sessions,
  ROUND(AVG(total_time_spent), 2) as avg_session_duration,
  ROUND(100.0 * COUNT(*) FILTER (WHERE completed = true) / COUNT(*), 2) as completion_rate,
  MAX(started_at) as last_session_at
FROM user_sessions
WHERE started_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY game_type;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_dashboard_stats_game_type ON mv_dashboard_stats(game_type);

-- ============================================
-- INDEXES FOR ANALYTICS PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_sessions_started_at ON user_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_game_type_started_at ON user_sessions(game_type, started_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_completed ON user_sessions(completed);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
CREATE INDEX IF NOT EXISTS idx_events_game_type_timestamp ON events(game_type, timestamp);
CREATE INDEX IF NOT EXISTS idx_question_analytics_game_type_question ON question_analytics(game_type, question_index);
CREATE INDEX IF NOT EXISTS idx_share_analytics_game_type_platform ON share_analytics(game_type, platform);
CREATE INDEX IF NOT EXISTS idx_game_submissions_game_type ON game_submissions(game_type);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_date_game ON daily_metrics(date, game_type);
CREATE INDEX IF NOT EXISTS idx_api_performance_endpoint ON api_performance(endpoint);

-- ============================================
-- FUNCTIONS FOR ANALYTICS
-- ============================================

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_dashboard_stats;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate daily metrics
CREATE OR REPLACE FUNCTION calculate_daily_metrics(target_date DATE, target_game_type VARCHAR)
RETURNS void AS $$
BEGIN
  INSERT INTO daily_metrics (
    date, game_type, total_sessions, unique_users, completed_sessions,
    dropped_sessions, avg_session_duration, avg_questions_viewed,
    avg_questions_answered, total_shares, completion_rate
  )
  SELECT
    target_date,
    target_game_type,
    COUNT(*),
    COUNT(DISTINCT session_id),
    COUNT(*) FILTER (WHERE completed = true),
    COUNT(*) FILTER (WHERE dropped_off_at_question IS NOT NULL),
    ROUND(AVG(total_time_spent), 2),
    ROUND(AVG(questions_viewed), 2),
    ROUND(AVG(questions_answered), 2),
    (SELECT COUNT(*) FROM share_analytics
     WHERE DATE(shared_at) = target_date AND game_type = target_game_type),
    ROUND(100.0 * COUNT(*) FILTER (WHERE completed = true) / COUNT(*), 2)
  FROM user_sessions
  WHERE DATE(started_at) = target_date AND game_type = target_game_type
  ON CONFLICT (date, game_type) DO UPDATE SET
    total_sessions = EXCLUDED.total_sessions,
    unique_users = EXCLUDED.unique_users,
    completed_sessions = EXCLUDED.completed_sessions,
    dropped_sessions = EXCLUDED.dropped_sessions,
    avg_session_duration = EXCLUDED.avg_session_duration,
    avg_questions_viewed = EXCLUDED.avg_questions_viewed,
    avg_questions_answered = EXCLUDED.avg_questions_answered,
    total_shares = EXCLUDED.total_shares,
    completion_rate = EXCLUDED.completion_rate;
END;
$$ LANGUAGE plpgsql;

-- Function to update question difficulty metrics
CREATE OR REPLACE FUNCTION update_question_metrics(target_game_type VARCHAR)
RETURNS void AS $$
BEGIN
  INSERT INTO question_difficulty_metrics (
    game_type, question_index, total_attempts, correct_attempts,
    wrong_attempts, success_rate, avg_attempts, avg_time_seconds
  )
  SELECT
    target_game_type,
    question_index,
    COUNT(*),
    COUNT(*) FILTER (WHERE is_correct = true),
    COUNT(*) FILTER (WHERE is_correct = false),
    ROUND(100.0 * COUNT(*) FILTER (WHERE is_correct = true) / COUNT(*), 2),
    ROUND(AVG(attempts_used), 2),
    ROUND(AVG(time_to_answer), 2)
  FROM question_analytics
  WHERE game_type = target_game_type
  GROUP BY question_index
  ON CONFLICT (game_type, question_index) DO UPDATE SET
    total_attempts = EXCLUDED.total_attempts,
    correct_attempts = EXCLUDED.correct_attempts,
    wrong_attempts = EXCLUDED.wrong_attempts,
    success_rate = EXCLUDED.success_rate,
    avg_attempts = EXCLUDED.avg_attempts,
    avg_time_seconds = EXCLUDED.avg_time_seconds,
    last_updated = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SCHEDULED JOBS SETUP (PostgreSQL pg_cron)
-- ============================================
-- Note: Requires pg_cron extension
-- Uncomment if pg_cron is available

-- Refresh materialized views every hour
-- SELECT cron.schedule('refresh-analytics', '0 * * * *', 'SELECT refresh_analytics_views()');

-- Calculate daily metrics every day at midnight
-- SELECT cron.schedule('daily-metrics', '0 0 * * *', $$
--   SELECT calculate_daily_metrics(CURRENT_DATE - 1, game_type)
--   FROM (SELECT DISTINCT game_type FROM user_sessions) games
-- $$);

-- ============================================
-- NOTES
-- ============================================
--
-- To refresh analytics manually:
-- SELECT refresh_analytics_views();
-- SELECT calculate_daily_metrics(CURRENT_DATE, 'teammates');
-- SELECT update_question_metrics('teammates');
--
-- To get dashboard data:
-- SELECT * FROM mv_dashboard_stats;
--
-- To analyze trends:
-- SELECT * FROM v_daily_active_users WHERE date >= CURRENT_DATE - 30;
--
