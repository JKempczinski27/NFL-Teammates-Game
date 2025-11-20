/**
 * Database Initialization Script
 * Runs the schema.sql file to create all database tables
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
        console.log('🚀 Starting database initialization...');

        // Read the schema.sql file
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        console.log('📝 Executing schema.sql...');

        // Execute the schema
        await client.query(schema);

        console.log('✅ Database schema created successfully!');
        console.log('\nCreated tables:');
        console.log('  - teams');
        console.log('  - players');
        console.log('  - team_relationships');
        console.log('  - questions');
        console.log('  - question_players');
        console.log('  - user_stats');
        console.log('\n✅ Database initialization complete!');

    } catch (error) {
        console.error('❌ Error initializing database:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the initialization
initializeDatabase()
    .then(() => {
        console.log('\n🎉 All done! Your database is ready to use.');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Initialization failed:', error.message);
        process.exit(1);
    });
