-- OneTrust Consent Logging Table
-- This table stores user consent preferences for GDPR/privacy compliance
-- Run this migration to enable OneTrust consent tracking

CREATE TABLE IF NOT EXISTS consent_log (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) UNIQUE NOT NULL,
  consent_timestamp TIMESTAMP NOT NULL,
  necessary BOOLEAN DEFAULT false,
  performance BOOLEAN DEFAULT false,
  functional BOOLEAN DEFAULT false,
  targeting BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index on session_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_consent_log_session_id ON consent_log(session_id);

-- Create index on consent_timestamp for audit queries
CREATE INDEX IF NOT EXISTS idx_consent_log_timestamp ON consent_log(consent_timestamp);

-- Add comment to table
COMMENT ON TABLE consent_log IS 'Stores OneTrust cookie consent preferences for each user session';
COMMENT ON COLUMN consent_log.session_id IS 'Unique session identifier from client';
COMMENT ON COLUMN consent_log.consent_timestamp IS 'When the user provided/updated their consent';
COMMENT ON COLUMN consent_log.necessary IS 'C0001 - Strictly Necessary Cookies (always true)';
COMMENT ON COLUMN consent_log.performance IS 'C0002 - Performance/Analytics Cookies';
COMMENT ON COLUMN consent_log.functional IS 'C0003 - Functional Cookies';
COMMENT ON COLUMN consent_log.targeting IS 'C0004 - Targeting/Advertising Cookies';
