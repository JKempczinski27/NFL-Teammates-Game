/**
 * Database Initialization Script
 * Creates the consolidated single-table schema for all NFL games
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Create a new pool using the DATABASE_URL from environment
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function initializeDatabase() {
    const client = await pool.connect();

    try {
        console.log('╔════════════════════════════════════════════════════════╗');
        console.log('║   CONSOLIDATED DATABASE INITIALIZATION                 ║');
        console.log('╚════════════════════════════════════════════════════════╝\n');

        console.log('🚀 Starting database initialization...');

        // Read the consolidated single-table schema
        const schemaPath = path.join(__dirname, 'schema-single-table.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        console.log('📝 Executing schema-single-table.sql...');

        // Execute the schema
        await client.query(schema);

        console.log('\n✅ Database schema created successfully!');
        console.log('\n📊 Created components:');
        console.log('  ✓ players table (consolidated - ALL player data)');
        console.log('  ✓ Indexes for performance');
        console.log('  ✓ Helper views (leaderboards, analytics)');
        console.log('  ✓ Utility functions (calculate_player_stats, merge_player_data)');
        console.log('  ✓ Auto-update triggers');

        // Verify table was created
        const result = await client.query(`
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = 'players'
            ORDER BY ordinal_position
        `);

        console.log(`\n📋 Players table has ${result.rows.length} columns:`);
        console.log('  - Core fields: id, name, email, session_id');
        console.log('  - Game tracking: game_type, games_played[]');
        console.log('  - Trivia stats: favorite_team, trivia_score, trivia_games_played');
        console.log('  - Journeyman stats: correct_count, best_time, games_played');
        console.log('  - Teammates stats: games_played, best_score, completion_count');
        console.log('  - Aggregate stats: total_sessions, questions_answered, etc.');
        console.log('  - Flexible storage: metadata (JSONB), event_history (JSONB)');

        console.log('\n✅ Database initialization complete!');

    } catch (error) {
        console.error('\n❌ Error initializing database:', error);
        console.error('\nDetails:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the initialization
initializeDatabase()
    .then(() => {
        console.log('\n╔════════════════════════════════════════════════════════╗');
        console.log('║   ✅ DATABASE READY TO USE                             ║');
        console.log('╚════════════════════════════════════════════════════════╝');
        console.log('\nNext steps:');
        console.log('  1. Your database now has a single consolidated players table');
        console.log('  2. Use /api/players endpoints for all player operations');
        console.log('  3. See DATABASE_CONSOLIDATION.md for usage guide');
        console.log('  4. Use helper views for analytics:');
        console.log('     - v_trivia_leaderboard');
        console.log('     - v_journeyman_leaderboard');
        console.log('     - v_most_engaged_players\n');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Initialization failed:', error.message);
        console.error('\nPlease check:');
        console.error('  1. DATABASE_URL is set correctly');
        console.error('  2. Database server is running');
        console.error('  3. schema-single-table.sql exists\n');
        process.exit(1);
    });
