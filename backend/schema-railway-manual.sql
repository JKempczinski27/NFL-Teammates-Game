-- ============================================
-- MANUAL DATABASE SETUP FOR RAILWAY
-- Run this directly in Railway's Query interface
-- ============================================

-- Drop existing tables if they exist (clean slate)
DROP TABLE IF EXISTS player_updated CASCADE;
DROP TABLE IF EXISTS trivia_players CASCADE;
DROP TABLE IF EXISTS journeyman_players CASCADE;
DROP TABLE IF EXISTS players CASCADE;

-- ============================================
-- CREATE CONSOLIDATED PLAYERS TABLE
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

  -- Game type tracking
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
  typical_play_time VARCHAR(20),
  avg_time_per_question FLOAT DEFAULT 0,

  -- GDPR and data protection
  consents JSONB,
  data_deletion_requested BOOLEAN DEFAULT FALSE,
  data_deletion_requested_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_game_played_at TIMESTAMP WITH TIME ZONE,

  -- Additional flexible data storage
  metadata JSONB,
  event_history JSONB,

  -- Constraints
  UNIQUE(email)
);

-- ============================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_players_email ON players(email);
CREATE INDEX idx_players_session_id ON players(session_id);
CREATE INDEX idx_players_game_type ON players(game_type);
CREATE INDEX idx_players_created_at ON players(created_at);
CREATE INDEX idx_players_last_activity ON players(last_activity_at);
CREATE INDEX idx_players_favorite_team ON players(favorite_team);
CREATE INDEX idx_players_trivia_score ON players(trivia_score);
CREATE INDEX idx_players_journeyman_correct ON players(journeyman_correct_count);

-- GIN indexes for JSONB columns
CREATE INDEX idx_players_metadata ON players USING GIN(metadata);
CREATE INDEX idx_players_consents ON players USING GIN(consents);
CREATE INDEX idx_players_event_history ON players USING GIN(event_history);
CREATE INDEX idx_players_games_played ON players USING GIN(games_played);

-- ============================================
-- VERIFY TABLES CREATED
-- ============================================

SELECT
    table_name,
    (SELECT COUNT(*)
     FROM information_schema.columns
     WHERE table_name = t.table_name AND table_schema = 'public') as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
ORDER BY table_name;
