#!/usr/bin/env node

/**
 * Database Initialization Script
 *
 * This script initializes the NFL Teammates Game database by:
 * 1. Creating the database if it doesn't exist
 * 2. Running the schema.sql file to create tables
 * 3. Verifying the setup
 *
 * Usage:
 *   node init-db.js [--local|--railway]
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const execAsync = promisify(exec);

// Determine which environment to use
const args = process.argv.slice(2);
const useLocal = args.includes('--local') || !args.includes('--railway');

// Database configuration
const config = useLocal ? {
  user: 'postgres',
  password: 'postgres',
  host: 'localhost',
  database: 'nfl_teammates_game',
  port: 5432,
} : {
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:rYaxKDTGRwelTItjmNkjmutTnDZJCtvO@postgres-ulot.railway.internal:5432/railway',
  ssl: {
    rejectUnauthorized: false,
  },
};

async function initializeDatabase() {
  console.log('=== NFL Teammates Game Database Initialization ===\n');
  console.log(`Environment: ${useLocal ? 'LOCAL' : 'RAILWAY'}\n`);

  const pool = new Pool(config);

  try {
    // Test connection
    console.log('1. Testing database connection...');
    const connTest = await pool.query('SELECT NOW(), version()');
    console.log('   ✓ Connection successful!');
    console.log('   Server time:', connTest.rows[0].now);
    console.log('   PostgreSQL version:', connTest.rows[0].version.split(',')[0]);
    console.log();

    // Read and execute schema
    console.log('2. Creating database schema...');
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    await pool.query(schema);
    console.log('   ✓ Schema created successfully!');
    console.log();

    // Verify tables
    console.log('3. Verifying tables...');
    const tablesQuery = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    if (tablesQuery.rows.length === 0) {
      console.log('   ⚠ Warning: No tables found!');
    } else {
      console.log('   ✓ Found', tablesQuery.rows.length, 'table(s):');
      for (const row of tablesQuery.rows) {
        console.log('     -', row.table_name);

        // Get column count
        const colCount = await pool.query(`
          SELECT COUNT(*) as count
          FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = $1
        `, [row.table_name]);

        console.log('       Columns:', colCount.rows[0].count);
      }
    }
    console.log();

    console.log('=== Database Initialization Complete! ===');
    console.log();
    console.log('You can now run your application with:');
    if (useLocal) {
      console.log('  cd nfl-teamates-game/backend');
      console.log('  cp .env.local .env  # Use local database');
      console.log('  npm start');
    } else {
      console.log('  Deploy to Railway and the database will be ready!');
    }

  } catch (error) {
    console.error('\n❌ Database initialization failed:', error.message);
    console.error('\nError details:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run initialization
initializeDatabase();
