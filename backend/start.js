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
  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set!');
    console.error('   Please set DATABASE_URL in Railway service variables');
    return false;
  }

  console.log('📌 DATABASE_URL detected:', process.env.DATABASE_URL.substring(0, 20) + '...');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
    connectionTimeoutMillis: 10000,
  });

  try {
    console.log('🔍 Checking database schema...');
    console.log('🔌 Attempting to connect to database...');

    // Test connection first
    const connectionTest = await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful!');
    console.log('   Server time:', connectionTest.rows[0].now);

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

      console.log('📄 Reading schema from:', schemaPath);
      if (!fs.existsSync(schemaPath)) {
        console.error('❌ Schema file not found at:', schemaPath);
        await pool.end();
        return false;
      }

      const schema = fs.readFileSync(schemaPath, 'utf8');
      console.log('📝 Schema file loaded, executing...');

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
    console.error('❌ Database initialization error:');
    console.error('   Message:', error.message || 'No error message');
    console.error('   Code:', error.code || 'No error code');
    console.error('   Details:', error.detail || 'No details');
    console.error('   Full error:', error);

    try {
      await pool.end();
    } catch (endError) {
      console.error('   Error closing pool:', endError.message);
    }

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

  // Always try to initialize database, but don't exit if it fails
  const dbReady = await checkAndInitDatabase();

  if (dbReady) {
    console.log('✅ Database ready, starting server...');
  } else {
    console.warn('\n⚠️  Database initialization failed, but starting server anyway...');
    console.warn('   The server will start, but database operations will fail.');
    console.warn('   Check the error messages above and fix the DATABASE_URL.');
  }

  await startServer();
})();
