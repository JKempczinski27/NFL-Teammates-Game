const { getPlayers } = require('./db');

async function testConnection() {
  try {
    const players = await getPlayers();
    console.log('Database connection successful. Players:', players);
  } catch (error) {
    console.error('Database connection failed:', error);
  }
}

testConnection();
