const { getPlayers } = require('../src/db');

export default async function handler(req, res) {
  try {
    const players = await getPlayers();
    res.status(200).json(players);
  } catch (error) {
    console.error('Error fetching players:', error);
    res.status(500).json({ error: 'Failed to fetch players' });
  }
}
