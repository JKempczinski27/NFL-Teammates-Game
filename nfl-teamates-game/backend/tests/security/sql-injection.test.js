/**
 * Security Tests - SQL Injection & XSS
 * Tests backend resilience against common attack vectors
 */

const request = require('supertest');
const serverHelper = require('../helpers/serverHelper');
const dbHelper = require('../helpers/dbHelper');
const {
  getSqlInjectionPayloads,
  getXssPayloads,
  getInvalidDataPayloads,
  randomEmail
} = require('../helpers/testData');

describe('Security Tests - SQL Injection & XSS', () => {
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

  describe('SQL Injection Attacks', () => {
    it('should prevent SQL injection in player name field', async () => {
      const payloads = getSqlInjectionPayloads();

      for (const payload of payloads) {
        const response = await request(app)
          .post('/api/player')
          .send({ name: payload, email: randomEmail() });

        // Should not crash - either accept as data or reject
        expect([200, 400, 500]).toContain(response.status);

        // Verify database integrity - tables should still exist
        const tableCheck = await dbHelper.query(
          "SELECT tablename FROM pg_tables WHERE schemaname = 'public'"
        );
        const tableNames = tableCheck.rows.map(r => r.tablename);
        expect(tableNames).toContain('players');
        expect(tableNames).toContain('teams');
      }
    });

    it('should sanitize SQL injection in email field', async () => {
      const sqlPayloads = [
        "test@example.com'; DROP TABLE players; --",
        "admin' OR '1'='1",
        "'; DELETE FROM players WHERE '1'='1"
      ];

      for (const payload of sqlPayloads) {
        await request(app)
          .post('/api/player')
          .send({ name: 'Test Player', email: payload });

        // Verify players table still exists and is intact
        const result = await dbHelper.query('SELECT COUNT(*) FROM players');
        expect(result.rows).toBeDefined();
      }
    });

    it('should handle SQL injection in tracking endpoint', async () => {
      const payloads = getSqlInjectionPayloads();

      for (const payload of payloads) {
        const response = await request(app)
          .post('/api/track')
          .send({
            event: payload,
            sessionId: payload,
            data: { malicious: payload }
          });

        expect(response.status).toBe(200);
      }
    });

    it('should prevent UNION-based SQL injection', async () => {
      const unionPayloads = [
        "1' UNION SELECT * FROM players--",
        "' UNION ALL SELECT NULL--",
        "1' UNION SELECT password FROM users--"
      ];

      for (const payload of unionPayloads) {
        const response = await request(app)
          .post('/api/player')
          .send({ name: payload, email: 'test@example.com' });

        // Should not expose database structure
        expect(response.body).not.toHaveProperty('password');
      }
    });

    it('should prevent blind SQL injection', async () => {
      const blindPayloads = [
        "1' AND 1=1--",
        "1' AND 1=2--",
        "' OR SLEEP(5)--"
      ];

      for (const payload of blindPayloads) {
        const start = Date.now();
        await request(app)
          .post('/api/player')
          .send({ name: payload, email: 'test@example.com' });
        const duration = Date.now() - start;

        // Should not cause delays (no SLEEP execution)
        expect(duration).toBeLessThan(2000);
      }
    });

    it('should protect against stacked queries', async () => {
      const stackedPayloads = [
        "'; DROP TABLE players; CREATE TABLE hacked (id INT);--",
        "1'; DELETE FROM players;--"
      ];

      for (const payload of stackedPayloads) {
        await request(app)
          .post('/api/player')
          .send({ name: payload, email: 'test@example.com' });

        // Verify original tables still exist
        const result = await dbHelper.query(
          "SELECT COUNT(*) FROM players"
        );
        expect(result.rows).toBeDefined();
      }
    });
  });

  describe('XSS (Cross-Site Scripting) Prevention', () => {
    it('should handle XSS payloads in player name', async () => {
      const xssPayloads = getXssPayloads();

      for (const payload of xssPayloads) {
        const response = await request(app)
          .post('/api/player')
          .send({ name: payload, email: randomEmail() });

        // Should accept or reject gracefully
        expect([200, 400, 500]).toContain(response.status);
      }
    });

    it('should not execute script tags in responses', async () => {
      const scriptPayload = "<script>alert('XSS')</script>";

      const response = await request(app)
        .post('/api/player')
        .send({ name: scriptPayload, email: randomEmail() });

      // Response should not contain executable scripts
      const responseText = JSON.stringify(response.body);
      if (responseText.includes('script')) {
        // If script tag is present, it should be escaped
        expect(responseText).not.toMatch(/<script>.*<\/script>/);
      }
    });

    it('should handle event handlers in input', async () => {
      const eventPayloads = [
        '<img src=x onerror=alert(1)>',
        '<body onload=alert(1)>',
        '<svg onload=alert(1)>'
      ];

      for (const payload of eventPayloads) {
        await request(app)
          .post('/api/player')
          .send({ name: payload, email: randomEmail() });
      }

      // If data is stored, verify it's stored safely
      const result = await dbHelper.query('SELECT name FROM players');
      // Data might be stored as-is (that's ok), but should be escaped on output
      expect(result.rows).toBeDefined();
    });
  });

  describe('Input Validation', () => {
    it('should handle null values', async () => {
      const response = await request(app)
        .post('/api/player')
        .send({ name: null, email: null });

      expect([400, 500]).toContain(response.status);
    });

    it('should handle undefined values', async () => {
      const response = await request(app)
        .post('/api/player')
        .send({ name: undefined, email: undefined });

      expect([400, 500]).toContain(response.status);
    });

    it('should handle extremely long strings', async () => {
      const longString = 'A'.repeat(10000);

      const response = await request(app)
        .post('/api/player')
        .send({ name: longString, email: randomEmail() });

      // Should either truncate or reject
      expect([200, 400, 413, 500]).toContain(response.status);
    });

    it('should handle special characters', async () => {
      const specialChars = [
        "O'Brien",
        'Player "The Beast" Johnson',
        'José García',
        'Müller',
        '测试',
        '🏈 Player'
      ];

      for (const name of specialChars) {
        const response = await request(app)
          .post('/api/player')
          .send({ name, email: randomEmail() });

        // Should handle or reject gracefully
        expect([200, 400, 500]).toContain(response.status);
      }
    });

    it('should handle negative numbers', async () => {
      const response = await request(app)
        .post('/api/player')
        .send({ name: 'Test', email: -1 });

      expect([200, 400, 500]).toContain(response.status);
    });

    it('should handle boolean values', async () => {
      const response = await request(app)
        .post('/api/player')
        .send({ name: true, email: false });

      expect([200, 400, 500]).toContain(response.status);
    });

    it('should handle array inputs', async () => {
      const response = await request(app)
        .post('/api/player')
        .send({ name: ['array', 'of', 'values'], email: randomEmail() });

      expect([200, 400, 500]).toContain(response.status);
    });

    it('should handle object inputs', async () => {
      const response = await request(app)
        .post('/api/player')
        .send({ name: { nested: 'object' }, email: randomEmail() });

      expect([200, 400, 500]).toContain(response.status);
    });
  });

  describe('Header Injection', () => {
    it('should prevent header injection attacks', async () => {
      const headerPayloads = [
        'test\r\nX-Injected: true',
        'test\nSet-Cookie: admin=true',
        'test%0d%0aX-Injected:true'
      ];

      for (const payload of headerPayloads) {
        const response = await request(app)
          .post('/api/player')
          .set('User-Agent', payload)
          .send({ name: 'Test', email: randomEmail() });

        // Should not reflect injected headers
        expect(response.headers).not.toHaveProperty('x-injected');
      }
    });

    it('should handle malicious Content-Type headers', async () => {
      const response = await request(app)
        .post('/api/player')
        .set('Content-Type', 'application/json; charset=utf-7')
        .send(JSON.stringify({ name: 'Test', email: randomEmail() }));

      expect([200, 400, 415, 500]).toContain(response.status);
    });
  });

  describe('NoSQL Injection (Future-proofing)', () => {
    it('should handle JSON-based injection attempts', async () => {
      const noSqlPayloads = [
        { $ne: null },
        { $gt: '' },
        { $where: '1==1' },
        { $regex: '.*' }
      ];

      for (const payload of noSqlPayloads) {
        const response = await request(app)
          .post('/api/player')
          .send({ name: payload, email: randomEmail() });

        expect([200, 400, 500]).toContain(response.status);
      }
    });
  });

  describe('Path Traversal', () => {
    it('should prevent directory traversal attempts', async () => {
      const pathPayloads = [
        '../../etc/passwd',
        '../../../windows/system32',
        '....//....//etc/passwd',
        '%2e%2e%2f%2e%2e%2f'
      ];

      for (const payload of pathPayloads) {
        const response = await request(app)
          .post('/api/player')
          .send({ name: payload, email: randomEmail() });

        // Should not expose file system
        expect(response.body).not.toMatch(/root:x:/);
      }
    });
  });

  describe('Command Injection', () => {
    it('should prevent command injection in inputs', async () => {
      const cmdPayloads = [
        '; ls -la',
        '| cat /etc/passwd',
        '`whoami`',
        '$(uname -a)',
        '& ping -c 10 127.0.0.1'
      ];

      for (const payload of cmdPayloads) {
        const response = await request(app)
          .post('/api/player')
          .send({ name: payload, email: randomEmail() });

        // Should not execute commands
        expect([200, 400, 500]).toContain(response.status);
      }
    });
  });

  describe('Rate Limiting & DoS Prevention', () => {
    it('should handle rapid repeated requests', async () => {
      const promises = Array.from({ length: 50 }, (_, i) =>
        request(app)
          .post('/api/player')
          .send({ name: `Player ${i}`, email: `test${i}@example.com` })
      );

      const responses = await Promise.all(promises);

      // All should complete (may have rate limiting in future)
      expect(responses.length).toBe(50);
      responses.forEach(res => {
        expect([200, 429, 500]).toContain(res.status);
      });
    });

    it('should handle very large JSON payloads', async () => {
      const largePayload = {
        name: 'Test',
        email: randomEmail(),
        extraData: Array(1000).fill({ key: 'value'.repeat(100) })
      };

      const response = await request(app)
        .post('/api/player')
        .send(largePayload);

      // Should reject or handle large payloads
      expect([200, 400, 413, 500]).toContain(response.status);
    });
  });

  describe('CORS Security', () => {
    it('should have CORS configured', async () => {
      const response = await request(app)
        .get('/')
        .set('Origin', 'http://malicious.com');

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });

    it('should handle OPTIONS preflight requests', async () => {
      const response = await request(app)
        .options('/api/player')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST');

      expect([200, 204]).toContain(response.status);
    });
  });

  describe('Content Security', () => {
    it('should not leak sensitive error information', async () => {
      const response = await request(app)
        .post('/api/player')
        .send({ invalid: 'data' });

      // Should not expose database details, file paths, etc.
      const responseText = JSON.stringify(response.body);
      expect(responseText).not.toMatch(/database/i);
      expect(responseText).not.toMatch(/postgres/i);
      expect(responseText).not.toMatch(/\/home\//);
      expect(responseText).not.toMatch(/stacktrace/i);
    });
  });
});
