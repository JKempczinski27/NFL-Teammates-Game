// filepath: /Users/johnkempczinski/NFL-Teammates-Game/nfl-teamates-game/src/db.js
const { Pool } = require('pg');

const connectionString = 'postgresql://postgres:XvbxFpmIbqAnJSLlvTMlkdiLJauXpAWN@crossover.proxy.rlwy.net:43872/railway';

const pool = new Pool({
  connectionString,
});

async function getPlayers() {
  try {
    const result = await pool.query('SELECT name, email FROM players');
    return result.rows;
  } catch (error) {
    console.error('Error fetching players:', error);
    throw error;
  }
}

module.exports = { getPlayers };