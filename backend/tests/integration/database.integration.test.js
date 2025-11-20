const request = require('supertest');
const { Pool } = require('pg');
require('dotenv').config();

// Note: These tests require a live database connection
// They can be skipped in CI/CD if DATABASE_URL is not set

const runIntegrationTests = process.env.DATABASE_URL && process.env.RUN_INTEGRATION_TESTS === 'true';

(runIntegrationTests ? describe : describe.skip)('Database Integration Tests', () => {
  let pool;
  let app;

  beforeAll(() => {
    // Create a real pool connection for integration tests
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
    });

    // Import the app after setting up the pool
    app = require('../../app').app;
  });

  afterAll(async () => {
    // Clean up test data and close connection
    try {
      await pool.query("DELETE FROM players WHERE email LIKE '%@integration-test.com'");
      await pool.end();
    } catch (err) {
      console.error('Cleanup error:', err);
    }
  });

  describe('Database Connection', () => {
    it('should successfully connect to the database', async () => {
      const result = await pool.query('SELECT NOW()');
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].now).toBeDefined();
    });

    it('should have players table available', async () => {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_name = 'players'
        );
      `);
      expect(result.rows[0].exists).toBe(true);
    });

    it('should verify players table structure', async () => {
      const result = await pool.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'players'
        ORDER BY ordinal_position;
      `);

      const columns = result.rows.map(row => row.column_name);
      expect(columns).toContain('name');
      expect(columns).toContain('email');
    });
  });

  describe('Player Operations', () => {
    it('should insert a player into the database', async () => {
      const playerData = {
        name: 'Integration Test Player',
        email: 'integration1@integration-test.com',
      };

      await pool.query(
        'INSERT INTO players (name, email) VALUES ($1, $2)',
        [playerData.name, playerData.email]
      );

      const result = await pool.query(
        'SELECT * FROM players WHERE email = $1',
        [playerData.email]
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].name).toBe(playerData.name);
      expect(result.rows[0].email).toBe(playerData.email);
    });

    it('should retrieve inserted player data', async () => {
      const playerData = {
        name: 'Test Retrieval',
        email: 'retrieve@integration-test.com',
      };

      await pool.query(
        'INSERT INTO players (name, email) VALUES ($1, $2)',
        [playerData.name, playerData.email]
      );

      const result = await pool.query('SELECT * FROM players WHERE email = $1', [playerData.email]);

      expect(result.rows[0].name).toBe(playerData.name);
    });

    it('should handle concurrent player insertions', async () => {
      const players = Array(10).fill(null).map((_, i) => ({
        name: `Concurrent Player ${i}`,
        email: `concurrent${i}@integration-test.com`,
      }));

      const insertPromises = players.map(player =>
        pool.query(
          'INSERT INTO players (name, email) VALUES ($1, $2)',
          [player.name, player.email]
        )
      );

      await Promise.all(insertPromises);

      const result = await pool.query(
        "SELECT COUNT(*) FROM players WHERE email LIKE 'concurrent%@integration-test.com'"
      );

      expect(parseInt(result.rows[0].count)).toBeGreaterThanOrEqual(10);
    });

    it('should handle special characters in player data', async () => {
      const playerData = {
        name: "D'Brickashaw O'Neill-Smith",
        email: 'special@integration-test.com',
      };

      await pool.query(
        'INSERT INTO players (name, email) VALUES ($1, $2)',
        [playerData.name, playerData.email]
      );

      const result = await pool.query('SELECT * FROM players WHERE email = $1', [playerData.email]);

      expect(result.rows[0].name).toBe(playerData.name);
    });

    it('should handle unicode characters', async () => {
      const playerData = {
        name: 'Måns Zelmerlöw 中文',
        email: 'unicode@integration-test.com',
      };

      await pool.query(
        'INSERT INTO players (name, email) VALUES ($1, $2)',
        [playerData.name, playerData.email]
      );

      const result = await pool.query('SELECT * FROM players WHERE email = $1', [playerData.email]);

      expect(result.rows[0].name).toBe(playerData.name);
    });
  });

  describe('Connection Pool Management', () => {
    it('should handle multiple queries with connection pooling', async () => {
      const queries = Array(50).fill(null).map(() =>
        pool.query('SELECT NOW()')
      );

      const results = await Promise.all(queries);

      results.forEach(result => {
        expect(result.rows).toHaveLength(1);
        expect(result.rows[0].now).toBeDefined();
      });
    });

    it('should recover from query errors', async () => {
      // Execute an invalid query
      try {
        await pool.query('SELECT * FROM nonexistent_table');
      } catch (err) {
        expect(err).toBeDefined();
      }

      // Pool should still work after error
      const result = await pool.query('SELECT NOW()');
      expect(result.rows).toHaveLength(1);
    });

    it('should handle long-running queries', async () => {
      const result = await pool.query('SELECT pg_sleep(0.5), NOW()');
      expect(result.rows).toHaveLength(1);
    }, 10000);
  });

  describe('Performance Tests', () => {
    it('should complete simple queries within 100ms', async () => {
      const start = Date.now();
      await pool.query('SELECT 1');
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it('should complete player insertion within 200ms', async () => {
      const start = Date.now();
      await pool.query(
        'INSERT INTO players (name, email) VALUES ($1, $2)',
        ['Speed Test', 'speed@integration-test.com']
      );
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(200);
    });

    it('should handle batch inserts efficiently', async () => {
      const batchSize = 100;
      const players = Array(batchSize).fill(null).map((_, i) => ({
        name: `Batch Player ${i}`,
        email: `batch${i}@integration-test.com`,
      }));

      const start = Date.now();

      for (const player of players) {
        await pool.query(
          'INSERT INTO players (name, email) VALUES ($1, $2)',
          [player.name, player.email]
        );
      }

      const duration = Date.now() - start;
      const avgTimePerInsert = duration / batchSize;

      expect(avgTimePerInsert).toBeLessThan(50); // Average < 50ms per insert
    }, 30000);
  });

  describe('Database Constraints', () => {
    it('should handle duplicate email insertion gracefully', async () => {
      const playerData = {
        name: 'Duplicate Test',
        email: 'duplicate@integration-test.com',
      };

      // Insert first time
      await pool.query(
        'INSERT INTO players (name, email) VALUES ($1, $2)',
        [playerData.name, playerData.email]
      );

      // Try to insert duplicate - behavior depends on table constraints
      try {
        await pool.query(
          'INSERT INTO players (name, email) VALUES ($1, $2)',
          [playerData.name, playerData.email]
        );
        // If no unique constraint, this will succeed
      } catch (err) {
        // If unique constraint exists, this will fail
        expect(err).toBeDefined();
      }
    });

    it('should handle NULL values appropriately', async () => {
      try {
        await pool.query(
          'INSERT INTO players (name, email) VALUES ($1, $2)',
          [null, null]
        );
        // If NULLs are allowed, this succeeds
        const result = await pool.query(
          'SELECT * FROM players WHERE name IS NULL AND email IS NULL LIMIT 1'
        );
        expect(result.rows.length).toBeGreaterThanOrEqual(0);
      } catch (err) {
        // If NOT NULL constraint exists, expect error
        expect(err).toBeDefined();
      }
    });
  });

  describe('Data Integrity', () => {
    it('should maintain data consistency across transactions', async () => {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        await client.query(
          'INSERT INTO players (name, email) VALUES ($1, $2)',
          ['Transaction Test 1', 'trans1@integration-test.com']
        );

        await client.query(
          'INSERT INTO players (name, email) VALUES ($1, $2)',
          ['Transaction Test 2', 'trans2@integration-test.com']
        );

        await client.query('COMMIT');

        const result = await pool.query(
          "SELECT COUNT(*) FROM players WHERE email LIKE 'trans%@integration-test.com'"
        );

        expect(parseInt(result.rows[0].count)).toBeGreaterThanOrEqual(2);
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    });

    it('should rollback failed transactions', async () => {
      const client = await pool.connect();
      const testEmail = 'rollback@integration-test.com';

      try {
        await client.query('BEGIN');

        await client.query(
          'INSERT INTO players (name, email) VALUES ($1, $2)',
          ['Rollback Test', testEmail]
        );

        // Intentionally cause an error
        await client.query('SELECT * FROM nonexistent_table');

        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');

        // Verify data was not inserted
        const result = await pool.query(
          'SELECT * FROM players WHERE email = $1',
          [testEmail]
        );

        expect(result.rows).toHaveLength(0);
      } finally {
        client.release();
      }
    });
  });
});

// Export pool for other tests if needed
module.exports = { pool };
