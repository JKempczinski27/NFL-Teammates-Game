#!/usr/bin/env node

/**
 * Analytics Initialization Script
 * Initializes the comprehensive player analytics system
 *
 * Usage:
 *   node backend/scripts/init-analytics.js
 *
 * Or with custom database URL:
 *   DATABASE_URL=postgres://... node backend/scripts/init-analytics.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.cyan}${colors.bright}${msg}${colors.reset}`)
};

async function main() {
  log.section('═══════════════════════════════════════════════════════');
  log.section('  NFL Games - Player Analytics Initialization');
  log.section('═══════════════════════════════════════════════════════');
  console.log('');

  // Check for DATABASE_URL
  if (!process.env.DATABASE_URL) {
    log.error('DATABASE_URL environment variable not set');
    log.info('Please set DATABASE_URL or add it to your .env file');
    process.exit(1);
  }

  // Create database connection
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost')
      ? false
      : { rejectUnauthorized: false }
  });

  try {
    // Test connection
    log.info('Testing database connection...');
    await pool.query('SELECT NOW()');
    log.success('Database connection successful');

    // Check if players table exists
    log.section('\n1. Checking Prerequisites');
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'players'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      log.error('Players table does not exist!');
      log.info('Please run the single-table schema first:');
      log.info('  psql $DATABASE_URL -f backend/schema-single-table.sql');
      await pool.end();
      process.exit(1);
    }
    log.success('Players table exists');

    // Check if there's data
    const countCheck = await pool.query('SELECT COUNT(*) as count FROM players');
    const playerCount = parseInt(countCheck.rows[0].count);
    log.info(`Found ${playerCount} players in database`);

    if (playerCount === 0) {
      log.warning('No players found in database');
      log.warning('Analytics will work but will return empty results');
    }

    // Read analytics schema file
    log.section('\n2. Loading Analytics Schema');
    const schemaPath = path.join(__dirname, '..', 'schema-player-analytics.sql');

    if (!fs.existsSync(schemaPath)) {
      log.error(`Schema file not found: ${schemaPath}`);
      await pool.end();
      process.exit(1);
    }

    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    log.success('Analytics schema file loaded');

    // Execute analytics schema
    log.section('\n3. Creating Analytics Views and Functions');
    log.info('This may take a few moments...');

    try {
      await pool.query(schemaSql);
      log.success('Analytics schema created successfully');
    } catch (err) {
      log.error('Failed to create analytics schema');
      console.error(err.message);
      await pool.end();
      process.exit(1);
    }

    // Verify views were created
    log.section('\n4. Verifying Analytics Views');
    const viewsToCheck = [
      'v_player_performance_summary',
      'v_player_engagement_score',
      'v_trivia_analytics',
      'v_journeyman_analytics',
      'v_teammates_analytics',
      'v_player_rfm_analysis',
      'v_churn_risk_analysis',
      'v_weekly_cohorts',
      'v_monthly_cohorts',
      'v_overall_leaderboard',
      'mv_analytics_dashboard',
      'mv_game_performance'
    ];

    let allViewsExist = true;
    for (const viewName of viewsToCheck) {
      const viewCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM pg_views
          WHERE schemaname = 'public'
          AND viewname = $1
        ) OR EXISTS (
          SELECT FROM pg_matviews
          WHERE schemaname = 'public'
          AND matviewname = $1
        ) as exists;
      `, [viewName]);

      if (viewCheck.rows[0].exists) {
        log.success(`View ${viewName} created`);
      } else {
        log.error(`View ${viewName} missing`);
        allViewsExist = false;
      }
    }

    if (!allViewsExist) {
      log.error('Some views were not created successfully');
      await pool.end();
      process.exit(1);
    }

    // Refresh materialized views
    log.section('\n5. Initializing Materialized Views');
    try {
      await pool.query('SELECT refresh_player_analytics_views()');
      log.success('Materialized views refreshed');
    } catch (err) {
      log.warning('Could not refresh materialized views (this is ok if no data exists yet)');
      log.info(err.message);
    }

    // Test some analytics queries
    log.section('\n6. Testing Analytics Queries');

    // Test dashboard
    try {
      const dashboard = await pool.query('SELECT * FROM mv_analytics_dashboard');
      log.success('Dashboard query successful');
      if (dashboard.rows[0]) {
        log.info(`  Total players: ${dashboard.rows[0].total_players}`);
        log.info(`  Active players: ${dashboard.rows[0].active_players}`);
        log.info(`  DAU: ${dashboard.rows[0].dau}`);
        log.info(`  MAU: ${dashboard.rows[0].mau}`);
      }
    } catch (err) {
      log.error('Dashboard query failed');
      console.error(err.message);
    }

    // Test performance view
    try {
      const performance = await pool.query('SELECT COUNT(*) as count FROM v_player_performance_summary');
      log.success(`Performance view: ${performance.rows[0].count} players`);
    } catch (err) {
      log.error('Performance view query failed');
      console.error(err.message);
    }

    // Test RFM segmentation
    try {
      const rfm = await pool.query(`
        SELECT player_segment, COUNT(*) as count
        FROM v_player_rfm_analysis
        GROUP BY player_segment
        ORDER BY count DESC
      `);
      log.success('RFM segmentation query successful');
      if (rfm.rows.length > 0) {
        log.info('  Player segments:');
        rfm.rows.forEach(row => {
          log.info(`    ${row.player_segment}: ${row.count} players`);
        });
      }
    } catch (err) {
      log.error('RFM query failed');
      console.error(err.message);
    }

    // Success summary
    log.section('\n═══════════════════════════════════════════════════════');
    log.section('  Analytics Initialization Complete!');
    log.section('═══════════════════════════════════════════════════════');
    console.log('');
    log.success('All analytics views and functions are ready to use');
    console.log('');
    log.info('Next steps:');
    log.info('  1. Start your server: npm start');
    log.info('  2. Access dashboard: GET /api/player-analytics/dashboard');
    log.info('  3. View documentation: backend/ANALYTICS_README.md');
    console.log('');
    log.info('Recommended: Set up a cron job to refresh materialized views hourly:');
    log.info('  */60 * * * * psql $DATABASE_URL -c "SELECT refresh_player_analytics_views();"');
    console.log('');

  } catch (err) {
    log.error('Initialization failed');
    console.error(err);
    await pool.end();
    process.exit(1);
  }

  await pool.end();
  log.success('Database connection closed');
}

// Run the script
main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
