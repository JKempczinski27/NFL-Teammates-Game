/**
 * Unit Tests - API Endpoints
 * Tests individual API endpoints for correct behavior
 */

const request = require('supertest');
const serverHelper = require('../helpers/serverHelper');
const dbHelper = require('../helpers/dbHelper');
const { randomEmail, randomString } = require('../helpers/testData');

describe('API Endpoints - Unit Tests', () => {
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
    // Clean database before each test for isolation
    await dbHelper.cleanDatabase();
    await dbHelper.seedTeams();
  });

  describe('GET /', () => {
    it('should return health check message', async () => {
      const response = await request(app).get('/');

      expect(response.status).toBe(200);
      expect(response.text).toBe('Backend is running');
    });

    it('should respond within 100ms', async () => {
      const start = Date.now();
      await request(app).get('/');
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
    });
  });

  describe('GET /api/db-test', () => {
    it('should return database connection status', async () => {
      const response = await request(app).get('/api/db-test');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('connected', true);
      expect(response.body).toHaveProperty('time');
    });

    it('should return valid timestamp', async () => {
      const response = await request(app).get('/api/db-test');

      const timestamp = new Date(response.body.time);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).not.toBeNaN();
    });

    it('should handle database queries correctly', async () => {
      const response = await request(app).get('/api/db-test');

      expect(response.body.connected).toBe(true);
      expect(typeof response.body.time).toBe('string');
    });
  });

  describe('POST /api/player', () => {
    it('should save player with valid data', async () => {
      const playerData = {
        name: 'Test Player',
        email: randomEmail()
      };

      const response = await request(app)
        .post('/api/player')
        .send(playerData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Player saved successfully');
    });

    it('should persist player data to database', async () => {
      const playerData = {
        name: 'Persistent Player',
        email: randomEmail()
      };

      await request(app)
        .post('/api/player')
        .send(playerData);

      // Verify in database
      const result = await dbHelper.query(
        'SELECT * FROM players WHERE name = $1',
        [playerData.name]
      );

      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.rows[0].name).toBe(playerData.name);
    });

    it('should handle missing name field', async () => {
      const response = await request(app)
        .post('/api/player')
        .send({ email: randomEmail() });

      // Should fail or handle gracefully
      expect([400, 500]).toContain(response.status);
    });

    it('should handle missing email field', async () => {
      const response = await request(app)
        .post('/api/player')
        .send({ name: 'Test Player' });

      // Should still work as email might be optional
      expect([200, 400, 500]).toContain(response.status);
    });

    it('should handle empty request body', async () => {
      const response = await request(app)
        .post('/api/player')
        .send({});

      expect([400, 500]).toContain(response.status);
    });

    it('should accept valid JSON', async () => {
      const response = await request(app)
        .post('/api/player')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ name: 'JSON Player', email: randomEmail() }));

      expect([200, 201]).toContain(response.status);
    });

    it('should handle multiple players with same name', async () => {
      const playerData = {
        name: 'Duplicate Name',
        email: randomEmail()
      };

      const response1 = await request(app)
        .post('/api/player')
        .send(playerData);

      const response2 = await request(app)
        .post('/api/player')
        .send({ ...playerData, email: randomEmail() });

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
    });

    it('should handle very long names', async () => {
      const longName = 'A'.repeat(255);
      const response = await request(app)
        .post('/api/player')
        .send({ name: longName, email: randomEmail() });

      // Should either accept or reject based on validation
      expect([200, 400, 500]).toContain(response.status);
    });

    it('should respond within reasonable time', async () => {
      const start = Date.now();
      await request(app)
        .post('/api/player')
        .send({ name: 'Speed Test', email: randomEmail() });
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(1000);
    });
  });

  describe('GET /api/track', () => {
    it('should return track endpoint status', async () => {
      const response = await request(app).get('/api/track');

      expect(response.status).toBe(200);
      expect(response.text).toBe('Track endpoint is working!');
    });

    it('should respond quickly', async () => {
      const start = Date.now();
      await request(app).get('/api/track');
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(50);
    });
  });

  describe('POST /api/track', () => {
    it('should accept tracking data', async () => {
      const trackingData = {
        event: 'answer_submitted',
        sessionId: randomString(32),
        data: { correct: true }
      };

      const response = await request(app)
        .post('/api/track')
        .send(trackingData);

      expect(response.status).toBe(200);
    });

    it('should accept various event types', async () => {
      const events = ['answer_submitted', 'game_started', 'share_clicked'];

      for (const event of events) {
        const response = await request(app)
          .post('/api/track')
          .send({ event, sessionId: randomString(32) });

        expect(response.status).toBe(200);
      }
    });

    it('should handle empty tracking data', async () => {
      const response = await request(app)
        .post('/api/track')
        .send({});

      expect(response.status).toBe(200);
    });

    it('should handle large payload', async () => {
      const largeData = {
        event: 'test',
        data: Array(100).fill({ key: 'value' })
      };

      const response = await request(app)
        .post('/api/track')
        .send(largeData);

      expect(response.status).toBe(200);
    });
  });

  describe('404 Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app).get('/api/nonexistent');

      expect(response.status).toBe(404);
    });

    it('should return 404 for invalid POST endpoints', async () => {
      const response = await request(app)
        .post('/api/invalid')
        .send({});

      expect(response.status).toBe(404);
    });
  });

  describe('CORS', () => {
    it('should include CORS headers', async () => {
      const response = await request(app).get('/');

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });

    it('should allow cross-origin requests', async () => {
      const response = await request(app)
        .get('/')
        .set('Origin', 'http://localhost:3000');

      expect(response.status).toBe(200);
    });
  });
});
