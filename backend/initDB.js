/**
 * Database Initialization Script
 * Runs the schema.sql file to create all tracking tables and views
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function initializeDatabase() {
  const client = await pool.connect();

  try {
    console.log('🚀 Starting database initialization...');

    // Read the schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('📄 Executing schema.sql...');

    // Execute the schema
    await client.query(schemaSql);

    console.log('✅ Database schema created successfully!');
    console.log('');
    console.log('📊 Created tables:');
    console.log('  - user_sessions');
    console.log('  - game_sessions');
    console.log('  - question_attempts');
    console.log('  - user_engagement_events');
    console.log('  - daily_activity_summary');
    console.log('');
    console.log('📈 Created views:');
    console.log('  - user_engagement_summary');
    console.log('  - session_game_diversity');
    console.log('  - question_performance');
    console.log('');
    console.log('🎉 Database is ready for tracking!');

  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  initializeDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { initializeDatabase };
