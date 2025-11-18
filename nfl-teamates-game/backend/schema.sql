-- Comprehensive User Tracking Schema for NFL Teammates Game
-- This schema tracks user answers, timing, session behavior, and engagement metrics

-- ============================================================================
-- TABLE: user_sessions
-- Purpose: Track overall user sessions and metadata
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_sessions INTEGER DEFAULT 1,
    total_games_played INTEGER DEFAULT 0,
    total_questions_answered INTEGER DEFAULT 0,
    total_correct_answers INTEGER DEFAULT 0,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLE: game_sessions
-- Purpose: Track individual game play sessions
-- ============================================================================
CREATE TABLE IF NOT EXISTS game_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    game_id VARCHAR(100) NOT NULL,
    game_name VARCHAR(255) NOT NULL,
    started_at TIMESTAMP NOT NULL,
    ended_at TIMESTAMP,
    duration_seconds DECIMAL(10,2),
    questions_attempted INTEGER DEFAULT 0,
    questions_correct INTEGER DEFAULT 0,
    session_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES user_sessions(session_id) ON DELETE CASCADE
);

-- Index for faster session queries
CREATE INDEX IF NOT EXISTS idx_game_sessions_session_id ON game_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_date ON game_sessions(session_date);

-- ============================================================================
-- TABLE: question_attempts
-- Purpose: Track every answer attempt for each question
-- ============================================================================
CREATE TABLE IF NOT EXISTS question_attempts (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    game_session_id INTEGER,
    game_id VARCHAR(100) NOT NULL,
    question_index INTEGER NOT NULL,
    user_answer TEXT,
    correct_answer TEXT,
    is_correct BOOLEAN NOT NULL,
    attempt_number INTEGER NOT NULL,
    attempts_remaining INTEGER,
    time_spent_seconds DECIMAL(10,2),
    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES user_sessions(session_id) ON DELETE CASCADE,
    FOREIGN KEY (game_session_id) REFERENCES game_sessions(id) ON DELETE CASCADE
);

-- Indexes for analysis queries
CREATE INDEX IF NOT EXISTS idx_question_attempts_session ON question_attempts(session_id);
CREATE INDEX IF NOT EXISTS idx_question_attempts_game_session ON question_attempts(game_session_id);
CREATE INDEX IF NOT EXISTS idx_question_attempts_correctness ON question_attempts(is_correct);

-- ============================================================================
-- TABLE: user_engagement_events
-- Purpose: Track all user interaction events (shares, page views, etc.)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_engagement_events (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB,
    event_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES user_sessions(session_id) ON DELETE CASCADE
);

-- Index for event type queries
CREATE INDEX IF NOT EXISTS idx_engagement_events_type ON user_engagement_events(event_type);
CREATE INDEX IF NOT EXISTS idx_engagement_events_session ON user_engagement_events(session_id);

-- ============================================================================
-- TABLE: daily_activity_summary
-- Purpose: Aggregate daily activity for frequency analysis
-- ============================================================================
CREATE TABLE IF NOT EXISTS daily_activity_summary (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    activity_date DATE NOT NULL,
    games_played INTEGER DEFAULT 0,
    questions_answered INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    total_time_seconds DECIMAL(10,2) DEFAULT 0,
    unique_games_played TEXT[], -- Array of game IDs played that day
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, activity_date),
    FOREIGN KEY (session_id) REFERENCES user_sessions(session_id) ON DELETE CASCADE
);

-- Index for frequency queries
CREATE INDEX IF NOT EXISTS idx_daily_activity_session ON daily_activity_summary(session_id);
CREATE INDEX IF NOT EXISTS idx_daily_activity_date ON daily_activity_summary(activity_date);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to update user_sessions last_seen timestamp
CREATE OR REPLACE FUNCTION update_session_last_seen()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE user_sessions
    SET
        last_seen = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE session_id = NEW.session_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update last_seen when new game session starts
CREATE TRIGGER trigger_update_last_seen
    AFTER INSERT ON game_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_session_last_seen();

-- ============================================================================
-- ANALYTICS VIEWS
-- ============================================================================

-- View: User engagement summary
CREATE OR REPLACE VIEW user_engagement_summary AS
SELECT
    us.session_id,
    us.first_seen,
    us.last_seen,
    us.total_sessions,
    us.total_games_played,
    us.total_questions_answered,
    us.total_correct_answers,
    CASE
        WHEN us.total_questions_answered > 0
        THEN ROUND((us.total_correct_answers::DECIMAL / us.total_questions_answered) * 100, 2)
        ELSE 0
    END as accuracy_percentage,
    COUNT(DISTINCT gs.session_date) as days_active,
    ROUND(EXTRACT(EPOCH FROM (us.last_seen - us.first_seen)) / 86400, 1) as days_since_first_visit
FROM user_sessions us
LEFT JOIN game_sessions gs ON us.session_id = gs.session_id
GROUP BY us.session_id, us.first_seen, us.last_seen, us.total_sessions,
         us.total_games_played, us.total_questions_answered, us.total_correct_answers;

-- View: Multi-game vs single-game behavior
CREATE OR REPLACE VIEW session_game_diversity AS
SELECT
    session_id,
    session_date,
    COUNT(DISTINCT game_id) as unique_games_played,
    COUNT(*) as total_game_sessions,
    CASE
        WHEN COUNT(DISTINCT game_id) > 1 THEN 'Multi-Game'
        ELSE 'Single-Game'
    END as session_type,
    SUM(duration_seconds) as total_session_time
FROM game_sessions
WHERE ended_at IS NOT NULL
GROUP BY session_id, session_date;

-- View: Question performance analysis
CREATE OR REPLACE VIEW question_performance AS
SELECT
    game_id,
    question_index,
    COUNT(*) as total_attempts,
    SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct_attempts,
    ROUND(AVG(time_spent_seconds), 2) as avg_time_seconds,
    ROUND(AVG(attempt_number), 2) as avg_attempts_to_solve
FROM question_attempts
GROUP BY game_id, question_index
ORDER BY game_id, question_index;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE user_sessions IS 'Stores aggregate session data for each unique user';
COMMENT ON TABLE game_sessions IS 'Tracks individual game play sessions with timing';
COMMENT ON TABLE question_attempts IS 'Records every answer attempt with timing and correctness';
COMMENT ON TABLE user_engagement_events IS 'Logs all user interaction events (shares, etc)';
COMMENT ON TABLE daily_activity_summary IS 'Daily aggregates for frequency analysis';
