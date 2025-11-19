-- NFL Teammates Game Database Schema
-- This script creates all the necessary tables for the NFL teammates game

-- Drop tables if they exist (for re-running the script)
DROP TABLE IF EXISTS player_updated CASCADE;
DROP TABLE IF EXISTS players CASCADE;

-- Create players table
-- Stores player information for game participants
CREATE TABLE players (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create player_updated table
-- Tracks player activity and events during gameplay
CREATE TABLE player_updated (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255),
    event_type VARCHAR(100),
    event_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_players_email ON players(email);
CREATE INDEX idx_players_created_at ON players(created_at);
CREATE INDEX idx_player_updated_session ON player_updated(session_id);
CREATE INDEX idx_player_updated_event_type ON player_updated(event_type);
CREATE INDEX idx_player_updated_created_at ON player_updated(created_at);

-- Display created tables
SELECT
    table_name,
    (SELECT COUNT(*)
     FROM information_schema.columns
     WHERE table_name = t.table_name AND table_schema = 'public') as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
ORDER BY table_name;
