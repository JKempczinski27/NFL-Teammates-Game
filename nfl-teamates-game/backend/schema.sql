-- NFL Teammates Game Database Schema
-- PostgreSQL Database Schema

-- Drop existing tables if they exist (in correct order due to foreign key constraints)
DROP TABLE IF EXISTS user_stats CASCADE;
DROP TABLE IF EXISTS question_players CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS team_relationships CASCADE;
DROP TABLE IF EXISTS players CASCADE;
DROP TABLE IF EXISTS teams CASCADE;

-- Teams table (referenced by team_relationships)
CREATE TABLE teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    city VARCHAR(100),
    abbreviation VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Players table
CREATE TABLE players (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    position VARCHAR(50),
    teams TEXT, -- Comma-separated list of team names for quick reference
    years_active VARCHAR(50), -- e.g., "2010-2020"
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Team relationships table (tracks which teams a player played for and when)
CREATE TABLE team_relationships (
    id SERIAL PRIMARY KEY,
    player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    year_start INTEGER NOT NULL,
    year_end INTEGER, -- NULL if currently active
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_years CHECK (year_end IS NULL OR year_end >= year_start)
);

-- Questions table
CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    answer VARCHAR(255) NOT NULL, -- The correct answer to the question
    difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard')),
    category VARCHAR(100), -- e.g., 'teammates', 'same-team', 'career-overlap'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Question players table (many-to-many relationship between questions and players)
CREATE TABLE question_players (
    id SERIAL PRIMARY KEY,
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_question_player UNIQUE (question_id, player_id)
);

-- User statistics table
CREATE TABLE user_stats (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL UNIQUE,
    questions_answered INTEGER DEFAULT 0,
    correct INTEGER DEFAULT 0,
    incorrect INTEGER DEFAULT 0,
    streak INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_players_name ON players(name);
CREATE INDEX idx_team_relationships_player_id ON team_relationships(player_id);
CREATE INDEX idx_team_relationships_team_id ON team_relationships(team_id);
CREATE INDEX idx_question_players_question_id ON question_players(question_id);
CREATE INDEX idx_question_players_player_id ON question_players(player_id);
CREATE INDEX idx_user_stats_session_id ON user_stats(session_id);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);
CREATE INDEX idx_questions_category ON questions(category);

-- Insert some common NFL teams
INSERT INTO teams (name, city, abbreviation) VALUES
    ('Arizona Cardinals', 'Arizona', 'ARI'),
    ('Atlanta Falcons', 'Atlanta', 'ATL'),
    ('Baltimore Ravens', 'Baltimore', 'BAL'),
    ('Buffalo Bills', 'Buffalo', 'BUF'),
    ('Carolina Panthers', 'Carolina', 'CAR'),
    ('Chicago Bears', 'Chicago', 'CHI'),
    ('Cincinnati Bengals', 'Cincinnati', 'CIN'),
    ('Cleveland Browns', 'Cleveland', 'CLE'),
    ('Dallas Cowboys', 'Dallas', 'DAL'),
    ('Denver Broncos', 'Denver', 'DEN'),
    ('Detroit Lions', 'Detroit', 'DET'),
    ('Green Bay Packers', 'Green Bay', 'GB'),
    ('Houston Texans', 'Houston', 'HOU'),
    ('Indianapolis Colts', 'Indianapolis', 'IND'),
    ('Jacksonville Jaguars', 'Jacksonville', 'JAX'),
    ('Kansas City Chiefs', 'Kansas City', 'KC'),
    ('Las Vegas Raiders', 'Las Vegas', 'LV'),
    ('Los Angeles Chargers', 'Los Angeles', 'LAC'),
    ('Los Angeles Rams', 'Los Angeles', 'LAR'),
    ('Miami Dolphins', 'Miami', 'MIA'),
    ('Minnesota Vikings', 'Minnesota', 'MIN'),
    ('New England Patriots', 'New England', 'NE'),
    ('New Orleans Saints', 'New Orleans', 'NO'),
    ('New York Giants', 'New York', 'NYG'),
    ('New York Jets', 'New York', 'NYJ'),
    ('Philadelphia Eagles', 'Philadelphia', 'PHI'),
    ('Pittsburgh Steelers', 'Pittsburgh', 'PIT'),
    ('San Francisco 49ers', 'San Francisco', 'SF'),
    ('Seattle Seahawks', 'Seattle', 'SEA'),
    ('Tampa Bay Buccaneers', 'Tampa Bay', 'TB'),
    ('Tennessee Titans', 'Tennessee', 'TEN'),
    ('Washington Commanders', 'Washington', 'WAS')
ON CONFLICT (name) DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE players IS 'Stores NFL player information';
COMMENT ON TABLE teams IS 'Stores NFL team information';
COMMENT ON TABLE team_relationships IS 'Tracks which teams each player has played for';
COMMENT ON TABLE questions IS 'Stores game questions';
COMMENT ON TABLE question_players IS 'Links players to questions they are associated with';
COMMENT ON TABLE user_stats IS 'Tracks user session statistics and performance';
