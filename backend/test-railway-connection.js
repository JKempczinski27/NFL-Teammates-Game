#!/usr/bin/env node
/**
 * Railway Database Connection Test
 * Tests the connection to the Railway PostgreSQL database
 * 
 * Usage:
 *   node test-railway-connection.js
 * 
 * Requires DATABASE_URL environment variable to be set
 */

require('dotenv').config();
const { Pool } = require('pg');

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message) {
  log(`✓ ${message}`, colors.green);
}

function error(message) {
  log(`✗ ${message}`, colors.red);
}

function info(message) {
  log(`ℹ ${message}`, colors.cyan);
}

function warning(message) {
  log(`⚠ ${message}`, colors.yellow);
}

async function testDatabaseConnection() {
  log('\n' + '='.repeat(60), colors.bold);
  log('  Railway Database Connection Test', colors.bold);
  log('='.repeat(60) + '\n', colors.bold);

  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    error('DATABASE_URL environment variable is not set!');
    info('Please set DATABASE_URL in your .env file or environment');
    info('Format: postgresql://user:password@host:port/database');
    process.exit(1);
  }

  // Mask the password in the connection string for display
  const maskedUrl = process.env.DATABASE_URL.replace(
    /:[^:@]+@/,
    ':****@'
  );
  info(`Connection string: ${maskedUrl}\n`);

  // Create pool with connection timeout
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : false,
    connectionTimeoutMillis: 10000, // 10 second timeout
    idleTimeoutMillis: 30000,
    max: 1 // Only need one connection for testing
  });

  const testResults = {
    connection: false,
    version: null,
    database: null,
    tables: [],
    errors: []
  };

  try {
    // Test 1: Basic Connection
    log('Test 1: Establishing connection...', colors.bold);
    const startTime = Date.now();
    const result = await pool.query('SELECT NOW() as current_time, version() as version');
    const duration = Date.now() - startTime;
    
    testResults.connection = true;
    testResults.version = result.rows[0].version;
    
    success(`Connected successfully in ${duration}ms`);
    info(`  Server time: ${result.rows[0].current_time}`);
    info(`  PostgreSQL: ${result.rows[0].version.split(',')[0]}\n`);

    // Test 2: Database Name
    log('Test 2: Verifying database...', colors.bold);
    const dbResult = await pool.query('SELECT current_database()');
    testResults.database = dbResult.rows[0].current_database;
    success(`Connected to database: ${testResults.database}\n`);

    // Test 3: List Tables
    log('Test 3: Checking database schema...', colors.bold);
    const tablesResult = await pool.query(`
      SELECT 
        schemaname,
        tablename,
        tableowner
      FROM pg_catalog.pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);

    if (tablesResult.rows.length === 0) {
      warning('No tables found in public schema');
      info('Database may need initialization\n');
    } else {
      success(`Found ${tablesResult.rows.length} table(s):`);
      tablesResult.rows.forEach(table => {
        testResults.tables.push(table.tablename);
        info(`  • ${table.tablename} (owner: ${table.tableowner})`);
      });
      console.log();
    }

    // Test 4: Check for specific expected tables
    log('Test 4: Checking for expected tables...', colors.bold);
    const expectedTables = ['players', 'player_updated', 'game_plays', 'user_sessions'];
    
    for (const tableName of expectedTables) {
      const exists = testResults.tables.includes(tableName);
      if (exists) {
        // Get row count
        const countResult = await pool.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        success(`  Table '${tableName}' exists (${countResult.rows[0].count} rows)`);
      } else {
        warning(`  Table '${tableName}' not found`);
      }
    }
    console.log();

    // Test 5: Test Write Permission
    log('Test 5: Testing write permissions...', colors.bold);
    try {
      await pool.query('CREATE TEMP TABLE test_write_permission (id INT)');
      await pool.query('DROP TABLE test_write_permission');
      success('Write permissions confirmed\n');
    } catch (err) {
      warning(`Limited write permissions: ${err.message}\n`);
    }

    // Test 6: Connection Pool
    log('Test 6: Testing connection pool...', colors.bold);
    const poolInfo = {
      total: pool.totalCount,
      idle: pool.idleCount,
      waiting: pool.waitingCount
    };
    success(`Pool status - Total: ${poolInfo.total}, Idle: ${poolInfo.idle}, Waiting: ${poolInfo.waiting}\n`);

  } catch (err) {
    error(`\nConnection test failed: ${err.message}`);
    testResults.errors.push(err.message);
    
    // Provide helpful debugging information
    console.log('\n' + '-'.repeat(60));
    log('Debugging Information:', colors.yellow);
    console.log('-'.repeat(60));
    
    if (err.code === 'ECONNREFUSED') {
      error('Connection refused - Database server may be down or unreachable');
      info('Check if the Railway service is running');
    } else if (err.code === 'ENOTFOUND') {
      error('Host not found - Check your database hostname');
      info('Verify the DATABASE_URL in your environment variables');
    } else if (err.code === '28P01') {
      error('Authentication failed - Check username/password');
      info('Verify credentials in DATABASE_URL');
    } else if (err.code === '3D000') {
      error('Database does not exist');
      info('Create the database or check the database name in DATABASE_URL');
    } else if (err.code === 'ETIMEDOUT') {
      error('Connection timeout - Network or firewall issue');
      info('Check Railway service status and network connectivity');
    } else {
      error(`Error code: ${err.code || 'Unknown'}`);
      if (err.stack) {
        console.log('\nStack trace:');
        console.log(err.stack);
      }
    }
    
    process.exit(1);
  } finally {
    // Clean up
    await pool.end();
  }

  // Summary
  log('\n' + '='.repeat(60), colors.bold);
  log('  Test Summary', colors.bold);
  log('='.repeat(60), colors.bold);
  success(`✓ Connection successful`);
  success(`✓ Database: ${testResults.database}`);
  success(`✓ Tables found: ${testResults.tables.length}`);
  
  if (testResults.errors.length > 0) {
    warning(`⚠ Errors encountered: ${testResults.errors.length}`);
  } else {
    log('\n' + colors.green + colors.bold + '🎉 All tests passed! Railway database is working correctly.' + colors.reset);
  }
  log('='.repeat(60) + '\n', colors.bold);
}

// Run the test
testDatabaseConnection()
  .catch(err => {
    error(`\nUnexpected error: ${err.message}`);
    console.error(err);
    process.exit(1);
  });
