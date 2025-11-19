const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function getPlayers() {
  try {
    const result = await pool.query('SELECT * FROM players ORDER BY created_at DESC');
    return result.rows;
  } catch (error) {
    console.error('Error fetching players from database:', error);
    throw error;
  }
}

module.exports = { getPlayers, pool };
