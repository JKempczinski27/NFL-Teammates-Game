-- Super Dashboard Database Tables
-- Authentication, Questions Management, Error Tracking, System Health

-- Admin Users Table
CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  role VARCHAR(50) DEFAULT 'admin', -- admin, viewer, editor
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Admin Sessions (for JWT tokens)
CREATE TABLE IF NOT EXISTS admin_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES admin_users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  ip_address VARCHAR(50),
  user_agent TEXT
);

-- Questions Storage (for all games)
CREATE TABLE IF NOT EXISTS questions (
  id SERIAL PRIMARY KEY,
  game_type VARCHAR(50) NOT NULL, -- teammates, journeyman, trivia
  question_type VARCHAR(50), -- player_identification, multiple_choice, true_false, etc.

  -- Question content
  question_text TEXT,
  question_data JSONB NOT NULL, -- Flexible structure for different question types

  -- Answer
  correct_answer TEXT NOT NULL,
  answer_options JSONB, -- For multiple choice: ["option1", "option2", ...]

  -- Metadata
  difficulty INTEGER DEFAULT 5, -- 1-10 scale
  category VARCHAR(100), -- team, player, history, stats, etc.
  tags JSONB, -- ["offense", "quarterback", "2020s"]

  -- Media
  image_urls JSONB, -- Array of image URLs for player photos, etc.
  video_url TEXT,

  -- Status
  status VARCHAR(50) DEFAULT 'draft', -- draft, active, archived
  is_active BOOLEAN DEFAULT true,

  -- Usage stats
  times_shown INTEGER DEFAULT 0,
  times_correct INTEGER DEFAULT 0,
  times_incorrect INTEGER DEFAULT 0,
  average_time_to_answer NUMERIC,

  -- Attribution
  created_by INTEGER REFERENCES admin_users(id),
  updated_by INTEGER REFERENCES admin_users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Notes
  notes TEXT,
  source VARCHAR(255) -- Where question came from
);

-- Error Logs Table
CREATE TABLE IF NOT EXISTS error_logs (
  id SERIAL PRIMARY KEY,
  error_type VARCHAR(100) NOT NULL, -- frontend, backend, database
  severity VARCHAR(50) DEFAULT 'error', -- info, warning, error, critical

  -- Error details
  message TEXT NOT NULL,
  stack_trace TEXT,
  error_code VARCHAR(50),

  -- Context
  game_type VARCHAR(50),
  user_session_id VARCHAR(255),
  url TEXT,

  -- Request info
  method VARCHAR(10),
  endpoint TEXT,
  request_body JSONB,
  response_status INTEGER,

  -- System info
  user_agent TEXT,
  ip_address VARCHAR(50),
  server_version VARCHAR(50),

  -- Metadata
  additional_data JSONB,
  occurred_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP,
  resolved_by INTEGER REFERENCES admin_users(id),
  resolution_notes TEXT,

  -- Grouping
  error_hash VARCHAR(255), -- Hash of error type + message for grouping
  occurrence_count INTEGER DEFAULT 1
);

-- System Health Metrics
CREATE TABLE IF NOT EXISTS system_health_metrics (
  id SERIAL PRIMARY KEY,
  metric_type VARCHAR(100) NOT NULL, -- database, api, cache, storage
  metric_name VARCHAR(100) NOT NULL,
  metric_value NUMERIC,
  metric_unit VARCHAR(50), -- ms, bytes, percent, count
  status VARCHAR(50) DEFAULT 'healthy', -- healthy, warning, critical
  details JSONB,
  recorded_at TIMESTAMP DEFAULT NOW()
);

-- iOS App Versions
CREATE TABLE IF NOT EXISTS ios_app_versions (
  id SERIAL PRIMARY KEY,
  version_number VARCHAR(50) NOT NULL,
  build_number VARCHAR(50) NOT NULL,
  release_type VARCHAR(50) DEFAULT 'testflight', -- testflight, production, beta

  -- Status
  status VARCHAR(50) DEFAULT 'active', -- active, deprecated, testing
  is_latest BOOLEAN DEFAULT false,

  -- Metadata
  release_notes TEXT,
  features JSONB, -- Array of new features
  bug_fixes JSONB, -- Array of bug fixes
  breaking_changes JSONB,

  -- Metrics
  download_count INTEGER DEFAULT 0,
  crash_count INTEGER DEFAULT 0,
  user_rating NUMERIC,

  -- Dates
  released_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Attribution
  created_by INTEGER REFERENCES admin_users(id),
  notes TEXT
);

