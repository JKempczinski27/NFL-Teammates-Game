-- ============================================
-- CONSOLIDATED SINGLE-TABLE DATABASE SCHEMA
-- All player data in ONE comprehensive table
-- ============================================
-- This schema consolidates ALL player and game data into a single table
-- for maximum simplicity and ease of management

-- Drop existing tables if they exist
DROP TABLE IF EXISTS player_updated CASCADE;
DROP TABLE IF EXISTS trivia_players CASCADE;
DROP TABLE IF EXISTS journeyman_players CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS question_analytics CASCADE;
DROP TABLE IF EXISTS share_analytics CASCADE;
DROP TABLE IF EXISTS game_submissions CASCADE;
DROP TABLE IF EXISTS user_consents CASCADE;
DROP TABLE IF EXISTS data_deletion_requests CASCADE;
DROP TABLE IF EXISTS daily_metrics CASCADE;
DROP TABLE IF EXISTS hourly_metrics CASCADE;
DROP TABLE IF EXISTS question_difficulty_metrics CASCADE;
DROP TABLE IF EXISTS user_cohorts CASCADE;
DROP TABLE IF EXISTS funnel_metrics CASCADE;
DROP TABLE IF EXISTS api_performance CASCADE;
DROP TABLE IF EXISTS query_performance CASCADE;
DROP MATERIALIZED VIEW IF EXISTS mv_dashboard_stats CASCADE;
DROP VIEW IF EXISTS v_game_overview CASCADE;
DROP VIEW IF EXISTS v_daily_active_users CASCADE;
DROP VIEW IF EXISTS v_weekly_active_users CASCADE;
DROP VIEW IF EXISTS v_monthly_active_users CASCADE;
DROP VIEW IF EXISTS v_user_engagement CASCADE;
DROP VIEW IF EXISTS v_question_performance CASCADE;
DROP VIEW IF EXISTS v_share_effectiveness CASCADE;
DROP VIEW IF EXISTS v_hourly_patterns CASCADE;
DROP VIEW IF EXISTS v_weekly_patterns CASCADE;
DROP VIEW IF EXISTS v_session_duration_distribution CASCADE;
DROP VIEW IF EXISTS v_dropout_analysis CASCADE;
DROP VIEW IF EXISTS v_cross_game_comparison CASCADE;
DROP VIEW IF EXISTS v_player_retention_7d CASCADE;
DROP VIEW IF EXISTS v_event_distribution CASCADE;
DROP VIEW IF EXISTS v_leaderboard CASCADE;
DROP VIEW IF EXISTS game_session_stats CASCADE;
DROP VIEW IF EXISTS question_difficulty_stats CASCADE;
DROP VIEW IF EXISTS share_platform_stats CASCADE;
DROP VIEW IF EXISTS daily_active_users CASCADE;
DROP TABLE IF EXISTS players CASCADE;

-- ============================================
-- SINGLE COMPREHENSIVE PLAYER DATA TABLE
-- This table contains ALL player information and game data
-- ============================================

