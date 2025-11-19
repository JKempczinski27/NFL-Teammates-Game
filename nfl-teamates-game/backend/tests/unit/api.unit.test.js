const request = require('supertest');
const { app, pool } = require('../../app');

// Mock the database pool
jest.mock('pg', () => {
  const mPool = {
    query: jest.fn(),
    connect: jest.fn(),
    end: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

describe('API Unit Tests', () => {
  afterAll(async () => {
    // Clean up
    if (pool && pool.end) {
      await pool.end();
    }
  });

  describe('GET /', () => {
    it('should return backend is running message', async () => {
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

  describe('GET /api/track', () => {
    it('should return track endpoint working message', async () => {
      const response = await request(app).get('/api/track');
      expect(response.status).toBe(200);
      expect(response.text).toBe('Track endpoint is working!');
    });

    it('should have correct content type', async () => {
      const response = await request(app).get('/api/track');
      expect(response.headers['content-type']).toMatch(/text\/html/);
    });
  });

  describe('POST /api/track', () => {
    it('should accept tracking events and return 200', async () => {
      const trackingData = {
        eventType: 'game_view',
        sessionId: 'test-session-123',
        timestamp: Date.now(),
        eventData: {
          userAgent: 'test-agent',
        },
      };

      const response = await request(app)
        .post('/api/track')
        .send(trackingData)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(200);
    });

    it('should handle empty tracking data', async () => {
      const response = await request(app)
        .post('/api/track')
        .send({})
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(200);
    });

    it('should handle large tracking payloads', async () => {
      const largePayload = {
        eventType: 'test',
        sessionId: 'test',
        eventData: {
          data: 'x'.repeat(10000),
        },
      };

      const response = await request(app)
        .post('/api/track')
        .send(largePayload)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(200);
    });

    it('should respond quickly to tracking events', async () => {
      const start = Date.now();
      await request(app)
        .post('/api/track')
        .send({ eventType: 'test' })
        .set('Content-Type', 'application/json');
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(200);
    });
  });

  describe('POST /api/player', () => {
    beforeEach(() => {
      pool.query.mockClear();
    });

    it('should successfully save player with valid data', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const playerData = {
        name: 'Tom Brady',
        email: 'tom@example.com',
      };

      const response = await request(app)
        .post('/api/player')
        .send(playerData)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Player saved successfully' });
      expect(pool.query).toHaveBeenCalledWith(
        'INSERT INTO players (name, email) VALUES ($1, $2)',
        ['Tom Brady', 'tom@example.com']
      );
    });

    it('should handle database errors gracefully', async () => {
      pool.query.mockRejectedValue(new Error('Database connection failed'));

      const playerData = {
        name: 'Tom Brady',
        email: 'tom@example.com',
      };

      const response = await request(app)
        .post('/api/player')
        .send(playerData)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Error saving player' });
    });

    it('should handle missing name field', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const playerData = {
        email: 'tom@example.com',
      };

      const response = await request(app)
        .post('/api/player')
        .send(playerData)
        .set('Content-Type', 'application/json');

      expect(pool.query).toHaveBeenCalledWith(
        'INSERT INTO players (name, email) VALUES ($1, $2)',
        [undefined, 'tom@example.com']
      );
    });

    it('should handle missing email field', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const playerData = {
        name: 'Tom Brady',
      };

      const response = await request(app)
        .post('/api/player')
        .send(playerData)
        .set('Content-Type', 'application/json');

      expect(pool.query).toHaveBeenCalledWith(
        'INSERT INTO players (name, email) VALUES ($1, $2)',
        ['Tom Brady', undefined]
      );
    });

    it('should handle special characters in name', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const playerData = {
        name: "D'Brickashaw Ferguson",
        email: 'dbrick@example.com',
      };

      const response = await request(app)
        .post('/api/player')
        .send(playerData)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(200);
    });

    it('should handle very long names', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const playerData = {
        name: 'A'.repeat(500),
        email: 'test@example.com',
      };

      const response = await request(app)
        .post('/api/player')
        .send(playerData)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/db-test', () => {
    beforeEach(() => {
      pool.query.mockClear();
    });

    it('should return connected true when database is available', async () => {
      const mockTime = new Date();
      pool.query.mockResolvedValue({
        rows: [{ now: mockTime }],
      });

      const response = await request(app).get('/api/db-test');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('connected', true);
      expect(response.body).toHaveProperty('time');
    });

    it('should return error when database is unavailable', async () => {
      pool.query.mockRejectedValue(new Error('Connection timeout'));

      const response = await request(app).get('/api/db-test');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('connected', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should respond within acceptable time', async () => {
      pool.query.mockResolvedValue({
        rows: [{ now: new Date() }],
      });

      const start = Date.now();
      await request(app).get('/api/db-test');
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(300);
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for unknown routes', async () => {
      const response = await request(app).get('/api/nonexistent');
      expect(response.status).toBe(404);
    });

    it('should handle invalid JSON in POST requests', async () => {
      const response = await request(app)
        .post('/api/player')
        .send('invalid json')
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
    });

    it('should handle malformed requests', async () => {
      const response = await request(app)
        .post('/api/track')
        .send(null);

      expect(response.status).toBe(400);
    });
  });

  describe('CORS', () => {
    it('should have CORS headers enabled', async () => {
      const response = await request(app)
        .get('/')
        .set('Origin', 'http://example.com');

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should accept requests from different origins', async () => {
      const response = await request(app)
        .options('/api/track')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST');

      expect(response.status).toBe(204);
    });
  });

  describe('Performance Tests', () => {
    it('should handle concurrent requests efficiently', async () => {
      const requests = Array(10).fill(null).map(() =>
        request(app).get('/')
      );

      const start = Date.now();
      const responses = await Promise.all(requests);
      const duration = Date.now() - start;

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      expect(duration).toBeLessThan(500);
    });

    it('should handle multiple tracking events in parallel', async () => {
      const trackingRequests = Array(20).fill(null).map((_, i) =>
        request(app)
          .post('/api/track')
          .send({
            eventType: 'test',
            sessionId: `session-${i}`,
          })
      );

      const responses = await Promise.all(trackingRequests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });
});
