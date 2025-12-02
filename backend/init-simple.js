/**
 * Simple Database Initialization Script
 * Uses the basic schema.sql file
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
        console.log('\n🚀 Starting database initialization...\n');

        // Read the basic schema
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        console.log('📝 Executing schema.sql...');

        // Execute the schema
        await client.query(schema);

        console.log('✅ Database schema created successfully!\n');

        // Verify tables were created
        const result = await client.query(`
            SELECT tablename
            FROM pg_catalog.pg_tables
            WHERE schemaname = 'public'
            ORDER BY tablename
        `);

        console.log(`📊 Created ${result.rows.length} tables:`);
        result.rows.forEach(row => {
            console.log(`  ✓ ${row.tablename}`);
        });

        // Check row counts
        console.log('\n📈 Current row counts:');
        for (const row of result.rows) {
            const countResult = await client.query(`SELECT COUNT(*) as count FROM ${row.tablename}`);
            console.log(`  • ${row.tablename}: ${countResult.rows[0].count} rows`);
        }

        console.log('\n✅ Database initialization complete!');

    } catch (error) {
        console.error('\n❌ Error initializing database:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the initialization
initializeDatabase()
    .then(() => {
        console.log('\n✅ DATABASE READY TO USE\n');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Initialization failed:', error.message);
        process.exit(1);
    });
