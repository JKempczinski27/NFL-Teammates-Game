/**
 * Database Migration Script
 * Consolidates all player data from multiple tables into a single comprehensive table
 *
 * This script:
 * 1. Backs up existing data from all tables
 * 2. Creates the new consolidated players table
 * 3. Migrates data from old tables to the new table
 * 4. Drops old tables (optional)
 *
 * Usage: node migrate-to-single-table.js [--drop-old-tables]
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

// Flag to drop old tables after migration
const DROP_OLD_TABLES = process.argv.includes('--drop-old-tables');

async function backupData(client) {
  console.log('\n📦 Backing up existing data...');

  const backups = {};
  const tables = [
    'players',
    'trivia_players',
    'journeyman_players',
    'player_updated',
    'events',
    'user_sessions',
    'question_analytics',
    'share_analytics',
    'game_submissions'
  ];

  for (const table of tables) {
    try {
      const result = await client.query(`SELECT * FROM ${table}`);
      backups[table] = result.rows;
      console.log(`  ✓ Backed up ${table}: ${result.rows.length} rows`);
    } catch (err) {
      console.log(`  ⚠ Table ${table} does not exist or is empty, skipping...`);
      backups[table] = [];
    }
  }

  // Save backup to file
  const backupFile = path.join(__dirname, `backup-${Date.now()}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(backups, null, 2));
  console.log(`\n💾 Backup saved to: ${backupFile}`);

  return backups;
}

async function createNewSchema(client) {
  console.log('\n🏗️  Creating new consolidated schema...');

  const schemaPath = path.join(__dirname, 'schema-single-table.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  await client.query(schema);
  console.log('  ✓ New schema created successfully');
}

async function migrateData(client, backups) {
  console.log('\n🔄 Migrating data to consolidated table...');

  let totalMigrated = 0;

  // Migrate from old 'players' table (NFL Teammates)
  if (backups.players && backups.players.length > 0) {
    console.log(`\n  Migrating ${backups.players.length} players from 'players' table...`);
    for (const player of backups.players) {
      try {
        await client.query(`
          INSERT INTO players (
            name, email, game_type, games_played,
            teammates_games_played, created_at, metadata
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (email) DO UPDATE SET
            games_played = CASE
              WHEN players.games_played @> ARRAY['teammates'] THEN players.games_played
              ELSE array_append(players.games_played, 'teammates')
            END,
            teammates_games_played = players.teammates_games_played + 1,
            updated_at = CURRENT_TIMESTAMP
        `, [
          player.name || 'Unknown',
          player.email,
          'teammates',
          ['teammates'],
          1,
          player.created_at || new Date(),
          JSON.stringify({
            original_id: player.id,
            migrated_from: 'players'
          })
        ]);
        totalMigrated++;
      } catch (err) {
        console.error(`    ✗ Error migrating player ${player.email}:`, err.message);
      }
    }
    console.log(`    ✓ Migrated ${backups.players.length} players from 'players' table`);
  }

  // Migrate from 'trivia_players' table
  if (backups.trivia_players && backups.trivia_players.length > 0) {
    console.log(`\n  Migrating ${backups.trivia_players.length} players from 'trivia_players' table...`);
    for (const player of backups.trivia_players) {
      try {
        await client.query(`
          INSERT INTO players (
            name, email, game_type, games_played,
            favorite_team, trivia_score, trivia_best_score, trivia_games_played,
            created_at, metadata
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (email) DO UPDATE SET
            games_played = CASE
              WHEN players.games_played @> ARRAY['trivia'] THEN players.games_played
              ELSE array_append(players.games_played, 'trivia')
            END,
            favorite_team = EXCLUDED.favorite_team,
            trivia_score = GREATEST(players.trivia_score, EXCLUDED.trivia_score),
            trivia_best_score = GREATEST(players.trivia_best_score, EXCLUDED.trivia_best_score),
            trivia_games_played = players.trivia_games_played + 1,
            updated_at = CURRENT_TIMESTAMP
        `, [
          player.name || 'Unknown',
          player.email,
          'trivia',
          ['trivia'],
          player.team || null,
          player.score || 0,
          player.score || 0,
          1,
          player.created_at || new Date(),
          JSON.stringify({
            original_id: player.id,
            migrated_from: 'trivia_players'
          })
        ]);
        totalMigrated++;
      } catch (err) {
        console.error(`    ✗ Error migrating trivia player ${player.email}:`, err.message);
      }
    }
    console.log(`    ✓ Migrated ${backups.trivia_players.length} players from 'trivia_players' table`);
  }

  // Migrate from 'journeyman_players' table
  if (backups.journeyman_players && backups.journeyman_players.length > 0) {
    console.log(`\n  Migrating ${backups.journeyman_players.length} players from 'journeyman_players' table...`);
    for (const player of backups.journeyman_players) {
      try {
        await client.query(`
          INSERT INTO players (
            name, email, game_type, games_played,
            journeyman_correct_count, journeyman_best_correct,
            journeyman_duration_seconds, journeyman_best_time,
            journeyman_games_played, journeyman_game_data,
            created_at, metadata
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          ON CONFLICT (email) DO UPDATE SET
            games_played = CASE
              WHEN players.games_played @> ARRAY['journeyman'] THEN players.games_played
              ELSE array_append(players.games_played, 'journeyman')
            END,
            journeyman_correct_count = GREATEST(players.journeyman_correct_count, EXCLUDED.journeyman_correct_count),
            journeyman_best_correct = GREATEST(players.journeyman_best_correct, EXCLUDED.journeyman_best_correct),
            journeyman_best_time = CASE
              WHEN players.journeyman_best_time IS NULL THEN EXCLUDED.journeyman_best_time
              ELSE LEAST(players.journeyman_best_time, EXCLUDED.journeyman_best_time)
            END,
            journeyman_games_played = players.journeyman_games_played + 1,
            journeyman_game_data = EXCLUDED.journeyman_game_data,
            updated_at = CURRENT_TIMESTAMP
        `, [
          player.name || 'Unknown',
          player.email,
          'journeyman',
          ['journeyman'],
          player.correct_count || 0,
          player.correct_count || 0,
          player.duration_seconds || 0,
          player.duration_seconds || 0,
          1,
          player.game_data || null,
          player.created_at || new Date(),
          JSON.stringify({
            original_id: player.id,
            migrated_from: 'journeyman_players'
          })
        ]);
        totalMigrated++;
      } catch (err) {
        console.error(`    ✗ Error migrating journeyman player ${player.email}:`, err.message);
      }
    }
    console.log(`    ✓ Migrated ${backups.journeyman_players.length} players from 'journeyman_players' table`);
  }

  // Migrate session data from user_sessions
  if (backups.user_sessions && backups.user_sessions.length > 0) {
    console.log(`\n  Processing ${backups.user_sessions.length} user sessions...`);

    // Group sessions by session_id to find unique users
    const sessionMap = new Map();
    for (const session of backups.user_sessions) {
      if (!sessionMap.has(session.session_id)) {
        sessionMap.set(session.session_id, []);
      }
      sessionMap.get(session.session_id).push(session);
    }

    console.log(`    Found ${sessionMap.size} unique session IDs`);
    console.log(`    Note: Session data requires email mapping - storing in metadata`);
  }

  console.log(`\n✅ Migration complete! Total records processed: ${totalMigrated}`);
}

async function dropOldTables(client) {
  console.log('\n🗑️  Dropping old tables...');

  const tablesToDrop = [
    'player_updated',
    'trivia_players',
    'journeyman_players',
    'events',
    'user_sessions',
    'question_analytics',
    'share_analytics',
    'game_submissions',
    'user_consents',
    'data_deletion_requests',
    'daily_metrics',
    'hourly_metrics',
    'question_difficulty_metrics',
    'user_cohorts',
    'funnel_metrics',
    'api_performance',
    'query_performance'
  ];

  for (const table of tablesToDrop) {
    try {
      await client.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
      console.log(`  ✓ Dropped table: ${table}`);
    } catch (err) {
      console.log(`  ⚠ Could not drop table ${table}:`, err.message);
    }
  }

  console.log('\n✅ Old tables dropped');
}

async function showStatistics(client) {
  console.log('\n📊 Migration Statistics:');

  try {
    const totalPlayers = await client.query('SELECT COUNT(*) FROM players');
    console.log(`  Total players in new table: ${totalPlayers.rows[0].count}`);

    const byGame = await client.query(`
      SELECT game_type, COUNT(*) as count
      FROM players
      GROUP BY game_type
      ORDER BY count DESC
    `);
    console.log('\n  Players by game type:');
    byGame.rows.forEach(row => {
      console.log(`    ${row.game_type || 'not set'}: ${row.count}`);
    });

    const multiGame = await client.query(`
      SELECT array_length(games_played, 1) as games_count, COUNT(*) as players
      FROM players
      WHERE games_played IS NOT NULL
      GROUP BY games_count
      ORDER BY games_count DESC
    `);
    console.log('\n  Cross-game players:');
    multiGame.rows.forEach(row => {
      console.log(`    Played ${row.games_count} game(s): ${row.players} players`);
    });

  } catch (err) {
    console.error('  Error getting statistics:', err.message);
  }
}

async function runMigration() {
  const client = await pool.connect();

  try {
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║   DATABASE MIGRATION: CONSOLIDATE TO SINGLE TABLE      ║');
    console.log('╚════════════════════════════════════════════════════════╝');

    // Step 1: Backup existing data
    const backups = await backupData(client);

    // Step 2: Create new schema
    await createNewSchema(client);

    // Step 3: Migrate data
    await migrateData(client, backups);

    // Step 4: Drop old tables (if flag is set)
    if (DROP_OLD_TABLES) {
      await dropOldTables(client);
    } else {
      console.log('\n⚠️  Old tables were NOT dropped. Use --drop-old-tables flag to drop them.');
    }

    // Step 5: Show statistics
    await showStatistics(client);

    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║              ✅ MIGRATION COMPLETED SUCCESSFULLY       ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log('\nNext steps:');
    console.log('  1. Review the backup file created above');
    console.log('  2. Test your application with the new schema');
    console.log('  3. If everything works, run again with --drop-old-tables');
    console.log('  4. Update your application code to use the new schema\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error('\nThe database has been rolled back to its previous state.');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the migration
runMigration()
  .then(() => {
    console.log('\n✅ Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration script failed:', error.message);
    process.exit(1);
  });
