-- NFL Teammates Game Database Schema
-- This script creates all the necessary tables for the consolidated NFL games backend
-- Supports: NFL Teammates Game, NFL Trivia Game, and Journeyman Game

-- Drop tables if they exist (for re-running the script)
DROP TABLE IF EXISTS player_updated CASCADE;
DROP TABLE IF EXISTS players CASCADE;
DROP TABLE IF EXISTS trivia_players CASCADE;
DROP TABLE IF EXISTS journeyman_players CASCADE;

-- Create players table (NFL Teammates Game)
-- Stores player information for game participants
CREATE TABLE players (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create player_updated table (NFL Teammates Game)
-- Tracks player activity and events during gameplay
CREATE TABLE player_updated (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255),
    event_type VARCHAR(100),
    event_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create trivia_players table (NFL Trivia Game)
-- Stores player information and scores for trivia game
CREATE TABLE trivia_players (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    team VARCHAR(255) NOT NULL,
    score INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create journeyman_players table (Journeyman Game)
-- Stores player information and game data for Journeyman career journey game
CREATE TABLE journeyman_players (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    correct_count INTEGER DEFAULT 0,
    duration_seconds INTEGER DEFAULT 0,
    game_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
-- NFL Teammates Game indexes
CREATE INDEX idx_players_email ON players(email);
CREATE INDEX idx_players_created_at ON players(created_at);
CREATE INDEX idx_player_updated_session ON player_updated(session_id);
CREATE INDEX idx_player_updated_event_type ON player_updated(event_type);
CREATE INDEX idx_player_updated_created_at ON player_updated(created_at);

-- NFL Trivia Game indexes
CREATE INDEX idx_trivia_players_email ON trivia_players(email);
CREATE INDEX idx_trivia_players_score ON trivia_players(score);
CREATE INDEX idx_trivia_players_created_at ON trivia_players(created_at);

-- Journeyman Game indexes
CREATE INDEX idx_journeyman_players_email ON journeyman_players(email);
CREATE INDEX idx_journeyman_players_correct_count ON journeyman_players(correct_count);
CREATE INDEX idx_journeyman_players_created_at ON journeyman_players(created_at);

-- Display created tables
SELECT
    table_name,
    (SELECT COUNT(*)
     FROM information_schema.columns
     WHERE table_name = t.table_name AND table_schema = 'public') as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
ORDER BY table_name;
