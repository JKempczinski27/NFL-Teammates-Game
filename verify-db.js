const { Pool } = require('pg');

// Determine which database to use
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
  connectionString: 'postgresql://postgres:rYaxKDTGRwelTItjmNkjmutTnDZJCtvO@postgres-ulot.railway.internal:5432/railway',
  ssl: {
    rejectUnauthorized: false,
  },
};

const pool = new Pool(config);

async function verifyDatabase() {
  console.log('=== PostgreSQL Database Verification ===');
  console.log(`Environment: ${useLocal ? 'LOCAL' : 'RAILWAY'}\n`);

  try {
    // Test connection
    console.log('1. Testing database connection...');
    const connTest = await pool.query('SELECT NOW(), version()');
    console.log('   ✓ Connection successful!');
    console.log('   Server time:', connTest.rows[0].now);
    console.log('   PostgreSQL version:', connTest.rows[0].version.split(',')[0]);
    console.log();

    // Check current database
    console.log('2. Checking current database...');
    const dbCheck = await pool.query('SELECT current_database()');
    console.log('   ✓ Connected to database:', dbCheck.rows[0].current_database);
    console.log();

    // List all tables
    console.log('3. Checking for tables...');
    const tablesQuery = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    if (tablesQuery.rows.length === 0) {
      console.log('   ⚠ No tables found in the database');
    } else {
      console.log('   ✓ Found', tablesQuery.rows.length, 'table(s):');
      tablesQuery.rows.forEach(row => {
        console.log('     -', row.table_name);
      });
    }
    console.log();

    // Check specific tables and their structure
    const expectedTables = ['players', 'player_updated'];
    console.log('4. Verifying expected tables...');

    for (const tableName of expectedTables) {
      try {
        const tableExists = await pool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = $1
          )
        `, [tableName]);

        if (tableExists.rows[0].exists) {
          console.log(`   ✓ Table '${tableName}' exists`);

          // Get column information
          const columns = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = $1
            ORDER BY ordinal_position
          `, [tableName]);

          console.log(`     Columns (${columns.rows.length}):`);
          columns.rows.forEach(col => {
            console.log(`       - ${col.column_name}: ${col.data_type}${col.is_nullable === 'NO' ? ' NOT NULL' : ''}`);
          });

          // Get row count
          const count = await pool.query(`SELECT COUNT(*) FROM ${tableName}`);
          console.log(`     Row count: ${count.rows[0].count}`);
        } else {
          console.log(`   ✗ Table '${tableName}' NOT found`);
        }
      } catch (error) {
        console.log(`   ✗ Error checking table '${tableName}':`, error.message);
      }
    }

    console.log('\n=== Verification Complete ===');

  } catch (error) {
    console.error('❌ Database verification failed:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

verifyDatabase();
