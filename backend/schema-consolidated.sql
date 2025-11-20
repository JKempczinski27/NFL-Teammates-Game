-- CONSOLIDATED DATABASE SCHEMA FOR ALL THREE NFL GAMES
-- This schema consolidates:
-- 1. NFL Teammates Game
-- 2. Journeyman
-- 3. NFL Trivia Game

-- ============================================
-- SHARED TABLES (Used by all games)
-- ============================================

-- Main events table - stores all tracking events from all games
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  game_type VARCHAR(50) NOT NULL, -- 'teammates', 'journeyman', 'trivia'
  event_type VARCHAR(100) NOT NULL,
  event_data JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User sessions table - tracks engagement metrics across all games
CREATE TABLE IF NOT EXISTS user_sessions (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) UNIQUE NOT NULL,
  game_type VARCHAR(50) NOT NULL, -- 'teammates', 'journeyman', 'trivia'
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP WITH TIME ZONE,
  total_time_spent INTEGER DEFAULT 0, -- in seconds
  questions_viewed INTEGER DEFAULT 0,
  questions_answered INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  dropped_off_at_question INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Question analytics - tracks difficulty vs success rate
CREATE TABLE IF NOT EXISTS question_analytics (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  game_type VARCHAR(50) NOT NULL, -- 'teammates', 'journeyman', 'trivia'
  question_index INTEGER NOT NULL,
  is_correct BOOLEAN NOT NULL,
  attempts_used INTEGER DEFAULT 1,
  time_to_answer INTEGER, -- in seconds
  answer_given VARCHAR(255),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Share analytics - tracks popular share methods
CREATE TABLE IF NOT EXISTS share_analytics (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  game_type VARCHAR(50) NOT NULL, -- 'teammates', 'journeyman', 'trivia'
  platform VARCHAR(50) NOT NULL,
  question_index INTEGER,
  shared_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- GAME-SPECIFIC TABLES
-- ============================================

-- Players table (shared across all games)
-- Stores player information with team preference
CREATE TABLE IF NOT EXISTS players (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  team VARCHAR(255), -- favorite team (for Trivia game)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Game data submissions (for Journeyman game)
CREATE TABLE IF NOT EXISTS game_submissions (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  player_name VARCHAR(255) NOT NULL,
  player_email VARCHAR(255) NOT NULL,
  game_type VARCHAR(50) NOT NULL,
  correct_count INTEGER DEFAULT 0,
  duration_seconds INTEGER DEFAULT 0,
  score INTEGER DEFAULT 0,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- GDPR and Data Protection (for Journeyman compliance features)
CREATE TABLE IF NOT EXISTS user_consents (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  consent_type VARCHAR(100) NOT NULL, -- 'analytics', 'marketing', 'essential'
  granted BOOLEAN NOT NULL,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  revoked_at TIMESTAMP WITH TIME ZONE,
  ip_address VARCHAR(45),
  user_agent TEXT,
  metadata JSONB
);

CREATE TABLE IF NOT EXISTS data_deletion_requests (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  notes TEXT
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Events table indexes
CREATE INDEX IF NOT EXISTS idx_events_session_id ON events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_game_type ON events(game_type);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);

-- User sessions indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_game_type ON user_sessions(game_type);
CREATE INDEX IF NOT EXISTS idx_user_sessions_started_at ON user_sessions(started_at);

-- Question analytics indexes
CREATE INDEX IF NOT EXISTS idx_question_analytics_question_index ON question_analytics(question_index);
CREATE INDEX IF NOT EXISTS idx_question_analytics_session_id ON question_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_question_analytics_game_type ON question_analytics(game_type);

-- Share analytics indexes
CREATE INDEX IF NOT EXISTS idx_share_analytics_platform ON share_analytics(platform);
CREATE INDEX IF NOT EXISTS idx_share_analytics_session_id ON share_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_share_analytics_game_type ON share_analytics(game_type);

-- Players table indexes
CREATE INDEX IF NOT EXISTS idx_players_email ON players(email);
CREATE INDEX IF NOT EXISTS idx_players_created_at ON players(created_at);

-- Game submissions indexes
CREATE INDEX IF NOT EXISTS idx_game_submissions_session_id ON game_submissions(session_id);
CREATE INDEX IF NOT EXISTS idx_game_submissions_email ON game_submissions(player_email);
CREATE INDEX IF NOT EXISTS idx_game_submissions_game_type ON game_submissions(game_type);

-- User consents indexes
CREATE INDEX IF NOT EXISTS idx_user_consents_user_id ON user_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_consents_consent_type ON user_consents(consent_type);

-- ============================================
-- ANALYTICS VIEWS
-- ============================================

-- View: Game-specific session statistics
CREATE OR REPLACE VIEW game_session_stats AS
SELECT
  game_type,
  COUNT(*) as total_sessions,
  COUNT(*) FILTER (WHERE completed = true) as completed_sessions,
  AVG(total_time_spent) as avg_time_spent,
  AVG(questions_answered) as avg_questions_answered,
  AVG(dropped_off_at_question) as avg_dropout_point
FROM user_sessions
GROUP BY game_type;

-- View: Question difficulty by game
CREATE OR REPLACE VIEW question_difficulty_stats AS
SELECT
  game_type,
  question_index,
  COUNT(*) as total_attempts,
  COUNT(*) FILTER (WHERE is_correct = true) as correct_attempts,
  ROUND(100.0 * COUNT(*) FILTER (WHERE is_correct = true) / COUNT(*), 2) as success_rate,
  AVG(attempts_used) as avg_attempts,
  AVG(time_to_answer) as avg_time_seconds
FROM question_analytics
GROUP BY game_type, question_index
ORDER BY game_type, question_index;

-- View: Platform share statistics
CREATE OR REPLACE VIEW share_platform_stats AS
SELECT
  game_type,
  platform,
  COUNT(*) as total_shares,
  COUNT(DISTINCT session_id) as unique_sharers
FROM share_analytics
GROUP BY game_type, platform
ORDER BY game_type, total_shares DESC;

-- View: Daily active users by game
CREATE OR REPLACE VIEW daily_active_users AS
SELECT
  game_type,
  DATE(started_at) as date,
  COUNT(DISTINCT session_id) as active_sessions,
  COUNT(*) FILTER (WHERE completed = true) as completed_sessions
FROM user_sessions
GROUP BY game_type, DATE(started_at)
ORDER BY date DESC, game_type;

-- ============================================
-- UTILITY FUNCTIONS
-- ============================================

-- Function to update player updated_at timestamp
CREATE OR REPLACE FUNCTION update_player_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_players_timestamp
BEFORE UPDATE ON players
FOR EACH ROW
EXECUTE FUNCTION update_player_timestamp();

-- ============================================
-- NOTES
-- ============================================
--
-- Game Type Values:
-- - 'teammates' = NFL Teammates Game
-- - 'journeyman' = Journeyman Game
-- - 'trivia' = NFL Trivia Game
--
-- This consolidated schema allows all three games to share:
-- - Common analytics and tracking infrastructure
-- - Player database
-- - Session management
-- - Event logging
--
-- While maintaining game-specific features:
-- - Game-specific data in game_submissions
-- - GDPR compliance features for Journeyman
-- - Team preferences for Trivia
--
