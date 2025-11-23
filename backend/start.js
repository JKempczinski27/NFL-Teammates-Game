/**
 * Startup script for Railway deployment
 * 1. Initializes database with consolidated schema (if needed)
 * 2. Starts the server
 */

const { spawn } = require('child_process');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function checkAndInitDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    console.log('🔍 Checking database schema...');

    // Check if consolidated players table exists
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'players'
      );
    `);

    const tableExists = result.rows[0].exists;

    if (!tableExists) {
      console.log('📦 Players table not found. Initializing database...');

      // Read and execute the consolidated schema
      const schemaPath = path.join(__dirname, 'schema-single-table.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');

      await pool.query(schema);

      console.log('✅ Database initialized with consolidated schema!');
      console.log('📊 Created:');
      console.log('  - Consolidated players table');
      console.log('  - Helper views (leaderboards, analytics)');
      console.log('  - Utility functions');
    } else {
      console.log('✅ Database schema already exists');
    }

    await pool.end();
    return true;
  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
    await pool.end();
    return false;
  }
}

async function startServer() {
  console.log('\n🚀 Starting server...\n');

  const server = spawn('node', ['index.js'], {
    stdio: 'inherit',
    env: process.env,
  });

  server.on('error', (error) => {
    console.error('❌ Server error:', error);
    process.exit(1);
  });

  server.on('exit', (code) => {
    console.log(`Server exited with code ${code}`);
    process.exit(code);
  });
}

// Main execution
(async () => {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   NFL GAMES BACKEND - STARTUP                          ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  const dbReady = await checkAndInitDatabase();

  if (dbReady) {
    await startServer();
  } else {
    console.error('\n❌ Failed to initialize database. Exiting.');
    process.exit(1);
  }
})();
