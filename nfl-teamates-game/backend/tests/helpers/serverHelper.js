/**
 * Server Helper for Testing
 * Manages Express server lifecycle for integration tests
 */

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

class ServerHelper {
  constructor() {
    this.app = null;
    this.server = null;
    this.pool = null;
    this.port = process.env.TEST_PORT || 8081;
  }

  /**
   * Create Express app without starting server
   */
  createApp() {
    const app = express();

    // DB connection
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
    });

    app.use(cors());
    app.use(express.json());

    // Health check route
    app.get('/', (req, res) => {
      res.send('Backend is running');
    });

    // Save player info
    app.post('/api/player', async (req, res) => {
      const { name, email } = req.body;
      try {
        await this.pool.query('INSERT INTO players (name, email) VALUES ($1, $2)', [name, email]);
        res.status(200).json({ message: 'Player saved successfully' });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error saving player' });
      }
    });

    // Test DB connection route
    app.get('/api/db-test', async (req, res) => {
      try {
        const result = await this.pool.query('SELECT NOW()');
        res.json({ connected: true, time: result.rows[0].now });
      } catch (err) {
        res.status(500).json({ connected: false, error: err.message });
      }
    });

    // Track route
    const trackRouter = require('../../routes/track');
    app.use('/api/track', trackRouter);

    this.app = app;
    return app;
  }

  /**
   * Start the server
   */
  async start() {
    if (!this.app) {
      this.createApp();
    }

    return new Promise((resolve) => {
      this.server = this.app.listen(this.port, () => {
        console.log(`Test server running on port ${this.port}`);
        resolve();
      });
    });
  }

  /**
   * Stop the server
   */
  async stop() {
    if (this.pool) {
      await this.pool.end();
    }

    if (this.server) {
      return new Promise((resolve) => {
        this.server.close(() => {
          console.log('Test server stopped');
          resolve();
        });
      });
    }
  }

  /**
   * Get app instance (for supertest)
   */
  getApp() {
    if (!this.app) {
      this.createApp();
    }
    return this.app;
  }

  /**
   * Get database pool
   */
  getPool() {
    return this.pool;
  }
}

module.exports = new ServerHelper();