-- Dashboard Settings
CREATE TABLE IF NOT EXISTS dashboard_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(255) UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  setting_type VARCHAR(50), -- string, number, boolean, json
  description TEXT,
  updated_by INTEGER REFERENCES admin_users(id),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Audit Log (track all admin actions)
CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES admin_users(id),
  action VARCHAR(100) NOT NULL, -- login, create_question, update_question, delete_question, etc.
  entity_type VARCHAR(100), -- question, user, experiment, etc.
  entity_id INTEGER,
  old_value JSONB,
  new_value JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_questions_game_type ON questions(game_type);
CREATE INDEX IF NOT EXISTS idx_questions_status ON questions(status);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_active ON questions(is_active);
CREATE INDEX IF NOT EXISTS idx_error_logs_type ON error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_occurred ON error_logs(occurred_at);
CREATE INDEX IF NOT EXISTS idx_error_logs_hash ON error_logs(error_hash);
CREATE INDEX IF NOT EXISTS idx_system_health_type ON system_health_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_system_health_recorded ON system_health_metrics(recorded_at);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at);

-- Views for common queries

-- Active questions by game
CREATE OR REPLACE VIEW active_questions_summary AS
SELECT
  game_type,
  COUNT(*) as total_questions,
  COUNT(*) FILTER (WHERE status = 'active') as active_questions,
  COUNT(*) FILTER (WHERE status = 'draft') as draft_questions,
  AVG(difficulty) as avg_difficulty,
  SUM(times_shown) as total_shown,
  ROUND(AVG(CASE WHEN times_shown > 0 THEN (times_correct::numeric / times_shown) * 100 END), 2) as avg_accuracy
FROM questions
WHERE is_active = true
GROUP BY game_type;

-- Recent errors summary
CREATE OR REPLACE VIEW recent_errors_summary AS
SELECT
  error_type,
  severity,
  COUNT(*) as occurrence_count,
  MAX(occurred_at) as last_occurred,
  COUNT(DISTINCT error_hash) as unique_errors,
  COUNT(*) FILTER (WHERE resolved_at IS NULL) as unresolved_count
FROM error_logs
WHERE occurred_at > NOW() - INTERVAL '7 days'
GROUP BY error_type, severity
ORDER BY occurrence_count DESC;

-- System health overview
CREATE OR REPLACE VIEW system_health_overview AS
SELECT
  metric_type,
  COUNT(*) as metric_count,
  COUNT(*) FILTER (WHERE status = 'healthy') as healthy_count,
  COUNT(*) FILTER (WHERE status = 'warning') as warning_count,
  COUNT(*) FILTER (WHERE status = 'critical') as critical_count,
  MAX(recorded_at) as last_check
FROM system_health_metrics
WHERE recorded_at > NOW() - INTERVAL '1 hour'
GROUP BY metric_type;

-- Comments
COMMENT ON TABLE admin_users IS 'Admin user accounts for super dashboard';
COMMENT ON TABLE questions IS 'Question bank for all games - editable via dashboard';
COMMENT ON TABLE error_logs IS 'Centralized error logging from all applications';
COMMENT ON TABLE system_health_metrics IS 'System health monitoring metrics';
COMMENT ON TABLE ios_app_versions IS 'iOS app version tracking and metadata';
COMMENT ON TABLE audit_log IS 'Audit trail of all admin actions';

-- Default admin user (password: admin123 - CHANGE IMMEDIATELY!)
-- Password hash for 'admin123' using bcrypt
INSERT INTO admin_users (username, password_hash, email, role)
VALUES (
  'admin',
  '$2b$10$rqXvDfGKz5Z5Z5Z5Z5Z5Z.Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z', -- Placeholder - will be replaced
  'admin@example.com',
  'admin'
) ON CONFLICT (username) DO NOTHING;

-- Default dashboard settings
INSERT INTO dashboard_settings (setting_key, setting_value, setting_type, description)
VALUES
  ('maintenance_mode', 'false', 'boolean', 'Enable/disable maintenance mode'),
  ('max_login_attempts', '5', 'number', 'Maximum login attempts before lockout'),
  ('session_timeout', '3600', 'number', 'Session timeout in seconds'),
  ('enable_error_notifications', 'true', 'boolean', 'Send email on critical errors')
ON CONFLICT (setting_key) DO NOTHING;
