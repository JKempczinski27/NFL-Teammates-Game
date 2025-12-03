/**
 * Database Configuration
 * Centralized database connection pool
 */

const { Pool } = require('pg');
require('dotenv').config();

// Optimized DB connection pool for serverless environment (Vercel)
const isVercel = process.env.VERCEL === '1';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  // Connection pool optimization for serverless
  max: isVercel ? 1 : 20,
  min: isVercel ? 0 : 5,
  idleTimeoutMillis: isVercel ? 1000 : 30000,
  connectionTimeoutMillis: 10000,
  maxUses: 7500,
  allowExitOnIdle: isVercel ? true : false,
});

// Test connection on startup
pool.on('connect', () => {
  console.log('🔌 Database pool connection established');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database pool error:', err);
});

module.exports = pool;
