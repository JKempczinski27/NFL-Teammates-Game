const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:VcxTqkAJPhbAmJFSYJKBFvDeQofTGJqk@turntable.proxy.rlwy.net:42454/railway',
  ssl: {
    rejectUnauthorized: false, // Required for some hosted PostgreSQL services
  },
});

module.exports = pool;