CREATE TABLE players (
  -- Primary key
  id SERIAL PRIMARY KEY,

  -- Basic player information (shared across all games)
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,

  -- Session tracking
  session_id VARCHAR(255),
  last_session_id VARCHAR(255),
  total_sessions INTEGER DEFAULT 0,

  -- Game type tracking (which game they last played or prefer)
  game_type VARCHAR(50), -- 'teammates', 'journeyman', 'trivia'
  games_played TEXT[], -- Array of games they've played

  -- NFL Trivia specific data
  favorite_team VARCHAR(255),
  trivia_score INTEGER DEFAULT 0,
  trivia_best_score INTEGER DEFAULT 0,
  trivia_games_played INTEGER DEFAULT 0,

  -- Journeyman specific data
  journeyman_correct_count INTEGER DEFAULT 0,
  journeyman_best_correct INTEGER DEFAULT 0,
  journeyman_duration_seconds INTEGER DEFAULT 0,
  journeyman_best_time INTEGER,
  journeyman_games_played INTEGER DEFAULT 0,
  journeyman_game_data JSONB,

  -- NFL Teammates specific data
  teammates_games_played INTEGER DEFAULT 0,
  teammates_best_score INTEGER DEFAULT 0,
  teammates_completion_count INTEGER DEFAULT 0,

  -- Overall gameplay statistics
  total_questions_viewed INTEGER DEFAULT 0,
  total_questions_answered INTEGER DEFAULT 0,
  total_correct_answers INTEGER DEFAULT 0,
  total_wrong_answers INTEGER DEFAULT 0,
  total_time_spent_seconds INTEGER DEFAULT 0,
  total_shares INTEGER DEFAULT 0,

  -- Session information
  current_session_started_at TIMESTAMP WITH TIME ZONE,
  last_activity_at TIMESTAMP WITH TIME ZONE,
  last_completed_at TIMESTAMP WITH TIME ZONE,
  avg_session_duration FLOAT DEFAULT 0,

  -- Engagement metrics
  completion_rate FLOAT DEFAULT 0,
  avg_questions_per_session FLOAT DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,

  -- Behavioral data
  preferred_share_platform VARCHAR(50),
  typical_play_time VARCHAR(20), -- 'morning', 'afternoon', 'evening', 'night'
  avg_time_per_question FLOAT DEFAULT 0,

  -- GDPR and data protection
  consents JSONB, -- Store all consent types and timestamps
  data_deletion_requested BOOLEAN DEFAULT FALSE,
  data_deletion_requested_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_game_played_at TIMESTAMP WITH TIME ZONE,

  -- Additional flexible data storage
  metadata JSONB, -- Store any additional game-specific or custom data
  event_history JSONB, -- Store recent important events

  -- Constraints
  UNIQUE(email)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_players_email ON players(email);
CREATE INDEX idx_players_session_id ON players(session_id);
CREATE INDEX idx_players_game_type ON players(game_type);
CREATE INDEX idx_players_created_at ON players(created_at);
CREATE INDEX idx_players_last_activity ON players(last_activity_at);
CREATE INDEX idx_players_favorite_team ON players(favorite_team);
CREATE INDEX idx_players_trivia_score ON players(trivia_score);
CREATE INDEX idx_players_journeyman_correct ON players(journeyman_correct_count);

-- GIN index for JSONB columns for faster queries
CREATE INDEX idx_players_metadata ON players USING GIN(metadata);
CREATE INDEX idx_players_consents ON players USING GIN(consents);
CREATE INDEX idx_players_event_history ON players USING GIN(event_history);
CREATE INDEX idx_players_games_played ON players USING GIN(games_played);

-- ============================================
-- UTILITY FUNCTIONS
-- ============================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_players_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update timestamp on every update
CREATE TRIGGER trigger_update_players_timestamp
BEFORE UPDATE ON players
FOR EACH ROW
EXECUTE FUNCTION update_players_timestamp();

-- Function to calculate player statistics
CREATE OR REPLACE FUNCTION calculate_player_stats(player_email VARCHAR)
RETURNS void AS $$
DECLARE
  player_record RECORD;
BEGIN
  SELECT * INTO player_record FROM players WHERE email = player_email;

  IF player_record IS NOT NULL THEN
    UPDATE players
    SET
      completion_rate = CASE
        WHEN total_sessions > 0
        THEN (teammates_completion_count::FLOAT / total_sessions) * 100
        ELSE 0
      END,
      avg_questions_per_session = CASE
        WHEN total_sessions > 0
        THEN total_questions_answered::FLOAT / total_sessions
        ELSE 0
      END,
      avg_session_duration = CASE
        WHEN total_sessions > 0
        THEN total_time_spent_seconds::FLOAT / total_sessions
        ELSE 0
      END,
      avg_time_per_question = CASE
        WHEN total_questions_answered > 0
        THEN total_time_spent_seconds::FLOAT / total_questions_answered
        ELSE 0
      END
    WHERE email = player_email;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- HELPER VIEWS FOR ANALYTICS
-- ============================================

-- Top players by trivia score
CREATE OR REPLACE VIEW v_trivia_leaderboard AS
SELECT
  id, name, email, favorite_team,
  trivia_best_score, trivia_games_played,
  ROUND(trivia_best_score::FLOAT / NULLIF(trivia_games_played, 0), 2) as avg_score_per_game,
  last_game_played_at
FROM players
WHERE trivia_games_played > 0
ORDER BY trivia_best_score DESC, trivia_games_played DESC
LIMIT 100;

-- Top players by journeyman performance
CREATE OR REPLACE VIEW v_journeyman_leaderboard AS
SELECT
  id, name, email,
  journeyman_best_correct, journeyman_best_time,
  journeyman_games_played,
  last_game_played_at
FROM players
WHERE journeyman_games_played > 0
ORDER BY journeyman_best_correct DESC, journeyman_best_time ASC
LIMIT 100;

-- Most engaged players overall
CREATE OR REPLACE VIEW v_most_engaged_players AS
SELECT
  id, name, email,
  total_sessions, total_questions_answered,
  total_time_spent_seconds,
  ROUND(completion_rate, 2) as completion_rate_pct,
  array_length(games_played, 1) as unique_games_played,
  last_activity_at
FROM players
WHERE total_sessions > 0
ORDER BY total_sessions DESC, total_questions_answered DESC
LIMIT 100;

-- Recent players
CREATE OR REPLACE VIEW v_recent_players AS
SELECT
  id, name, email, game_type,
  last_activity_at, total_sessions,
  total_questions_answered, completion_rate
FROM players
WHERE last_activity_at >= CURRENT_TIMESTAMP - INTERVAL '7 days'
ORDER BY last_activity_at DESC
LIMIT 100;

-- Game popularity statistics
CREATE OR REPLACE VIEW v_game_popularity AS
SELECT
  game_type,
  COUNT(*) as player_count,
  SUM(total_sessions) as total_sessions,
  AVG(completion_rate) as avg_completion_rate,
  AVG(total_questions_answered) as avg_questions_answered
FROM players
WHERE game_type IS NOT NULL
GROUP BY game_type
ORDER BY player_count DESC;

-- ============================================
-- MIGRATION HELPERS
-- ============================================

-- Function to merge player data from old tables
-- This will be used during migration
CREATE OR REPLACE FUNCTION merge_player_data(
  p_name VARCHAR,
  p_email VARCHAR,
  p_game_type VARCHAR,
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS INTEGER AS $$
DECLARE
  player_id INTEGER;
BEGIN
  -- Insert or update player
  INSERT INTO players (name, email, game_type, games_played, metadata, created_at)
  VALUES (
    p_name,
    p_email,
    p_game_type,
    ARRAY[p_game_type],
    p_metadata,
    CURRENT_TIMESTAMP
  )
  ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    games_played = CASE
      WHEN players.games_played @> ARRAY[p_game_type] THEN players.games_played
      ELSE array_append(players.games_played, p_game_type)
    END,
    metadata = players.metadata || p_metadata,
    updated_at = CURRENT_TIMESTAMP
  RETURNING id INTO player_id;

  RETURN player_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SAMPLE QUERIES FOR REFERENCE
-- ============================================

-- Get all players who played trivia
-- SELECT * FROM players WHERE 'trivia' = ANY(games_played);

-- Get players with high engagement
-- SELECT * FROM v_most_engaged_players WHERE total_sessions > 5;

-- Get trivia leaderboard
-- SELECT * FROM v_trivia_leaderboard;

-- Get journeyman leaderboard
-- SELECT * FROM v_journeyman_leaderboard;

-- Update player stats after gameplay
-- SELECT calculate_player_stats('player@example.com');

-- Add new player or update existing
-- SELECT merge_player_data('John Doe', 'john@example.com', 'trivia', '{"team": "Patriots"}'::JSONB);

-- ============================================
-- NOTES
-- ============================================
-- This single-table design:
-- 1. Consolidates ALL player data into one table
-- 2. Uses JSONB for flexible game-specific data
-- 3. Tracks cross-game player behavior
-- 4. Maintains game-specific metrics (trivia scores, journeyman times, etc.)
-- 5. Includes GDPR compliance fields
-- 6. Provides views for common analytics queries
-- 7. Uses PostgreSQL arrays for multi-value fields (games_played)
-- 8. Automatically updates timestamps
-- 9. Includes helper functions for data manipulation
-- 10. Eliminates the need for multiple player tables
