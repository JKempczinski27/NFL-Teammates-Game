/**
 * Load & Stress Tests
 * Tests backend performance under heavy load and concurrent requests
 */

const request = require('supertest');
const serverHelper = require('../helpers/serverHelper');
const dbHelper = require('../helpers/dbHelper');
const {
  generateBulkPlayers,
  generateConcurrentRequests,
  randomEmail,
  randomString,
  randomSessionId
} = require('../helpers/testData');

describe('Load & Stress Tests', () => {
  let app;

  beforeAll(async () => {
    await dbHelper.connect();
    app = serverHelper.getApp();
  });

  afterAll(async () => {
    await serverHelper.stop();
    await dbHelper.disconnect();
  });

  beforeEach(async () => {
    await dbHelper.cleanDatabase();
    await dbHelper.seedTeams();
  });

  describe('Concurrent Request Handling', () => {
    it('should handle 50 concurrent GET requests', async () => {
      const requests = Array.from({ length: 50 }, () =>
        request(app).get('/')
      );

      const start = Date.now();
      const responses = await Promise.all(requests);
      const duration = Date.now() - start;

      expect(responses.every(r => r.status === 200)).toBe(true);
      expect(duration).toBeLessThan(5000); // Should complete in 5 seconds
    });

    it('should handle 100 concurrent POST requests to /api/player', async () => {
      const players = generateConcurrentRequests(100);
      const requests = players.map((player, i) =>
        request(app)
          .post('/api/player')
          .send({ name: player.name, email: `test${i}@example.com` })
      );

      const start = Date.now();
      const responses = await Promise.all(requests);
      const duration = Date.now() - start;

      const successful = responses.filter(r => r.status === 200).length;
      expect(successful).toBeGreaterThan(50); // At least 50% success rate
      expect(duration).toBeLessThan(30000); // Should complete in 30 seconds

      console.log(`Concurrent POST: ${successful}/100 successful in ${duration}ms`);
    });

    it('should handle 200 concurrent track requests', async () => {
      const requests = Array.from({ length: 200 }, (_, i) =>
        request(app)
          .post('/api/track')
          .send({
            event: 'test_event',
            sessionId: randomSessionId(),
            data: { index: i }
          })
      );

      const start = Date.now();
      const responses = await Promise.all(requests);
      const duration = Date.now() - start;

      expect(responses.every(r => r.status === 200)).toBe(true);
      expect(duration).toBeLessThan(10000); // Should complete in 10 seconds

      console.log(`200 concurrent track requests completed in ${duration}ms`);
    });

    it('should handle mixed concurrent requests', async () => {
      const requests = [
        ...Array.from({ length: 20 }, () => request(app).get('/')),
        ...Array.from({ length: 20 }, () => request(app).get('/api/db-test')),
        ...Array.from({ length: 20 }, (_, i) =>
          request(app)
            .post('/api/player')
            .send({ name: `Player ${i}`, email: `test${i}@example.com` })
        ),
        ...Array.from({ length: 20 }, () =>
          request(app).post('/api/track').send({ event: 'test' })
        )
      ];

      const start = Date.now();
      const responses = await Promise.all(requests);
      const duration = Date.now() - start;

      const successful = responses.filter(r => r.status === 200).length;
      expect(successful).toBeGreaterThan(60); // At least 75% success

      console.log(`Mixed concurrent: ${successful}/80 successful in ${duration}ms`);
    });
  });

  describe('Database Connection Pool Stress', () => {
    it('should handle rapid database queries', async () => {
      const queries = Array.from({ length: 100 }, () =>
        dbHelper.query('SELECT NOW()')
      );

      const start = Date.now();
      const results = await Promise.all(queries);
      const duration = Date.now() - start;

      expect(results.every(r => r.rows.length > 0)).toBe(true);
      expect(duration).toBeLessThan(5000);

      console.log(`100 DB queries completed in ${duration}ms`);
    });

    it('should handle concurrent complex queries', async () => {
      await dbHelper.seedPlayers();

      const queries = Array.from({ length: 50 }, () =>
        dbHelper.query(`
          SELECT p.*, COUNT(tr.id) as team_count
          FROM players p
          LEFT JOIN team_relationships tr ON p.id = tr.player_id
          GROUP BY p.id
        `)
      );

      const start = Date.now();
      const results = await Promise.all(queries);
      const duration = Date.now() - start;

      expect(results.every(r => r.rows.length >= 0)).toBe(true);
      expect(duration).toBeLessThan(10000);

      console.log(`50 complex queries completed in ${duration}ms`);
    });

    it('should handle connection pool exhaustion gracefully', async () => {
      // Create more concurrent queries than pool size (pool max = 10)
      const queries = Array.from({ length: 50 }, (_, i) =>
        dbHelper.query('SELECT $1::text as value', [`Query ${i}`])
      );

      const results = await Promise.all(queries);

      expect(results.length).toBe(50);
      expect(results.every(r => r.rows.length > 0)).toBe(true);
    });
  });

  describe('Bulk Data Operations', () => {
    it('should insert 500 players sequentially', async () => {
      const players = generateBulkPlayers(500);

      const start = Date.now();
      for (const player of players) {
        await dbHelper.createPlayer(player);
      }
      const duration = Date.now() - start;

      const count = await dbHelper.getTableCount('players');
      expect(count).toBe(500);

      console.log(`500 sequential inserts completed in ${duration}ms`);
      expect(duration).toBeLessThan(60000); // Should complete in 1 minute
    }, 90000); // Extend test timeout

    it('should insert 100 players concurrently', async () => {
      const players = generateBulkPlayers(100);

      const start = Date.now();
      const promises = players.map(player => dbHelper.createPlayer(player));
      await Promise.all(promises);
      const duration = Date.now() - start;

      const count = await dbHelper.getTableCount('players');
      expect(count).toBe(100);

      console.log(`100 concurrent inserts completed in ${duration}ms`);
      expect(duration).toBeLessThan(30000); // Should complete in 30 seconds
    }, 60000);

    it('should handle bulk read operations', async () => {
      await dbHelper.seedPlayers();

      const start = Date.now();
      const queries = Array.from({ length: 100 }, () =>
        dbHelper.query('SELECT * FROM players')
      );
      await Promise.all(queries);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(5000);
      console.log(`100 bulk reads completed in ${duration}ms`);
    });

    it('should handle bulk update operations', async () => {
      const players = await dbHelper.seedPlayers();

      const start = Date.now();
      const updates = players.map(player =>
        dbHelper.query(
          'UPDATE players SET position = $1 WHERE id = $2',
          ['RB', player.id]
        )
      );
      await Promise.all(updates);
      const duration = Date.now() - start;

      const result = await dbHelper.query(
        'SELECT COUNT(*) FROM players WHERE position = $1',
        ['RB']
      );
      expect(parseInt(result.rows[0].count)).toBe(players.length);

      console.log(`${players.length} concurrent updates in ${duration}ms`);
    });
  });

  describe('Memory & Resource Stress', () => {
    it('should handle large response payloads', async () => {
      // Insert many records
      const players = generateBulkPlayers(200);
      for (const player of players.slice(0, 200)) {
        await dbHelper.createPlayer(player);
      }

      const start = Date.now();
      const result = await dbHelper.query('SELECT * FROM players');
      const duration = Date.now() - start;

      expect(result.rows.length).toBe(200);
      expect(duration).toBeLessThan(5000);

      console.log(`Retrieved 200 records in ${duration}ms`);
    }, 60000);

    it('should handle rapid session creation', async () => {
      const sessions = Array.from({ length: 100 }, () => randomSessionId());

      const start = Date.now();
      const promises = sessions.map(sessionId =>
        dbHelper.createUserStats(sessionId, { correct: 10 })
      );
      await Promise.all(promises);
      const duration = Date.now() - start;

      const count = await dbHelper.getTableCount('user_stats');
      expect(count).toBe(100);

      console.log(`100 user sessions created in ${duration}ms`);
    }, 60000);

    it('should handle complex join queries under load', async () => {
      await dbHelper.seedPlayers();
      const players = await dbHelper.query('SELECT * FROM players LIMIT 5');

      // Create relationships
      const teams = await dbHelper.query('SELECT id FROM teams LIMIT 5');
      for (const player of players.rows) {
        for (const team of teams.rows) {
          await dbHelper.query(
            'INSERT INTO team_relationships (player_id, team_id, year_start) VALUES ($1, $2, $3)',
            [player.id, team.id, 2020]
          );
        }
      }

      const start = Date.now();
      const queries = Array.from({ length: 50 }, () =>
        dbHelper.query(`
          SELECT p.name, t.name as team_name, tr.year_start
          FROM players p
          JOIN team_relationships tr ON p.id = tr.player_id
          JOIN teams t ON tr.team_id = t.id
          ORDER BY p.name, t.name
        `)
      );
      await Promise.all(queries);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(10000);
      console.log(`50 complex joins completed in ${duration}ms`);
    });
  });

  describe('Sustained Load Testing', () => {
    it('should handle sustained request rate (10 req/sec for 10 seconds)', async () => {
      const totalRequests = 100;
      const interval = 100; // 100ms = 10 req/sec
      const results = [];

      const start = Date.now();

      for (let i = 0; i < totalRequests; i++) {
        const promise = request(app)
          .post('/api/track')
          .send({ event: 'sustained_test', index: i });

        results.push(promise);

        if (i < totalRequests - 1) {
          await new Promise(resolve => setTimeout(resolve, interval));
        }
      }

      await Promise.all(results);
      const duration = Date.now() - start;

      const successful = (await Promise.all(results)).filter(r => r.status === 200).length;
      expect(successful).toBeGreaterThan(90); // 90% success rate

      console.log(`Sustained load: ${successful}/${totalRequests} in ${duration}ms`);
    }, 30000);

    it('should maintain performance over time', async () => {
      const rounds = 5;
      const requestsPerRound = 20;
      const durations = [];

      for (let round = 0; round < rounds; round++) {
        const start = Date.now();

        const requests = Array.from({ length: requestsPerRound }, (_, i) =>
          request(app)
            .post('/api/player')
            .send({ name: `Round${round}_Player${i}`, email: randomEmail() })
        );

        await Promise.all(requests);
        const duration = Date.now() - start;
        durations.push(duration);

        console.log(`Round ${round + 1}: ${duration}ms`);
      }

      // Performance should not degrade significantly
      const firstRound = durations[0];
      const lastRound = durations[durations.length - 1];
      expect(lastRound).toBeLessThan(firstRound * 2); // No more than 2x slower
    }, 60000);
  });

  describe('Error Recovery Under Load', () => {
    it('should recover from invalid requests during load', async () => {
      const requests = [
        ...Array.from({ length: 25 }, (_, i) =>
          request(app)
            .post('/api/player')
            .send({ name: `Valid ${i}`, email: randomEmail() })
        ),
        ...Array.from({ length: 25 }, () =>
          request(app)
            .post('/api/player')
            .send({ invalid: 'data' })
        )
      ];

      // Shuffle requests
      requests.sort(() => Math.random() - 0.5);

      const responses = await Promise.all(requests);

      const successful = responses.filter(r => r.status === 200).length;
      expect(successful).toBeGreaterThanOrEqual(25);

      // System should still be responsive after errors
      const healthCheck = await request(app).get('/');
      expect(healthCheck.status).toBe(200);
    });

    it('should handle database errors gracefully under load', async () => {
      const requests = Array.from({ length: 50 }, (_, i) =>
        request(app)
          .post('/api/player')
          .send({
            name: i % 2 === 0 ? `Player ${i}` : null, // Every other request is invalid
            email: randomEmail()
          })
      );

      const responses = await Promise.all(requests);

      // Some should succeed, some should fail
      const successful = responses.filter(r => r.status === 200).length;
      const failed = responses.filter(r => r.status >= 400).length;

      expect(successful + failed).toBe(50);
      expect(successful).toBeGreaterThan(0);
      expect(failed).toBeGreaterThan(0);

      // Database should still be accessible
      const dbTest = await request(app).get('/api/db-test');
      expect(dbTest.status).toBe(200);
    });
  });

  describe('Performance Benchmarks', () => {
    it('should respond to health check in < 50ms', async () => {
      const measurements = [];

      for (let i = 0; i < 10; i++) {
        const start = Date.now();
        await request(app).get('/');
        const duration = Date.now() - start;
        measurements.push(duration);
      }

      const avg = measurements.reduce((a, b) => a + b, 0) / measurements.length;
      expect(avg).toBeLessThan(50);

      console.log(`Health check avg: ${avg.toFixed(2)}ms`);
    });

    it('should insert player in < 500ms', async () => {
      const measurements = [];

      for (let i = 0; i < 10; i++) {
        const start = Date.now();
        await request(app)
          .post('/api/player')
          .send({ name: `Benchmark ${i}`, email: randomEmail() });
        const duration = Date.now() - start;
        measurements.push(duration);
      }

      const avg = measurements.reduce((a, b) => a + b, 0) / measurements.length;
      expect(avg).toBeLessThan(500);

      console.log(`Player insert avg: ${avg.toFixed(2)}ms`);
    });

    it('should handle database query in < 100ms', async () => {
      const measurements = [];

      for (let i = 0; i < 10; i++) {
        const start = Date.now();
        await dbHelper.query('SELECT COUNT(*) FROM teams');
        const duration = Date.now() - start;
        measurements.push(duration);
      }

      const avg = measurements.reduce((a, b) => a + b, 0) / measurements.length;
      expect(avg).toBeLessThan(100);

      console.log(`DB query avg: ${avg.toFixed(2)}ms`);
    });
  });
});
