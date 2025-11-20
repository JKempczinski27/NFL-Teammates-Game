-- Analytics Database Schema for NFL Teammates Game

-- Main events table - stores all tracking events
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  event_data JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User sessions table - tracks engagement metrics
CREATE TABLE IF NOT EXISTS user_sessions (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) UNIQUE NOT NULL,
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
  question_index INTEGER NOT NULL,
  session_id VARCHAR(255) NOT NULL,
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
  platform VARCHAR(50) NOT NULL,
  question_index INTEGER,
  shared_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_events_session_id ON events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_question_analytics_question_index ON question_analytics(question_index);
CREATE INDEX IF NOT EXISTS idx_question_analytics_session_id ON question_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_share_analytics_platform ON share_analytics(platform);
CREATE INDEX IF NOT EXISTS idx_share_analytics_session_id ON share_analytics(session_id);

-- Legacy players table (keep existing if already created)
CREATE TABLE IF NOT EXISTS players (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- NFL Trivia Game players table
CREATE TABLE IF NOT EXISTS trivia_players (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  team VARCHAR(255),
  score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Journeyman Game players table
CREATE TABLE IF NOT EXISTS journeyman_players (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  session_id VARCHAR(255),
  game_type VARCHAR(100) DEFAULT 'journeyman',
  score INTEGER DEFAULT 0,
  guesses INTEGER DEFAULT 0,
  time_elapsed INTEGER DEFAULT 0,
  client_timestamp TIMESTAMP WITH TIME ZONE,
  browser_info JSONB,
  session_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for new tables
CREATE INDEX IF NOT EXISTS idx_trivia_players_email ON trivia_players(email);
CREATE INDEX IF NOT EXISTS idx_trivia_players_score ON trivia_players(score);
CREATE INDEX IF NOT EXISTS idx_journeyman_players_email ON journeyman_players(email);
CREATE INDEX IF NOT EXISTS idx_journeyman_players_session_id ON journeyman_players(session_id);
CREATE INDEX IF NOT EXISTS idx_journeyman_players_score ON journeyman_players(score);
