#!/usr/bin/env node
/**
 * Manual database initialization script for Railway
 * Run this locally with: node init-railway-db.js
 */

const { Pool } = require('pg');

// Get DATABASE_URL from environment variable or command line argument
const DATABASE_URL = process.env.DATABASE_URL || process.argv[2];

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not provided!');
  console.error('\nUsage:');
  console.error('  DATABASE_URL="your-db-url" node init-railway-db.js');
  console.error('  OR');
  console.error('  node init-railway-db.js "your-db-url"');
  console.error('\nGet your DATABASE_URL from Railway:');
  console.error('  1. Go to your PostgreSQL service in Railway');
  console.error('  2. Click "Connect"');
  console.error('  3. Copy the "Postgres Connection URL"\n');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const schema = `
-- Create consolidated players table
CREATE TABLE IF NOT EXISTS players (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  session_id VARCHAR(255),
  game_type VARCHAR(50),
  games_played TEXT[],
  favorite_team VARCHAR(255),
  trivia_score INTEGER DEFAULT 0,
  trivia_best_score INTEGER DEFAULT 0,
  trivia_games_played INTEGER DEFAULT 0,
  journeyman_correct_count INTEGER DEFAULT 0,
  journeyman_best_correct INTEGER DEFAULT 0,
  journeyman_duration_seconds INTEGER DEFAULT 0,
  journeyman_best_time INTEGER,
  journeyman_games_played INTEGER DEFAULT 0,
  journeyman_game_data JSONB,
  teammates_games_played INTEGER DEFAULT 0,
  teammates_best_score INTEGER DEFAULT 0,
  teammates_completion_count INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  metadata JSONB,
  event_history JSONB,
  consents JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(email)
);

CREATE INDEX IF NOT EXISTS idx_players_email ON players(email);
CREATE INDEX IF NOT EXISTS idx_players_game_type ON players(game_type);
CREATE INDEX IF NOT EXISTS idx_players_session_id ON players(session_id);
`;

async function initDatabase() {
  try {
    console.log('🔌 Connecting to Railway database...');
    console.log('   URL:', DATABASE_URL.substring(0, 40) + '...');

    await pool.query('SELECT NOW()');
    console.log('✅ Connected successfully!\n');

    console.log('📝 Creating players table...');
    await pool.query(schema);
    console.log('✅ Table created successfully!\n');

    console.log('📊 Verifying tables...');
    const result = await pool.query(`
      SELECT table_name,
             (SELECT COUNT(*) FROM information_schema.columns
              WHERE table_name = t.table_name AND table_schema = 'public') as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('   Tables found:');
    result.rows.forEach(row => {
      console.log(`   - ${row.table_name} (${row.column_count} columns)`);
    });

    console.log('\n✅ Database initialization complete!');
    console.log('   Go to Railway and refresh the Data tab - you should see the players table!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('   Full error:', error);
  } finally {
    await pool.end();
  }
}

initDatabase();
