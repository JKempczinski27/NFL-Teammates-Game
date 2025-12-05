-- A/B Testing Tables for Experiment Management and Analysis
-- Run this migration to enable content testing with dashboard results

-- Experiments table - Define A/B tests
CREATE TABLE IF NOT EXISTS experiments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  hypothesis TEXT,
  game_type VARCHAR(50) DEFAULT 'all',
  status VARCHAR(50) DEFAULT 'draft', -- draft, active, paused, completed

  -- Experiment configuration
  variants JSONB NOT NULL, -- Array of variant configs: [{id: 'control', name: 'Control', weight: 50}, ...]
  traffic_allocation INTEGER DEFAULT 100, -- Percentage of users to include (0-100)

  -- Success metrics
  primary_metric VARCHAR(100) NOT NULL, -- e.g., 'completion_rate', 'time_to_complete', 'share_rate'
  secondary_metrics JSONB, -- Array of additional metrics to track

  -- Targeting
  target_audience JSONB, -- Filters: {device: 'mobile', skill_level: 'beginner', etc.}

  -- Dates
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(255),

  -- Metadata
  tags JSONB, -- For organization: ['ui', 'engagement', 'conversion']
  notes TEXT
);

-- Experiment assignments - Track which users got which variant
CREATE TABLE IF NOT EXISTS experiment_assignments (
  id SERIAL PRIMARY KEY,
  experiment_id INTEGER REFERENCES experiments(id) ON DELETE CASCADE,
  session_id VARCHAR(255) NOT NULL,
  variant_id VARCHAR(100) NOT NULL,
  assigned_at TIMESTAMP DEFAULT NOW(),

  -- User context at assignment time
  user_context JSONB, -- Device, location, skill level, etc.

  UNIQUE(experiment_id, session_id)
);

-- Experiment events - Track outcomes for each variant
CREATE TABLE IF NOT EXISTS experiment_events (
  id SERIAL PRIMARY KEY,
  experiment_id INTEGER REFERENCES experiments(id) ON DELETE CASCADE,
  session_id VARCHAR(255) NOT NULL,
  variant_id VARCHAR(100) NOT NULL,

  event_type VARCHAR(100) NOT NULL,
  event_data JSONB,
  metric_value NUMERIC, -- Numeric value for aggregation

  timestamp TIMESTAMP DEFAULT NOW(),

  -- Link to main events table
  source_event_id INTEGER REFERENCES events(id)
);

-- Experiment results (materialized view for performance)
CREATE MATERIALIZED VIEW IF NOT EXISTS experiment_results AS
SELECT
  e.id as experiment_id,
  e.name as experiment_name,
  e.status,
  e.primary_metric,
  ea.variant_id,

  -- Assignment stats
  COUNT(DISTINCT ea.session_id) as participants,

  -- Engagement metrics
  COUNT(DISTINCT ee.session_id) FILTER (WHERE ee.event_type = 'session_start') as sessions,
  COUNT(DISTINCT ee.session_id) FILTER (WHERE ee.event_type = 'game_ended') as completions,

  -- Conversion rate
  ROUND(
    COUNT(DISTINCT ee.session_id) FILTER (WHERE ee.event_type = 'game_ended')::numeric /
    NULLIF(COUNT(DISTINCT ea.session_id), 0) * 100,
    2
  ) as completion_rate,

  -- Average metrics
  AVG(ee.metric_value) FILTER (WHERE ee.event_type = 'time_to_complete') as avg_time_to_complete,
  AVG(ee.metric_value) FILTER (WHERE ee.event_type = 'score') as avg_score,
  AVG(ee.metric_value) FILTER (WHERE ee.event_type = 'questions_answered') as avg_questions_answered,

  -- Engagement
  COUNT(*) FILTER (WHERE ee.event_type = 'shared') as total_shares,
  ROUND(
    COUNT(*) FILTER (WHERE ee.event_type = 'shared')::numeric /
    NULLIF(COUNT(DISTINCT ea.session_id), 0),
    2
  ) as shares_per_user,

  -- Revenue (if applicable)
  SUM(ee.metric_value) FILTER (WHERE ee.event_type = 'revenue') as total_revenue,
  AVG(ee.metric_value) FILTER (WHERE ee.event_type = 'revenue') as avg_revenue_per_user

FROM experiments e
LEFT JOIN experiment_assignments ea ON e.id = ea.experiment_id
LEFT JOIN experiment_events ee ON e.id = ee.experiment_id AND ea.session_id = ee.session_id
GROUP BY e.id, e.name, e.status, e.primary_metric, ea.variant_id;

-- Refresh function for materialized view
CREATE OR REPLACE FUNCTION refresh_experiment_results()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW experiment_results;
END;
$$ LANGUAGE plpgsql;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_experiments_status ON experiments(status);
CREATE INDEX IF NOT EXISTS idx_experiments_game_type ON experiments(game_type);
CREATE INDEX IF NOT EXISTS idx_experiment_assignments_session ON experiment_assignments(session_id);
CREATE INDEX IF NOT EXISTS idx_experiment_assignments_experiment ON experiment_assignments(experiment_id);
CREATE INDEX IF NOT EXISTS idx_experiment_events_experiment ON experiment_events(experiment_id);
CREATE INDEX IF NOT EXISTS idx_experiment_events_session ON experiment_events(session_id);
CREATE INDEX IF NOT EXISTS idx_experiment_events_type ON experiment_events(event_type);
CREATE INDEX IF NOT EXISTS idx_experiment_events_timestamp ON experiment_events(timestamp);

-- Comments
COMMENT ON TABLE experiments IS 'A/B test experiment definitions';
COMMENT ON TABLE experiment_assignments IS 'Tracks which variant each user was assigned to';
COMMENT ON TABLE experiment_events IS 'Events and metrics tracked for each experiment';
COMMENT ON COLUMN experiments.variants IS 'JSON array of variant configurations: [{id: "control", name: "Control", weight: 50}, ...]';
COMMENT ON COLUMN experiments.traffic_allocation IS 'Percentage of total traffic to include in experiment (0-100)';
COMMENT ON COLUMN experiments.primary_metric IS 'Main success metric: completion_rate, time_to_complete, share_rate, etc.';
COMMENT ON COLUMN experiment_assignments.user_context IS 'User attributes at assignment: device, skill level, etc.';
